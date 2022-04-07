#!/bin/sh 
export PATH="/var/run/host/usr/bin:$PATH"
export LD_LIBRARY_PATH="/app/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"
exec /app/opt/bin/wechat-devtools