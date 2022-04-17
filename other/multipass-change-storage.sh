#!/bin/bash
# 由于var目录空间大小不够，故修改multipass镜像的存储位置
# https://github.com/canonical/multipass/pull/1789#issuecomment-704991752
# as root
snap stop multipass
snap connect multipass:removable-media  # for /mnt /media https://snapcraft.io/docs/removable-media-interface
snap connect multipass:all-home  # for /home/* https://snapcraft.io/docs/home-interface
mkdir -p /mnt/disk2/multipass
mkdir /etc/systemd/system/snap.multipass.multipassd.service.d/
tee /etc/systemd/system/snap.multipass.multipassd.service.d/override.conf <<EOF
[Service]
Environment=MULTIPASS_STORAGE=/mnt/disk2/multipass
EOF
systemctl daemon-reload
snap start multipass