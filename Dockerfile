FROM mhart/alpine-node:8
MAINTAINER binsee <binsee@163.com>

RUN mkdir -p /app/prod
WORKDIR /app
COPY package.json /app

## 安装及设置时区
RUN apk add --no-cache tzdata \
  && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
  && echo 'Asia/Shanghai' >/etc/timezone

RUN npm config set registry https://registry.npm.taobao.org
RUN npm install --production
COPY . /app

ENV NODE_ENV 'production'
ENV CONFIG_FILE '/app/prod/prod_config.js'
ENV CONFIG '{}'

RUN npm run build

VOLUME [ "/root/logs" ]
VOLUME [ "/app/prod" ]
VOLUME [ "/app/resources/static" ]

EXPOSE 7001

CMD [ "npm", "start" ]

