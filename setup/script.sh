#!/bin/bash
# wait to service elasticsearch is ready
# change log directory permissions needed on linux system
chmod 777 /var/nginx
chmod 777 /var/db

# Delete past logs
rm /var/nginx/*.log
rm /var/db/*.log

max_attempts=$((5 * 60))
attempt=1

while [ $attempt -le $max_attempts ]; do
  curl -s -X GET "http://elasticsearch:9200" -u $ELASTIC_USER:$ELASTIC_PASSWORD > /dev/null
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
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://elasticsearch:9200/_security/user/kibana_system/_password" -H "Content-Type: application/json" -u $ELASTIC_USER:$ELASTIC_PASSWORD -d "$JSON_PAYLOAD")
if [ $response -eq 200 ]; then
  echo "Kibana system password updated!"
else
  echo "Response: $response"
  echo "Failed to update kibana system password"
fi

# Data policy to delete logs after 3 days
curl -X PUT "http://elasticsearch:9200/_ilm/policy/three_days_policy" -H 'Content-Type: application/json' -u $ELASTIC_USER:$ELASTIC_PASSWORD -d'
{
  "policy": {
    "phases": {
      "delete": {
        "min_age": "3d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}'

# Template logs creation to index with data policy
curl -X PUT "http://elasticsearch:9200/_index_template/my_template" -H 'Content-Type: application/json' -u $ELASTIC_USER:$ELASTIC_PASSWORD -d'
{
  "index_patterns": ["postgresql-*", "nginx-*", "django-*"],
  "template": {
    "settings": {
      "index.lifecycle.name": "three_days_policy"
    }
  }
}'
