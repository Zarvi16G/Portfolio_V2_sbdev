#!/usr/bin/env bash
# /opt/portfolio/deploy.sh: the only command the GitHub Actions key can run (see authorized_keys, command=...).
# Usage: ssh deploy@VPS "20261012-1530-abc1234"   (the tag arrives in SSH_ORIGINAL_COMMAND)
#        manual: sudo -iu deploy /opt/portfolio/deploy.sh 20261012-1530-abc1234   (-i: deploy's HOME, for its GHCR login)
# Pulls the image, starts it, waits until it is healthy (60 s max) and goes back to the previous tag if not.
set -euo pipefail
umask 027

DIR=/opt/portfolio
IMAGE=ghcr.io/zarvi16g/santiagoboada-portfolio
CONTAINER=santiagoboada-portfolio
KEEP=3          # images of this project kept on the server
WAIT=60         # seconds to become healthy
LOG="$DIR/deploy.log"
TAG_RE='^[0-9]{8}-[0-9]{4}-[0-9a-f]{7}$'

cd "$DIR"
log() { printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >> "$LOG"; printf '%s\n' "$*"; }

# only a tag, nothing else (the input is never logged or executed as-is)
TAG="${SSH_ORIGINAL_COMMAND:-${1:-}}"
if [[ ! "$TAG" =~ $TAG_RE ]]; then
  log "REJECTED: not a valid tag"
  exit 2
fi

# one deploy at a time
exec 9> "$DIR/.deploy.lock"
if ! flock -n 9; then log "REJECTED $TAG: another deploy is running"; exit 3; fi

PREV="$(sed -n 's/^TAG=//p' .env 2>/dev/null || true)"
[[ "$PREV" =~ $TAG_RE ]] || PREV=""

set_tag() { printf 'TAG=%s\n' "$1" > .env.tmp && mv .env.tmp .env; }
restore_tag() { if [[ -n "$PREV" ]]; then set_tag "$PREV"; else rm -f .env; fi; }
up() { docker compose up -d --remove-orphans; }
healthy() {
  local s
  for ((i = 0; i < WAIT; i += 2)); do
    s="$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo none)"
    [[ "$s" == healthy ]] && return 0
    sleep 2
  done
  return 1
}

log "deploy $TAG (previous: ${PREV:-none})"
set_tag "$TAG"
# pull first: if it fails, the running container was never touched
if ! docker compose pull --quiet; then
  restore_tag
  log "FAILED $TAG: pull failed, nothing changed"
  exit 1
fi
if up && healthy; then
  log "OK $TAG is healthy"
else
  log "FAILED $TAG: not healthy within ${WAIT}s"
  if [[ -n "$PREV" ]]; then
    # the previous image is still on the server: no pull needed
    set_tag "$PREV"
    if up && healthy; then log "rolled back to $PREV"; else log "rollback to $PREV is NOT healthy: check by hand"; fi
  else
    restore_tag
    log "no previous tag to roll back to"
  fi
  exit 1
fi

# keep the newest $KEEP images of THIS project (tags sort by date); never touches other images
mapfile -t TAGS < <(docker image ls "$IMAGE" --format '{{.Tag}}' | grep -E "$TAG_RE" | sort -r || true)
for t in "${TAGS[@]:$KEEP}"; do
  [[ "$t" == "$TAG" ]] && continue
  docker image rm "$IMAGE:$t" > /dev/null && log "removed old image $t"
done
