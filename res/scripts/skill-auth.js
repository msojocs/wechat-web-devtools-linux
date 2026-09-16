const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const http = require('node:http');
const path = require('node:path');
const { URLSearchParams } = require('node:url');

// Linux equivalent of the bundled authorization callback protocol.
async function runSkillAuth(clientName, timeoutMs = 30_000) {
    if (typeof clientName !== 'string' || !clientName) {
        return { ok: false, clientName, errorType: 'INPUT_ERROR', message: 'missing --client-name (-c)' };
    }
    if (clientName.length > 128) {
        return { ok: false, clientName, errorType: 'INPUT_ERROR', message: 'clientName is too long' };
    }

    const taskId = 'auth_' + crypto.randomBytes(24).toString('hex');
    let callbackServer;
    try {
        callbackServer = await createCallbackServer(taskId, timeoutMs);
        const authUrl = 'wechatide://skill/auth?' + new URLSearchParams({
            clientName,
            taskId,
            callbackPort: callbackServer.port.toString(),
            cli: '1',
        }).toString();

        await launchDevTools(authUrl);
        return await callbackServer.handshake;
    } catch (error) {
        return {
            ok: false,
            clientName,
            errorType: 'CONNECT_ERROR',
            message: error.message || 'Failed to start or connect to WechatIDE authorization',
        };
    } finally {
        if (callbackServer) {
            await callbackServer.close().catch(error => {
                console.error('close auth callback server failed: ' + (error.message || error));
            });
        }
    }
}

async function createCallbackServer(taskId, timeoutMs) {
    let resolveHandshake;
    let rejectHandshake;
    const handshake = new Promise((resolve, reject) => {
        resolveHandshake = resolve;
        rejectHandshake = reject;
    });
    const callbackPath = '/skill/auth/callback/' + encodeURIComponent(taskId);
    const server = http.createServer((request, response) => {
        if (request.method !== 'POST' || request.url !== callbackPath) {
            response.statusCode = 404;
            response.end();
            return;
        }
        const chunks = [];
        let receivedBytes = 0;
        let tooLarge = false;
        request.on('data', chunk => {
            if (tooLarge) return;
            receivedBytes += chunk.length;
            if (receivedBytes > 65_536) tooLarge = true;
            else chunks.push(chunk);
        });
        request.on('end', () => {
            if (tooLarge) {
                response.statusCode = 413;
                response.end();
                return;
            }
            try {
                const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                if (result.taskId !== taskId) {
                    response.statusCode = 400;
                    response.end();
                    return;
                }
                response.statusCode = 204;
                response.end();
                resolveHandshake(result);
            } catch (error) {
                response.statusCode = 400;
                response.end();
            }
        });
    });

    await new Promise((resolve, reject) => {
        const onError = error => reject(error);
        server.once('error', onError);
        server.listen(0, '127.0.0.1', () => {
            server.removeListener('error', onError);
            resolve();
        });
    });
    const address = server.address();
    if (!address || typeof address === 'string') {
        await new Promise(resolve => server.close(() => resolve()));
        throw new Error('failed to resolve auth callback port');
    }
    const timer = setTimeout(() => {
        rejectHandshake(new Error('wait WechatIDE authorization timeout'));
    }, timeoutMs);
    handshake.then(() => clearTimeout(timer), () => clearTimeout(timer));
    return {
        port: address.port,
        handshake,
        close: () => new Promise((resolve, reject) => {
            clearTimeout(timer);
            server.closeAllConnections();
            if (!server.listening) return resolve();
            server.close(error => error ? reject(error) : resolve());
        }),
    };
}

function launchDevTools(authUrl) {
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    const command = path.join(process.env.WECHAT_DEVTOOLS_DIR || path.dirname(process.execPath), 'electron');
    return new Promise((resolve, reject) => {
        const child = childProcess.spawn(command, [global.installPath, authUrl, '--cli'], {
            detached: true, stdio: 'ignore', env,
        });
        child.once('error', reject);
        child.once('spawn', () => { child.unref(); resolve(); });
    });
}

async function startSkillAuth({ clientName }, { emitSkillCallFailure }) {
    const result = await runSkillAuth(clientName);

    if (result.status === 'pending' && result.taskId) {
        printJson({
            ok: true,
            taskId: result.taskId,
            status: result.status,
            clientName,
            port: result.port,
            message: 'Waiting for user authorization.',
        });
        process.exit(0);
    }

    if (!result.ok) {
        const errorType = result.errorType || 'AUTH_ERROR';
        const source = errorType === 'INPUT_ERROR'
            ? 'input'
            : errorType === 'CONNECT_ERROR' ? 'connect' : 'auth';
        const reason = errorType === 'INPUT_ERROR'
            ? 'missing_client'
            : errorType === 'CONNECT_ERROR'
                ? 'connect_failed'
                : errorType === 'AUTH_DENIED' ? 'auth_denied' : 'auth_failed';

        emitSkillCallFailure(errorType, result.message || 'authorization failed', source, {
            clientName,
            detail: result.detail,
            reason,
        });
        return;
    }

    printJson({
        ok: true,
        authorized: true,
        status: result.status || 'success',
        clientName,
        alreadyTrusted: result.alreadyTrusted === true,
        port: result.port,
        tokenRequired: result.tokenRequired === true,
    });
    process.exit(0);
}

function printJson(value) {
    process.stdout.write(JSON.stringify(value, null, 2) + '\n');
}

module.exports = { runSkillAuth, startSkillAuth };
