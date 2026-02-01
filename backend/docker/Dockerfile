FROM ubuntu:22.04

RUN apt update && apt install -y \
  bash \
  coreutils \
  util-linux \
  iproute2 \
  procps \
  nano \
  vim \
  && apt clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /home/student

# ⭐ สำคัญที่สุด: กัน container ตาย
CMD ["tail", "-f", "/dev/null"]
