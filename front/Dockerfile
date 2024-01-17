FROM nginx:stable-bullseye-perl

COPY ./default.conf /etc/nginx/conf.d/default.conf

COPY ./html/*.html /usr/share/nginx/html/
COPY ./html/*.css /usr/share/nginx/html/
COPY ./html/*.js /usr/share/nginx/html/