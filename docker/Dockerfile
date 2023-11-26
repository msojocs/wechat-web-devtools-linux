FROM ubuntu:20.04

WORKDIR /workspace
ARG DEBIAN_FRONTEND=noninteractive
RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
    sed -i 's/security.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
    sed -i 's/archive.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
    sed -i 's/security.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
    mkdir -p /build_temp/nodejs && \
    apt update  && \
    apt install -y binutils software-properties-common gcc g++ \
    gconf2 libxkbfile-dev p7zip-full make libssh2-1-dev libkrb5-dev wget curl python python3 \
    openssl pkg-config build-essential && \
    cd /build_temp/nodejs &&\
    apt-get update && apt-get install -y ca-certificates curl gnupg

RUN mkdir -p /etc/apt/keyrings && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg &&\
    NODE_MAJOR=16 &&\
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list &&\
    apt-get update && apt-get install nodejs -y &&\
    rm -rf /build_temp && \
    apt install -y gosu && \
    gosu nobody true && \
    useradd -s /bin/bash -m user

RUN apt remove -y p7zip p7zip-full p7zip-rar &&\
    rm -rf /opt/7z && \
    mkdir -p /opt/7z && \
    cd /opt/7z && \
    wget https://www.7-zip.org/a/7z2107-linux-x64.tar.xz && \
    tar -xJf 7z2107-linux-x64.tar.xz && \
    ln -s 7zz 7z
ENV PATH=/opt/7z:$PATH