FROM node:16-alpine3.11
EXPOSE 3000

COPY yapi /vendors/yapi
WORKDIR /vendors/yapi
RUN ls -la
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
    && apk add --no-cache --virtual .fetch-deps \
        g++ \
        make \
        python3 \
    && npm install --production --registry https://registry.npm.taobao.org \
    && apk del .fetch-deps
ENTRYPOINT ["node", "server/app.js"]
