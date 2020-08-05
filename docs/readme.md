# MC-Gateway #
API-GW service expose an API for all the services Map-colonies exposed to the client

## Services ##


## Configuration ##
| Config Name                        | Description                                                      | ETCD Key                                                 | Default Value                             |
| ---------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------- |
| proxy.port                         | Port                                                             | _/configuration/apigw/proxy/port_                        | "80"                                      |
| proxy.domain                       | Domain                                                           | _/configuration/global/domain_                           | ""                                        |
| proxy.dnsHost                      | Dns Host                                                         | _/configuration/global/dnshost_                          | "sky-dns"                                 |
| proxy.basePathStartIndexInUrl      | Base Path Start Index In Url                                     | _/configuration/apigw/basepath/startindexinurl_          | "1"                                       |
| proxy.routingTableTTL              | Routing Table TTL                                                | _/configuration/apigw/routingtable/ttl_                  | "300000"                                  |
| swagger.swDomain                   | Swagger Domain                                                   | _/configuration/apigw/swagger/default/host_              | "app.domain:80/api-gw"                    |
| swagger.swPort                     | Swagger Port                                                     | _/configuration/apigw/swagger/port_                      | "81"                                      |
| swaggerApi.endPoint                | Swagger API Endpoint                                             | _/configuration/swaggerapi/swagger/host_                 | "http://app.domain:80/swagger-api-server" |
| log.level                          | Log Level                                                        | _/configuration/apigw/log/level_                         | "info"                                    |
| log.log2file                       | Log To File                                                      | _/configuration/apigw/log/log2file_                      | "false"                                   |
| server.port                        | Server Port                                                      | _/configuration/apigw/srv/port_                          | "80"                                      |
| useDns                             | Use Dns                                                          | _/configuration/apigw/use/dns_                           | "false"                                   |
| servicesList                       | Services Names that expose their API in API GW                   | _/configuration/apigw/serviceslist_                      | ""                                        |
| authenticatedServices.servicesList | subset of servicesList that require adding username from outside | _/configuration/apigw/authenticatedServices.servicesList | []                                        |
| authenticatedServices.active       | activeness of above                                              | _/configuration/apigw/authenticatedServices.active       | true                                      |
| hostOfServicesInside               | Host of the services inside kub                                  | _/configuration/swaggerapi/swagger/host_                 | "http://swagger-api-server:80"            |
| hostOfServicesOutside              | host of the services outside kub                                 | _/configuration/swaggerapi/swagger/host_                 | "http://app.domain:80/swagger-api-server" |

More detailed information can be found in swagger documentation of the exposed service.

# Credits
(c) 2020 map-colonies
