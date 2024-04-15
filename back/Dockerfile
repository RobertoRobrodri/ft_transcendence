FROM python:3.11-slim-bullseye

COPY . .
#TODO Remove --allow-insecure-repositories
RUN apt-get update --allow-insecure-repositories && \
    pip3 install -r requirements.txt && \
    rm requirements.txt

WORKDIR /core

RUN chmod +x wait-for-it.sh
RUN chmod +x script.sh
CMD ./script.sh