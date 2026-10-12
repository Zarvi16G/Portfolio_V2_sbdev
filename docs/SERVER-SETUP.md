# Puesta en marcha en el VPS: santiagoboada.dev con Docker + GHCR + GitHub Actions

Esta guía es para ti: la ejecutas tú en el VPS y en GitHub. En el repo no hay secretos ni nada que se conecte solo al servidor.

**Cómo queda:**

```
visitante → Cloudflare (proxy, Full strict) → Nginx del host :443 (certificado GoDaddy, HSTS, IP real)
         → contenedor santiagoboada-portfolio en 127.0.0.1:8081 (Nginx sin root, puerto 8080 interno)
```

Cada despliegue: empujas un tag `v*` (o lo lanzas a mano) → Actions construye la imagen y la sube a `ghcr.io/zarvi16g/santiagoboada-portfolio:AAAAMMDD-HHMM-sha` → **tú apruebas** → Actions entra por SSH como `deploy` con una llave que **solo** puede ejecutar `/opt/portfolio/deploy.sh <tag>` → el script descarga, arranca, espera a que esté sano y, si no lo está, vuelve solo a la versión anterior.

En los comandos, `<IP_VPS>` es la IP pública del servidor y `<tu-usuario>` tu usuario de administración (el que usas hoy con sudo).

## Orden recomendado

Los pasos están numerados por tema, pero conviene hacerlos en este orden para que el sitio nunca quede caído:

1. Pasos **1 → 6** (diagnóstico, respaldo, usuario, llave, `/opt/portfolio`, login en GHCR).
2. Pasos **8 → 10** (secrets, environment `production`, Cloudflare).
3. **Primer despliegue** (sección "Primer despliegue", al final): Actions construye la imagen y se detiene esperando tu aprobación. Con ese tag arrancas el contenedor a mano en el servidor.
4. Paso **7** (Nginx): cambias el sitio viejo por el nuevo cuando el contenedor ya responde en `127.0.0.1:8081`.
5. Apruebas el job en GitHub: vuelve a desplegar el mismo tag (no cambia nada) y el chequeo final ya ve la página nueva con su CSP.

---

## 1. Diagnóstico (solo lectura)

Nada de esto cambia el servidor.

```bash
# Docker y compose
docker --version
docker compose version

# contenedores y sus puertos
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'

# qué escucha en cada puerto (y qué proceso)
sudo ss -tlnp

# Nginx: versión, sitios activos y dónde aparece santiagoboada
nginx -v
ls -l /etc/nginx/sites-enabled/
sudo grep -rn "santiagoboada" /etc/nginx/
sudo nginx -T 2>/dev/null | grep -nE 'server_name|listen|root|proxy_pass|ssl_certificate'

# firewall
sudo ufw status numbered
```

**Certificado de GoDaddy.** Toma la ruta de `ssl_certificate` del sitio actual (salió en el `nginx -T` de arriba) y revisa cuándo vence y si cubre también `www`:

```bash
CERT=/ruta/que/salio/en/ssl_certificate      # cámbiala
sudo openssl x509 -enddate -noout -in "$CERT"
sudo openssl x509 -noout -ext subjectAltName -in "$CERT"   # debe listar santiagoboada.dev y www.santiagoboada.dev
```

Si el certificado **no** incluye `www`, el bloque de `www` necesita otro certificado (o Cloudflare puede redirigir `www` antes de llegar al servidor: regla "Redirect Rules" de `www.santiagoboada.dev/*` a `https://santiagoboada.dev/$1`). Anótalo antes de seguir.

**¿Está libre el puerto 8081?**

```bash
sudo ss -tlnp | grep ':8081 ' || echo "8081 libre"
```

Si está ocupado, elige otro (por ejemplo 8082, comprobando igual que esté libre) y cámbialo en **dos** sitios antes de copiarlos: `deploy/docker-compose.yml` (`"127.0.0.1:8082:8080"`) y `deploy/nginx-santiagoboada.conf` (`proxy_pass http://127.0.0.1:8082;`).

## 2. Respaldo del sitio actual

```bash
B=~/backups/santiagoboada-$(date +%F)
mkdir -p "$B"

# toda la configuración de Nginx, tal como está hoy
sudo tar czf "$B/nginx-etc.tar.gz" -C /etc nginx

# el archivo del sitio actual (el nombre salió en el diagnóstico)
sudo cp -a /etc/nginx/sites-available/<archivo-del-sitio-actual> "$B/"

# los archivos del sitio actual (la ruta es su "root" en Nginx)
sudo tar czf "$B/sitio-actual.tar.gz" -C <root-del-sitio-actual> .

sudo chown -R "$USER": "$B"
ls -lh "$B"
```

