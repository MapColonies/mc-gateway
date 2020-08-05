#!/bin/bash
set -e

eval "echo \"$(cat /service/confd/production.tmpl)\"" > /service/confd/production.tmpl
eval "echo \"$(cat /service/confd/production.toml)\"" > /service/confd/production.toml

cp /service/confd/*.toml /etc/confd/conf.d/
cp /service/confd/*.tmpl /etc/confd/templates/

confd -onetime -backend ${CONFD_BACKEND:-env}

cat /service/config/production.json

npm start

