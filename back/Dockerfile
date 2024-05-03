FROM python:3.11-slim-bullseye

COPY requirements.txt .

RUN apt-get update && \
    pip3 install -r requirements.txt && \
    rm requirements.txt

WORKDIR /core
COPY core .

RUN chmod +x wait-for-it.sh
RUN chmod +x script.sh
CMD ./script.sh