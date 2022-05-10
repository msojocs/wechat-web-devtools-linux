#!/bin/bash

root_dir=$(cd `dirname $0`/.. && pwd -P)
# https://mirror.ghproxy.com/https://github.com/microsoft/ripgrep-prebuilt/releases/download/v12.1.1-1/ripgrep-v12.1.1-1-x86_64-unknown-linux-musl.tar.gz
cd $root_dir/tmp &&\
mkdir -p vscode-ripgrep/bin && cd vscode-ripgrep && \
wget https://gh2.yanqishui.work/https://github.com/microsoft/ripgrep-prebuilt/releases/download/v12.1.1-1/ripgrep-v12.1.1-1-x86_64-unknown-linux-musl.tar.gz -O ripgrep-v12.1.1-1-x86_64-unknown-linux-musl.tar.gz && \
tar xvf ripgrep-v12.1.1-1-x86_64-unknown-linux-musl.tar.gz -C ./bin