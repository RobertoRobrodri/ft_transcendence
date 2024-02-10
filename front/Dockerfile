FROM nginx:stable-bullseye-perl

COPY ./default.conf /etc/nginx/conf.d/default.conf

# TODO change to a propper structure
COPY ./html/*.html /usr/share/nginx/html/
COPY ./html/*.css /usr/share/nginx/html/
COPY ./html/*.js /usr/share/nginx/html/