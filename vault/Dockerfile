FROM vault:1.13.3

ENV VAULT_ADDR='https://localhost:8201'
ENV VAULT_API_ADDR='https://localhost:8200'

COPY . .

RUN chmod 777 workflow-vault.sh && \
	sh workflow-vault.sh

CMD vault server -config=./config.hcl