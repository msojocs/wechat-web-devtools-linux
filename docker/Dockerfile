FROM debian:buster
LABEL maintainer="minun (minun@mewmew.cn)"

ENV LANG=C.UTF-8

# update repo sources
RUN set -ex; \
    cp /etc/apt/sources.list /etc/apt/sources.list.bak; \
    echo "deb http://mirrors.aliyun.com/debian buster main" > /etc/apt/sources.list; \
    echo "deb http://mirrors.aliyun.com/debian buster-updates main" >> /etc/apt/sources.list; \
    apt-get clean; \
    dpkg --add-architecture i386; \
    apt-get update;

RUN set -ex; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        apt-utils \
        dbus-x11 \
        libasound2 \
        libatk1.0-0 \
        libatomic1 \
        libcanberra-gtk3-module \
        libgconf-2-4 \
        libgtk3.0 \
        libnss3 \
        libupower-glib3 \
        libxtst6 \
        libx11-6 \
        libx11-xcb1 \
        libxss1 \
        libxrandr2 \
        mesa-utils \
        ttf-wqy-microhei \
        upower \
        wine \
        wine32 \
        wine-binfmt \
        xserver-xorg-video-all;

ADD wechat-devtools-compact-1.03.2008270.tar.gz /opt/wechat/devtools

COPY docker-entrypoint /opt/wechat/devtools/bin/docker-entrypoint

# COPY spdlog.docker.node /opt/wechat/devtools/package.nw/node_modules/spdlog/build/Release/spdlog.node
# COPY spdlog.docker.node /opt/wechat/devtools/package.nw/node_modules/spdlog-node/build/Release/spdlog.node

# RUN apt-get build-essential python libx11-dev pkg-config libxkbfile-dev
# RUN useradd -m minun

# xhost +
# docker run -t -i --rm -v /tmp/.X11-unix:/tmp/.X11-unix -e DISPLAY=$DISPLAY -v $HOME/.Xauthority:/root/.Xauthority wechat-devtools bash

