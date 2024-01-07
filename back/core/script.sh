#!/bin/bash

python3 manage.py makemigrations --no-input

python3 manage.py migrate --no-input

#We are not going to use static since nginx will handle the frontend
#python3 manage.py collectstatic --no-input

#Use wsgi when going to production
python3 manage.py runserver 0.0.0.0:8000