Si el sitio actual es un contenedor en vez de archivos, respalda su `docker-compose.yml` y apunta el nombre de su imagen (`docker ps`).

## 3. Usuario `deploy` (sin contraseña y sin sudo)

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy
id deploy            # debe salir el grupo docker y NO sudo
```

**Ojo: estar en el grupo `docker` equivale casi a ser root.** Quien puede hablar con Docker puede arrancar un contenedor que monte `/` del host y cambiar cualquier archivo. Por eso este usuario no debe poder abrir una consola por SSH. Eso lo resuelve el paso 4: la llave de GitHub queda **restringida** a un único comando (`deploy.sh`), sin terminal (`no-pty`) ni túneles (`no-port-forwarding`, `no-agent-forwarding`, `no-X11-forwarding`). Aunque alguien robara la llave, lo único que podría hacer es pedir el despliegue de un tag con el formato `AAAAMMDD-HHMM-sha` de una imagen de **tu** registro privado; cualquier otro texto se rechaza. El usuario no tiene contraseña, así que tampoco se puede entrar por contraseña.

## 4. Llave SSH nueva, solo para GitHub

Créala **en tu computador** (no en el servidor). No le pongas frase de paso: la usa GitHub Actions sin nadie delante.

```bash
ssh-keygen -t ed25519 -C "github-actions-santiagoboada" -f ~/.ssh/santiagoboada_deploy -N ""
cat ~/.ssh/santiagoboada_deploy.pub      # la pública: va al servidor
```

En el servidor, con la línea completa de la pública (empieza por `ssh-ed25519 AAAA…`):

```bash
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
echo 'command="/opt/portfolio/deploy.sh",no-pty,no-port-forwarding,no-agent-forwarding,no-X11-forwarding ssh-ed25519 AAAA…PEGA-AQUÍ… github-actions-santiagoboada' \
  | sudo tee /home/deploy/.ssh/authorized_keys > /dev/null
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

La privada (`~/.ssh/santiagoboada_deploy`) solo va a GitHub (paso 8). Cuando esté cargada, puedes borrarla de tu computador o guardarla en tu gestor de contraseñas.

## 5. `/opt/portfolio`

Desde tu computador, en la carpeta del repo:

```bash
scp deploy/docker-compose.yml deploy/deploy.sh <tu-usuario>@<IP_VPS>:/tmp/
```

En el servidor:

```bash
# carpeta del grupo deploy, con sticky bit: deploy crea sus archivos (.env, deploy.log)
# pero no puede borrar ni cambiar los de root (deploy.sh, docker-compose.yml)
sudo install -d -m 1770 -o root -g deploy /opt/portfolio
sudo install -m 640 -o root -g deploy /tmp/docker-compose.yml /opt/portfolio/docker-compose.yml
sudo install -m 750 -o root -g deploy /tmp/deploy.sh /opt/portfolio/deploy.sh
sudo install -m 640 -o deploy -g deploy /dev/null /opt/portfolio/.env      # vacío: deploy.sh escribe TAG=…
rm /tmp/docker-compose.yml /tmp/deploy.sh
ls -la /opt/portfolio
```

`deploy.sh` usa `flock` (paquete `util-linux`, ya viene en Ubuntu/Debian).

## 6. Login en GHCR como `deploy` (solo lectura)

En GitHub: **Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic)**. Nombre `vps-portfolio-pull`, una fecha de vencimiento, y **solo** el permiso `read:packages`. (Los tokens "fine-grained" no sirven bien para leer paquetes de GHCR.)

En el servidor:

```bash
sudo -iu deploy
docker login ghcr.io -u zarvi16g --password-stdin    # pega el token, Enter, Ctrl+D
exit
```

Queda en `/home/deploy/.docker/config.json` (legible solo por `deploy`). Anota cuándo vence el token: ese día los despliegues fallarán en el `pull` (el sitio seguirá funcionando con la versión que tenga) y hay que repetir este paso.

## 7. Nginx del host

Hazlo **después** de que el contenedor responda (ver "Primer despliegue"). Desde tu computador:

```bash
scp deploy/nginx-santiagoboada.conf <tu-usuario>@<IP_VPS>:/tmp/
```

En el servidor:

