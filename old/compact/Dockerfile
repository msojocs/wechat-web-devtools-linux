FROM debian:stretch
LABEL maintainer="minun (minun@mewmew.cn)"

ENV LANG=C.UTF-8

# update repo sources
RUN set -ex; \
    cp /etc/apt/sources.list /etc/apt/sources.list.bak; \
    echo "deb http://mirrors.aliyun.com/debian/ stretch main" > /etc/apt/sources.list; \
    echo "deb http://mirrors.aliyun.com/debian/ stretch-updates main" >> /etc/apt/sources.list; \
    rm -rf /var/cache/apt/archives/lock \
    apt-get clean; \
    apt-get update --fix-missing;

RUN DEBIAN_FRONTEND=noninteractive \
    apt-get install -y --no-install-recommends \
        apt-utils \
        build-essential \
        ca-certificates \
        git \
        libx11-dev \
        libxkbfile-dev \
        pkg-config \
        python \
        p7zip-full

ADD runtime-mewjs.tar.gz /opt/mewjs
COPY node-v12.6.0-linux-x64.tar.gz /opt/wechat/cache/node-v12.6.0-linux-x64.tar.gz
COPY nwjs-sdk-v0.39.3-linux-x64.tar.gz /opt/wechat/cache/nwjs-sdk-v0.39.3-linux-x64.tar.gz
COPY wechat_devtools_1.03.2009140_x64.exe /opt/wechat/cache/wechat_devtools_1.03.2009140_x64.exe
COPY build /opt/wechat/cache/build

RUN chmod +x /opt/mewjs/bin/hako \
             /opt/mewjs/bin/mew \
             /opt/mewjs/bin/chan \
             /opt/mewjs/bin/mew_* \
             /opt/mewjs/bin/npm \
             /opt/mewjs/bin/npx

RUN set -ex; \
    useradd -m builder -s /bin/bash; \
    mkdir -p /opt/local/proj; \
    cd /opt/local/proj; \
    git clone https://github.com/dragonation/wechat-devtools.git; \
    mkdir -p /opt/local/proj/wechat-devtools/cache; \
    cd wechat-devtools; \
    cp -fr /opt/wechat/cache/* cache/; \
    cp -f /opt/wechat/cache/build build; \
    chmod -R 777 . 

ENV PATH=/opt/mewjs/bin:/usr/local/bin:/usr/bin:/bin

WORKDIR /opt/local/proj/wechat-devtools

# docker build -t wechat-devtools-compact-builder .
# docker run -ti --rm -v `pwd`:/opt/wechat/output wechat-devtools-compact-builder /bin/bash --login -i

# su builder
# export PATH=/opt/mewjs/bin:$PATH
# ./build
# cp wechat-devtools-compact.tar.gz /opt/wechat/output/wechat-devtools-1.03.2009140-compact.tar.gz
