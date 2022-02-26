FROM node:16.13.1

RUN echo "\
    deb https://mirrors.tuna.tsinghua.edu.cn/debian/ buster main contrib non-free\
    # deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ buster main contrib non-free
    deb https://mirrors.tuna.tsinghua.edu.cn/debian/ buster-updates main contrib non-free\
    # deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ buster-updates main contrib non-free
    deb https://mirrors.tuna.tsinghua.edu.cn/debian/ buster-backports main contrib non-free\
    # deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ buster-backports main contrib non-free
    deb https://mirrors.tuna.tsinghua.edu.cn/debian-security buster/updates main contrib non-free\
    # deb-src https://mirrors.tuna.tsinghua.edu.cn/debian-security buster/updates main contrib non-free
    "> /etc/apt/sources.list && apt-get clean && \
    apt-get update && set -eux; \
    apt-get update; \
    apt-get install -y gosu libx11-dev libxkbfile-dev p7zip-full; \
    rm -rf /var/lib/apt/lists/*; \
    # verify that the binary works
    gosu nobody true;

WORKDIR /workspace