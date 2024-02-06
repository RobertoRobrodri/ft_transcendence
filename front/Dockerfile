FROM nginx:stable-bullseye-perl

COPY ./default.conf /etc/nginx/conf.d/default.conf

COPY ./html/*.html /usr/share/nginx/html/
COPY ./styles/*.css /usr/share/nginx/html/
COPY ./scripts/*.js /usr/share/nginx/html/