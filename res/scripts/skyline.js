(() => {
    // 处理红蓝颜色通道反转的问题
    const originalTextImage2D = WebGLRenderingContext.prototype.texImage2D;
    WebGLRenderingContext.prototype.texImage2D = function (...args) {
        const buffer = args[8];
        for (let i=0; i<buffer.byteLength; i+=4) {
            // BGRA -> RGBA
            const b = buffer[i];
            buffer[i] = buffer[i + 2];
            buffer[i + 2] = b;
        }
        return originalTextImage2D.apply(this, args);
    };
})();