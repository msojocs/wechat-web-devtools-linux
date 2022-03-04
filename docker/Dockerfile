FROM debian:9.13-slim

WORKDIR /workspace

RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
    sed -i 's/security.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
    sed -i 's/archive.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
    mkdir -p /build_temp/python36 /build_temp/nodejs && \
    apt update  && \
    apt install -y binutils software-properties-common gcc g++ \
    gconf2 libxkbfile-dev p7zip-full make libssh2-1-dev libkrb5-dev wget \
    openssl pkg-config build-essential && \
    cd /build_temp/python36 && \
    apt-get install -y aptitude &&\
    aptitude -y install gcc make zlib1g-dev libffi-dev libssl-dev &&\
    mkdir -p test && cd test &&\
    wget http://npm.taobao.org/mirrors/python/3.6.5/Python-3.6.5.tgz &&\
    tar -xvf Python-3.6.5.tgz &&\
    chmod -R +x Python-3.6.5 &&\
    cd Python-3.6.5/ &&\
    ./configure &&\
    aptitude -y install  libffi-dev libssl-dev &&\
    make && make install &&\
    cd /build_temp/nodejs &&\
    wget https://deb.nodesource.com/setup_16.x &&\
    chmod +x setup_16.x &&\
    ./setup_16.x &&\
    apt-get install -y nodejs &&\
    rm -rf /build_temp && \
    apt install -y gosu && \
    gosu nobody true && \
    useradd -s /bin/bash -m user
