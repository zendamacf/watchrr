#!/bin/sh
set -eu

echo 'Running cron-entrypoint.sh'

if [ -z "${CRON_SECRET:-}" ]; then
  echo 'CRON_SECRET must be set for the cron container' >&2
  exit 1
fi

# crond does not pass container env into jobs; define vars in the crontab file.
{
  printf 'CRON_SECRET=%s\n' "$CRON_SECRET"
  cat /etc/cron.schedule
} > /etc/crontabs/root
chmod 600 /etc/crontabs/root

exec crond -f -l 2
