#!/bin/bash
set -e

# Pull LETSENCRYPT_EMAIL (and anything else) from .env, same file
# docker compose already reads its own vars from.
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

domains=(jejaku.my jejaku-receipt.jejaku.my)
rsa_key_size=4096
data_path="./certbot"
email="${LETSENCRYPT_EMAIL:?Set LETSENCRYPT_EMAIL in .env}"
staging=0 # set to 1 to test against Let's Encrypt staging (avoids rate limits)

if [ -d "$data_path" ]; then
  read -p "Existing $data_path found. Continue and replace existing certs? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

echo "### Creating dummy certificates for $domains ..."
for domain in "${domains[@]}"; do
  path="/etc/letsencrypt/live/$domain"
  mkdir -p "$data_path/conf/live/$domain"
  docker compose run --rm --entrypoint "\
    openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
      -keyout '$path/privkey.pem' \
      -out '$path/fullchain.pem' \
      -subj '/CN=localhost'" certbot
done

echo "### Starting nginx ..."
docker compose up -d nginx

echo "### Deleting dummy certificates for $domains ..."
for domain in "${domains[@]}"; do
  docker compose run --rm --entrypoint "\
    rm -Rf /etc/letsencrypt/live/$domain && \
    rm -Rf /etc/letsencrypt/archive/$domain && \
    rm -Rf /etc/letsencrypt/renewal/$domain.conf" certbot
done

case "$staging" in
  1) staging_arg="--staging" ;;
  *) staging_arg="" ;;
esac

echo "### Requesting Let's Encrypt certificates ..."
for domain in "${domains[@]}"; do
  docker compose run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
      $staging_arg \
      -d $domain \
      --email $email \
      --rsa-key-size $rsa_key_size \
      --agree-tos \
      --force-renewal" certbot
done

echo "### Reloading nginx ..."
docker compose exec nginx nginx -s reload
