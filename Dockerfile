FROM node:16-alpine3.11
EXPOSE 3000

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
    && apk add --no-cache --virtual .fetch-deps \
        g++ \
        git \
        make \
        python3 \
    && git clone --depth=1 https://github.com/sazima/yapi.git /vendors \
    && cd /vendors/yapi && npm install --production --registry https://registry.npm.taobao.org \
    && apk del .fetch-deps
WORKDIR /vendors/yapi
ENTRYPOINT ["node", "server/app.js"]