```bash
sudo install -m 644 /tmp/nginx-santiagoboada.conf /etc/nginx/sites-available/santiagoboada.dev

# las rutas del certificado de GoDaddy (las del sitio actual, del paso 1)
sudo sed -i \
  -e 's#__SSL_CERT__#/ruta/al/certificado-con-cadena.crt#' \
  -e 's#__SSL_KEY__#/ruta/a/la/llave.key#' \
  /etc/nginx/sites-available/santiagoboada.dev
grep -n ssl_certificate /etc/nginx/sites-available/santiagoboada.dev

# quitar el sitio viejo y activar el nuevo (el viejo queda respaldado en el paso 2)
sudo rm /etc/nginx/sites-enabled/<archivo-del-sitio-actual>
sudo ln -s /etc/nginx/sites-available/santiagoboada.dev /etc/nginx/sites-enabled/santiagoboada.dev

# recargar solo si la configuración es válida; si no, volver atrás
if sudo nginx -t; then
  sudo systemctl reload nginx
else
  sudo rm /etc/nginx/sites-enabled/santiagoboada.dev
  sudo ln -s /etc/nginx/sites-available/<archivo-del-sitio-actual> /etc/nginx/sites-enabled/
  echo "nginx -t falló: no se recargó nada"
fi
```

`ssl_certificate` debe ser el certificado **con la cadena intermedia**. Si GoDaddy te dio dos archivos (`tu_certificado.crt` y `gd_bundle-g2-g1.crt`), únelos así: `cat tu_certificado.crt gd_bundle-g2-g1.crt | sudo tee /etc/ssl/santiagoboada/fullchain.crt`. Si el sitio actual ya funciona con HTTPS, usa las mismas rutas que tiene.

Comprobación desde el servidor:

```bash
curl -skI --resolve santiagoboada.dev:443:127.0.0.1 https://santiagoboada.dev/ | grep -iE '^HTTP|strict-transport|content-security'
curl -skI --resolve www.santiagoboada.dev:443:127.0.0.1 https://www.santiagoboada.dev/ | grep -iE '^HTTP|^location'
```

Debe dar `200` con HSTS y CSP, y `www` un `301` a `https://santiagoboada.dev/`.

## 8. Secrets de GitHub (`VPS_KNOWN_HOSTS` y los otros dos)

**`VPS_KNOWN_HOSTS`** fija la identidad del servidor (Actions nunca acepta una llave desconocida). Desde tu computador:

```bash
ssh-keyscan -t ed25519 <IP_VPS> 2>/dev/null > /tmp/vps_known_hosts
ssh-keygen -lf /tmp/vps_known_hosts           # huella que viste desde fuera
```

Compárala con la huella real, mirada **dentro** del servidor:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

Si las dos huellas (`SHA256:…`) coinciden, la línea de `/tmp/vps_known_hosts` es el secret. Si tu SSH no está en el puerto 22, usa `ssh-keyscan -p <puerto>` (y avísame: el workflow tendría que llevar el puerto).

Carga los 3 secrets **en el environment `production`** (paso 9), no como secrets del repo: así solo el job que tú apruebas puede leerlos. En **Settings → Environments → production → Environment secrets → Add secret**, o con `gh`:

```bash
gh secret set VPS_HOST        --env production --body "<IP_VPS>"
gh secret set VPS_SSH_KEY     --env production < ~/.ssh/santiagoboada_deploy
gh secret set VPS_KNOWN_HOSTS --env production < /tmp/vps_known_hosts
```

`VPS_HOST` es la **IP**, no el dominio: Cloudflare no deja pasar SSH.

## 9. Environment `production` con aprobación obligatoria

**Settings → Environments → New environment →** `production`:

- **Required reviewers:** tú (`Zarvi16G`). No marques "Prevent self-review": eres el único revisor.
- **Deployment branches and tags → Selected branches and tags:** añade la regla de tag `v*` y la rama `main` (para lanzarlo a mano desde `main`).
- Aquí van los 3 secrets del paso 8.

**Importante:** en repos **privados**, "Required reviewers" solo existe con GitHub Pro/Team. En un repo **público** funciona gratis. Si el repo es privado y tu plan es Free, la opción no aparece y el deploy no esperaría aprobación: en ese caso dime y lo resolvemos (por ejemplo, haciendo público el repo de código, que no tiene secretos).

La imagen de GHCR es **privada** por defecto aunque el repo sea público (la primera subida la crea privada; compruébalo en el paquete → Package settings → Visibility).

## 10. Cloudflare

En el panel de `santiagoboada.dev`:

- **SSL/TLS → Overview → Full (strict)**: Cloudflare exige un certificado válido en el servidor (el de GoDaddy lo es).
- **SSL/TLS → Edge Certificates → Always Use HTTPS: On.**
- **SSL/TLS → Edge Certificates → Minimum TLS Version: TLS 1.2.**
- **DNS:** `santiagoboada.dev` y `www` con la nube naranja (proxy) apuntando a `<IP_VPS>`.

## 11. Puerto 8000 (tarea aparte, solo explicación)

ufw tiene abierto el 8000. Averigua quién lo usa:

```bash
sudo ss -tlnp | grep ':8000 '
docker ps --format '{{.Names}}\t{{.Ports}}' | grep 8000
```

