#!/bin/sh
set -eu
if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/data /app/uploads
  chown -R node:node /app/data /app/uploads
  exec gosu node "$0" "$@"
fi
npm run db:migrate
if [ "${SEED_DEMO:-false}" = "true" ]; then
  npm run db:seed
fi
npm run admin
exec "$@"
