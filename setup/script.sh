#!/bin/bash
# wait to service elasticsearch is ready
max_attempts=$((5 * 60))
attempt=1

while [ $attempt -le $max_attempts ]; do
  curl -s -X GET "http://elasticsearch:9200" -u $ELASTIC_USER:$ELASTIC_PASS > /dev/null
  if [ $? -eq 0 ]; then
    echo "Elasticsearch is up!"
    break
  else
    echo "Waiting for Elasticsearch to be available... Attempt $attempt of $max_attempts."
  fi
  sleep 1
  attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
  echo "Elasticsearch did not become available within 5 minutes."
  exit 1
fi
JSON_PAYLOAD=$(cat <<EOF
{
  "password": "${KIBANA_SYSTEM_PASSWORD}"
}
EOF
)
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://elasticsearch:9200/_security/user/kibana_system/_password" -H "Content-Type: application/json" -u $ELASTIC_USER:$ELASTIC_PASS -d "$JSON_PAYLOAD")
if [ $response -eq 200 ]; then
  echo "Kibana system password updated!"
else
  echo "Response: $response"
  echo "Failed to update kibana system password"
fi
