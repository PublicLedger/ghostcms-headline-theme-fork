#!/usr/bin/env bash
# Run a command inside the ghost-dev container.
#
# Usage: bash scripts/ghost-exec.sh sh /path/to/script.sh
#        bash scripts/ghost-exec.sh sqlite3 /var/lib/ghost/content/data/ghost-dev.db "SELECT 1;"
#
# The container is NOT named `ghost-dev`. .devcontainer/docker-compose.yml
# deliberately omits `container_name:`, so Compose generates <project>-ghost-dev-1
# instead. A fixed name is global to the Docker daemon, which meant a stack started
# from the CLI (project `devcontainer`) and one started by VS Code (project
# `<folder>_devcontainer`) collided on it — "Reopen in Container" would fail with
# `Conflict. The container name "/ghost-dev" is already in use`. Compose's service
# label is the stable handle that survives the project name differing.
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <command> [args...]" >&2
  exit 2
fi

filters=(--filter label=com.docker.compose.service=ghost-dev)

# Dropping container_name means several stacks CAN now run at once, so prefer the
# ghost-dev belonging to our own Compose project when we can identify it. Docker
# sets a container's hostname to its own short ID, which is how we find ourselves.
own_project=$(docker inspect "$(hostname)" \
  --format '{{index .Config.Labels "com.docker.compose.project"}}' 2>/dev/null || true)
if [ -n "$own_project" ] && [ "$own_project" != "<no value>" ]; then
  filters+=(--filter "label=com.docker.compose.project=$own_project")
fi

mapfile -t ids < <(docker ps -q "${filters[@]}")

if [ "${#ids[@]}" -eq 0 ]; then
  echo "✗ No running ghost-dev container found." >&2
  echo "  Start the stack first (VS Code: Reopen in Container), then retry." >&2
  exit 1
fi

if [ "${#ids[@]}" -gt 1 ]; then
  echo "✗ ${#ids[@]} ghost-dev containers are running — refusing to guess:" >&2
  docker ps "${filters[@]}" \
    --format '    {{.ID}}  {{.Names}}  (project: {{.Label "com.docker.compose.project"}})' >&2
  echo "  Stop the stack you are not using: docker compose -p <project> down" >&2
  exit 1
fi

exec docker exec "${ids[0]}" "$@"