Si es la app de finanzas y Nginx ya la sirve por `finance.santiagoboada.dev` (un `proxy_pass http://127.0.0.1:8000`), el puerto no necesita estar abierto a Internet:

1. En el `docker-compose.yml` de finanzas cambia `"8000:8000"` por `"127.0.0.1:8000:8000"`.
2. `docker compose up -d` en su carpeta y comprueba que `https://finance.santiagoboada.dev` sigue funcionando.
3. Cierra la regla: `sudo ufw status numbered` y `sudo ufw delete <número de la regla 8000>` (de las dos si hay IPv4 e IPv6).

**Por qué el paso 1 es el importante:** Docker escribe sus propias reglas de iptables y un puerto publicado como `8000:8000` (es decir, `0.0.0.0`) **queda accesible desde Internet aunque ufw lo bloquee**. Cerrar la regla de ufw sin cambiar el compose no lo protege. Por eso el portafolio se publica solo en `127.0.0.1`.

## 12. Rollback

**Volver a una versión anterior del portafolio (a mano):**

```bash
docker image ls ghcr.io/zarvi16g/santiagoboada-portfolio     # el servidor guarda las últimas 3
cat /opt/portfolio/.env                                      # la versión actual
tail -n 20 /opt/portfolio/deploy.log                         # historial
sudo -iu deploy /opt/portfolio/deploy.sh <TAG-anterior>
```

`deploy.sh` cambia el `.env`, arranca esa versión y comprueba que esté sana (si no, vuelve a la que estaba). También puedes lanzar el workflow a mano (**Actions → deploy → Run workflow**) sobre un tag `v*` anterior: construye de nuevo ese código y lo despliega con una etiqueta nueva.

**Volver al sitio viejo (respaldo del paso 2):**

```bash
B=~/backups/santiagoboada-AAAA-MM-DD        # la carpeta del respaldo
sudo rm /etc/nginx/sites-enabled/santiagoboada.dev
sudo cp -a "$B/<archivo-del-sitio-actual>" /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/<archivo-del-sitio-actual> /etc/nginx/sites-enabled/
# si borraste sus archivos: sudo tar xzf "$B/sitio-actual.tar.gz" -C <root-del-sitio-actual>
sudo nginx -t && sudo systemctl reload nginx
sudo -iu deploy docker compose --project-directory /opt/portfolio down   # opcional: parar el contenedor nuevo
```

## 13. Renovación del certificado de GoDaddy

- **Dónde está:** en las rutas de `ssl_certificate` / `ssl_certificate_key` de `/etc/nginx/sites-available/santiagoboada.dev` (las mismas que usaba el sitio viejo).
- **Cuándo vence:** `sudo openssl x509 -enddate -noout -in <ruta-del-certificado>`. Pon un recordatorio unas 4 semanas antes.
- **Qué hacer:** en GoDaddy, renueva y vuelve a emitir el certificado (re-key si quieres una llave nueva). Descarga el paquete para **Nginx/Other**. Une certificado y cadena (`cat tu_certificado.crt gd_bundle-g2-g1.crt > fullchain.crt`), reemplaza los archivos **en las mismas rutas** (respaldando los viejos), y:

  ```bash
  sudo nginx -t && sudo systemctl reload nginx
  echo | openssl s_client -connect <IP_VPS>:443 -servername santiagoboada.dev 2>/dev/null | openssl x509 -noout -enddate
  ```

- **Alternativa a considerar:** como Cloudflare va delante con Full (strict), un **Cloudflare Origin Certificate** (gratis, hasta 15 años) también es válido entre Cloudflare y el servidor y evita esta renovación anual. Solo sirve mientras el proxy de Cloudflare esté activo.

---

## Primer despliegue

1. Con el código en GitHub, en **Actions → deploy → Run workflow** (o empuja un tag: `git tag v1.0.0 && git push origin v1.0.0`).
2. El job **build** sube la imagen; mira su etiqueta en el resumen del job o en el paquete de GHCR (formato `AAAAMMDD-HHMM-sha`). El job **deploy** queda esperando tu aprobación: **no lo apruebes todavía**.
3. En el servidor, arranca esa versión a mano y comprueba que responde:

   ```bash
   sudo -iu deploy /opt/portfolio/deploy.sh <TAG>
   curl -sI http://127.0.0.1:8081/ | grep -iE '^HTTP|content-security'
   ```

4. Haz el paso **7** (Nginx).
5. Aprueba el job **deploy** en GitHub: vuelve a desplegar el mismo tag (sin cambios) y el chequeo final comprueba `https://santiagoboada.dev` con `200` y `Content-Security-Policy`.

De ahí en adelante, cada versión es: tag `v*` (o Run workflow) → apruebas → listo.
