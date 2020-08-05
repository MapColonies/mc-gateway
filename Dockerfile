ARG DOCKER_REGISTRY
ARG BASE_IMAGE

FROM ${DOCKER_REGISTRY}/${BASE_IMAGE} 

ADD . /service
WORKDIR /service

RUN npm install --production

RUN chmod +x run.sh && mkdir -p /etc/confd/{conf.d,templates}

COPY ./confd/*.toml /etc/confd/conf.d/
COPY ./confd/*.tmpl /etc/confd/templates/

EXPOSE 3004 5859
# CMD node --debug=5859 --nolazy index.js
CMD ./run.sh

