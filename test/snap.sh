#!/bin/bash
set -e
cd "/mnt/disk1/GitHub/wechat-devtools-linux"
snapcraft #--http-proxy="http://192.168.249.236:7890" --https-proxy="http://192.168.249.236:7890"
snap install wechat-devtools_0.1_amd64.snap --devmode
wechat-devtools