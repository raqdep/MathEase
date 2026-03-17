#!/bin/bash
# Usage: bash ec2-update-env-key.sh KEY_NAME KEY_VALUE
NAME="$1"
VALUE="$2"
ENV_FILE="/var/www/MathEase/.env"
if [ -z "$NAME" ] || [ -z "$VALUE" ]; then
  echo "Usage: $0 KEY_NAME KEY_VALUE"
  exit 1
fi
if grep -q "^${NAME}=" "$ENV_FILE" 2>/dev/null; then
  sed -i "s|^${NAME}=.*|${NAME}=${VALUE}|" "$ENV_FILE"
else
  echo "${NAME}=${VALUE}" >> "$ENV_FILE"
fi
chown www-data:www-data "$ENV_FILE"
chmod 640 "$ENV_FILE"
echo "Set $NAME in .env"
