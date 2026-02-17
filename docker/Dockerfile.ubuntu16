FROM ubuntu:16.04

WORKDIR /workspace

RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
    sed -i 's/security.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
    sed -i 's/security.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
    sed -i 's/archive.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
    mkdir -p /build_temp/python36 /build_temp/nodejs && \
    apt update  && \
    apt install -y binutils software-properties-common \
    gconf2 libxkbfile-dev p7zip-full make libssh2-1-dev libkrb5-dev wget curl \
    openssl pkg-config build-essential && \
    add-apt-repository ppa:ubuntu-toolchain-r/test && \
    apt update && \
    apt install -y gcc-9 g++-9 lld && \
    update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-9 90 --slave /usr/bin/g++ g++ /usr/bin/g++-9 && \
    cd /build_temp/python36 && \
    apt-get install -y aptitude &&\
    aptitude -y install gcc make zlib1g-dev libffi-dev libssl-dev &&\
    mkdir -p test && cd test &&\
    wget http://npmmirror.com/mirrors/python/3.8.10/Python-3.8.10.tgz &&\
    tar -xvf Python-3.8.10.tgz &&\
    chmod -R +x Python-3.8.10 &&\
    cd Python-3.8.10/ &&\
    ./configure &&\
    aptitude -y install  libffi-dev libssl-dev &&\
    make && make install &&\
    cd /build_temp/nodejs &&\
    wget https://deb.nodesource.com/setup_16.x &&\
    chmod +x setup_16.x &&\
    ./setup_16.x &&\
    apt-get install -y nodejs &&\
    rm -rf /build_temp && \
    apt install -y gosu unzip python && \
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