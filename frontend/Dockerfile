# 前端 Dockerfile
FROM nginx:alpine

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 直接复制静态文件到 nginx 目录
COPY public /usr/share/nginx/html

EXPOSE 9999