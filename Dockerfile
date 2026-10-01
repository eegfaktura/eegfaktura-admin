# Basis gepinnt statt :latest - sonst zieht jeder Build eine beliebige neue
# Caddy-Version, ohne dass es jemand merkt. Gleiche Version wie eegfaktura-web.
FROM caddy:2.8.4

ADD build /var/www/html/registration-web/

ADD caddy.conf /etc/caddy/Caddyfile
ADD keycloak-config.json /srv

#VOLUME /var/www/html/registration-web/config

# Nicht als root laufen (Befund A06 der Altsystem-Analyse).
# Caddy lauscht laut caddy.conf oberhalb von 1024 - es braucht dafuer keine
# Privilegien. /data und /config sind Caddys XDG-Pfade und muessen dem Benutzer
# gehoeren, sonst scheitert der Start beim Anlegen seines Zustands.
# Die ausgelieferten Dateien unter /var/www bleiben root-eigen; Caddy liest sie nur.
RUN addgroup -g 1000 -S app \
 && adduser -u 1000 -S app -G app \
 && chown -R app:app /data /config
USER app
