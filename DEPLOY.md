# Deploy: santiagoboada.dev

Docker image on GHCR, deployed by GitHub Actions to the VPS after a manual approval.
The server setup (done once, by hand) is in [docs/SERVER-SETUP.md](docs/SERVER-SETUP.md).

```
tag v* / Run workflow ──► build: npm ci, npm audit, docker build ──► ghcr.io/zarvi16g/santiagoboada-portfolio:AAAAMMDD-HHMM-sha (private)
                       ──► deploy (environment "production", you approve) ──► ssh deploy@VPS "<tag>" ──► /opt/portfolio/deploy.sh
                       ──► check: https://santiagoboada.dev answers 200 with Content-Security-Policy
```

| File | Where it runs | What it does |
|---|---|---|
| `Dockerfile` | build | node 22 alpine builds `dist/`; `nginx-unprivileged` (no root, port 8080) serves it. Base images pinned by version + digest |
| `docker/nginx.conf`, `docker/security-headers.conf` | container | GET/HEAD only, hidden files blocked, gzip, cache (`/assets` 1 year immutable, `index.html` no-cache), CSP and security headers, healthcheck on `/` |
| `.github/workflows/deploy.yml` | GitHub Actions | build + push to GHCR (`GITHUB_TOKEN`), deploy over SSH with a pinned `known_hosts`, final check. Actions pinned by commit SHA |
| `deploy/docker-compose.yml` | VPS `/opt/portfolio/` | `127.0.0.1:8081:8080`, read-only, tmpfs, no-new-privileges, cap_drop ALL, 128 MB, rotated logs, own network |
| `deploy/deploy.sh` | VPS `/opt/portfolio/` | the only command the GitHub key can run: validates the tag, pulls, starts, waits for healthy (60 s), rolls back if not, keeps the last 3 images, logs to `deploy.log` |
| `deploy/nginx-santiagoboada.conf` | VPS host Nginx | 443 with the GoDaddy certificate, 80 → https, www → santiagoboada.dev, proxy to 127.0.0.1:8081, Cloudflare real IP, HSTS |

Secrets (environment `production`): `VPS_HOST`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`. Nothing secret lives in the repo.

**Release:** `git tag v1.2.3 && git push origin v1.2.3` (or Actions → deploy → Run workflow), then approve the deploy job.
**Rollback:** `sudo -iu deploy /opt/portfolio/deploy.sh <previous tag>` on the VPS (see docs/SERVER-SETUP.md, step 12).

**Local check of the image:**

```bash
docker build -t santiagoboada-portfolio:local .
docker run --rm --read-only --tmpfs /tmp --tmpfs /var/cache/nginx --cap-drop ALL \
  --security-opt no-new-privileges -p 127.0.0.1:8080:8080 santiagoboada-portfolio:local
curl -I http://127.0.0.1:8080/
```
