#!/bin/bash

# Start vault
vault server -config config.hcl

# Export values
export VAULT_ADDR='https://localhost:8201'
export VAULT_SKIP_VERIFY='true'

# Enable kv
vault secrets enable -version=1 kv

# Enable userpass and add default user
# vault auth enable userpass
# vault policy write spring-policy spring-policy.hcl
# vault write auth/userpass/users/admin password=${SECRET_PASS} policies=spring-policy

# Add test value to secrets
# vault kv put kv/client_id value=${CLIENT_ID}
# vault kv put kv/client_secret value=${CLIENT_SECRET}
# vault kv put kv/CLIENT_SECRET my-value=s3cr3t