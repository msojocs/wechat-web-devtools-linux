#!/bin/bash
docker run -it \
  --restart=always \
  --hostname="$(hostname)" \
  --env="DISPLAY" \
  --platform="linux/amd64" \
  --volume="${XAUTHORITY:-${HOME}/.Xauthority}:/root/.Xauthority:ro" \
  --volume="/tmp/.X11-unix:/tmp/.X11-unix:ro" \
  --volume="/dev/shm:/dev/shm" \
  --volume="./.wine:/root/.wine" \
  -p 3001:3001 \
  --name skyline_server \
  ghcr.io/msojocs/skyline-client-server:master