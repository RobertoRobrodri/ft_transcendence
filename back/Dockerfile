FROM python:3.11.5-slim-bullseye

COPY . .

RUN apt-get update && \
	apt-get install -y libpq-dev && \
	pip3 install -r requirements.txt && \
	rm requirements.txt

WORKDIR core

CMD ./script.sh