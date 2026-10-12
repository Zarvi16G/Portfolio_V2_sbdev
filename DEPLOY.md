# Deploy: santiagoboada.dev on the VPS

Static site: `npm run build` writes `dist/`, Nginx serves it from `/var/www/santiagoboada.dev` with SSL from Certbot (same setup as `finance.santiagoboada.dev`).

## 1. Build (on your machine)

```bash
npm ci
npm run build          # -> dist/
npx vite preview       # optional: check the build at http://localhost:4173
```

## 2. Upload `dist/`

```bash
ssh <user>@<vps> 'sudo mkdir -p /var/www/santiagoboada.dev && sudo chown <user>: /var/www/santiagoboada.dev'
rsync -avz --delete dist/ <user>@<vps>:/var/www/santiagoboada.dev/
```

`--delete` removes old hashed files from earlier builds.

## 3. Nginx (first time only)

```bash
scp deploy/nginx/santiagoboada.dev.conf <user>@<vps>:/tmp/
ssh <user>@<vps>
sudo mv /tmp/santiagoboada.dev.conf /etc/nginx/sites-available/santiagoboada.dev
sudo ln -s /etc/nginx/sites-available/santiagoboada.dev /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

If the current site already has a server block for `santiagoboada.dev`, disable it in the same step (two blocks with the same `server_name` conflict).

## 4. HTTPS (first time only)

The DNS `A` (and `AAAA`) records for `santiagoboada.dev` and `www` must point to the VPS first.

```bash
sudo certbot --nginx -d santiagoboada.dev -d www.santiagoboada.dev
```

Certbot adds the 443 server and the http → https redirect to the same file and renews automatically.

## Updating later

Steps 1 and 2 only. `index.html` is served with `Cache-Control: no-cache`, so a new deploy shows at once; files in `/assets/` have hashed names and are cached for a year.

## What the config does

| Path | Cache | Notes |
|---|---|---|
| `/`, `/index.html` | `no-cache` | unknown paths fall back to `index.html` |
| `/assets/*` | 1 year, immutable | a missing file is a 404, not the page |
| `*.svg, *.ico, *.png, *.json` | 30 days | favicons and the 3D font |

Gzip is on for CSS, JS, JSON and SVG. Checked with `nginx -t` and served from a local `nginx:1.27` container.
