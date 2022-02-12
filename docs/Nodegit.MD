NodeJS v16.x下安装nodegit
1. `apt-get install -y python2 python3 libkrb5-dev gcc openssl libssh2-1-dev g++ make`
2. `npm install nodegit`

## docker-compose.yaml
```yaml
version: "3"
services:
  wechat_devtools:
    image: node:16.13.1-slim
    volumes:
      - .:/workspace
    entrypoint: /workspace/docker/entrypoint
```

## entrypoint
```bash
#!/bin/bash
cd /workspace
apt update
apt-get install -y python2 python3 libkrb5-dev gcc openssl libssh2-1-dev g++ make

echo "start"
npm install nodegit --registry=https://registry.npm.taobao.org

npm uninstall nodegit
```