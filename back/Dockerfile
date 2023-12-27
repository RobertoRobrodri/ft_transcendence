FROM python:3.11.5-slim-bullseye

COPY requirements.txt .

RUN apt-get update && \
	apt-get install -y libpq-dev && \
	pip3 install -r requirements.txt && \
	rm requirements.txt

COPY . .

CMD ./script.sh