FROM ubuntu:16.04

#ADD sources.list /etc/apt/sources.list

RUN apt-get update && \
    apt-get install -y curl supervisor software-properties-common python-software-properties && \
    add-apt-repository ppa:max-c-lv/shadowsocks-libev && apt-get update && \
    apt-get install -y shadowsocks-libev && \
    curl -sL https://deb.nodesource.com/setup_6.x | bash - && \
    apt-get install -y nodejs && \
    npm i -g shadowsocks-manager && \
    echo "Asia/Shanghai" > /etc/timezone && \
    rm /etc/localtime
RUN dpkg-reconfigure -f noninteractive tzdata
#EXPOSE 50000-60000

#ENTRYPOINT ["/usr/bin/ssmgr"]

#RUN npm i -g shadowsocks-manager --unsafe-perm

#ADD ./code /var/www/shadowsocks-manager
ADD ./config /etc/shadowsocks
ADD ./supervisor /etc/supervisor
ADD ./entry.sh .

ENTRYPOINT ["bash", "./entry.sh"]
