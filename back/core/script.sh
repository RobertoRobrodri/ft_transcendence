#!/bin/bash

./wait-for-it.sh db:5432 -t 60

python3 manage.py makemigrations --no-input

python3 manage.py migrate --no-input

#We are not going to use static since nginx will handle the frontend
#python3 manage.py collectstatic --no-input

openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt -subj "/C=ES/L=Madrid/CN=localhost"
#Use wsgi when going to production
#export DJANGO_SETTINGS_MODULE=core.settings
# pass flag -v 3 to daphne for verbose option
daphne -e ssl:8000:privateKey=/etc/ssl/private/nginx-selfsigned.key:certKey=/etc/ssl/certs/nginx-selfsigned.crt core.asgi:application
# python3 manage.py runserver 0.0.0.0:8000
