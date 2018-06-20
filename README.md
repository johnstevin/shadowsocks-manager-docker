

[在线示例](http://35.201.195.126:4002)

---

这是一个基于 [shadowsocks-manager webui 插件](https://github.com/shadowsocks/shadowsocks-manager) 开发的shadowsocks账号售卖网站的Docker镜像

此镜像发布在 [DockerHub](https://hub.docker.com/r/chxj1992/shadowsocks-manager-docker/) 上，国内访问 `DockerHub` 速度缓慢，建议使用 `DaoCloud` 或 `阿里云` 提供的加速器来下载镜像


### 版本

* 1.0


### 快速开始

启动Docker镜像

`docker run --rm -it --name shadowsocks-manager -p 4002:4002 johnstevin/shadowsocks-manager-docker:1.0`

在浏览器中访问 `http://localhost:4002` 


### 默认端口

* `8388` shadowsocks ssserver，shadowsocks服务端口
* `4001` shadowsocks ss-manager，shadowsocks api 端口
* `4002` shadowsocks-manager 网站端口
* `9001` supervisor 管理UI端口


### 目录

* `/etc/supervisor` supervisord 配置目录，详见 [supervisor文档](http://supervisord.org/introduction.html)
* `/etc/shadowsocks` shadowsocks 以及 shadowsocks-manager 配置目录，[详见shadowsocks-manager文档]
* `/root/.ssmgr` shadowsocks-manager 数据文件目录
* `/var/www/shadowsocks-manager` shadowsocks-manager 代码目录，可修改该目录中文件，对项目进行二次开发


### docker-compose.yml 配置示例

也可以选择通过 `docker-compose` 根据如下配置文件启动项目

``` yaml 

version: '2'

services:
  shadowsocks-manager:
    images: johnstevin/shadowsocks-manager-docker
    container_name: shadowsocks-manager
    ports:
      - "8388:8388"
      - "4001:4001"
      - "4002:4002"
      - "9001:9001"
      - "6001:6001"
      - "50000-50100:50000-50100"
    #volumes: 
      #- ./supervisor:/etc/supervisor
      #- ./config:/etc/shadowsocks
      #- ./data:/root/.ssmgr:rw 这里权限有问题，无法启动ssmgr
      #- ./code:/var/www/shadowsocks-manager
    links:
      - mysql
    restart: always

  mysql:
    build: ./mysql
    container_name: mysql
    ports:
      - "3306:3306"
    hostname: docker-mysql
    volumes:
      - "./mysql/data:/var/lib/mysql:rw"  #todo权限的问题无法解决
    env_file: .env
    environment:
      TZ: Asia/Chongqing
      restart: always
  
```

