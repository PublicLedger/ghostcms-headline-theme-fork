# Optimized Alpine-based devcontainer
FROM node:24-alpine

# Install essential tools.
# - sqlite/git/bash/curl/openssh-client: theme + Ghost tooling
# - docker-cli + docker-cli-compose: `docker compose` is a SEPARATE Alpine package
# - libgcc/libstdc++/ripgrep: required at runtime by Claude Code on musl
#   (see https://code.claude.com/docs/en/setup#alpine-linux-and-musl-based-distributions)
RUN apk add --no-cache \
    sqlite \
    git \
    bash \
    curl \
    openssh-client \
    docker-cli \
    docker-cli-compose \
    github-cli \
    libgcc \
    libstdc++ \
    ripgrep

# Install pnpm globally (required by package.json).
# Must match `packageManager` in package.json, which tracks upstream on sync.
RUN npm install -g pnpm@11.17.0

# node:24-alpine already provides user/group `node` at uid/gid 1000 — don't recreate it.
# Only the docker group needs handling, and its GID must match the HOST's docker group
# or the mounted socket is unreadable. Override at build time if your host differs:
#   docker compose build --build-arg DOCKER_GID=$(getent group docker | cut -d: -f3)
ARG DOCKER_GID=995
RUN if ! getent group "${DOCKER_GID}" >/dev/null 2>&1; then \
        addgroup -g "${DOCKER_GID}" docker; \
    fi && \
    addgroup node "$(getent group "${DOCKER_GID}" | cut -d: -f1)"

# Create the Claude Code config dir IN THE IMAGE so the named volume mounted over it
# (see devcontainer.json "mounts") inherits node's ownership.
#
# Docker seeds an empty named volume by copying the image's contents at the mount path,
# ownership included. If the path does not exist in the image there is nothing to copy,
# so Docker creates the volume root:root — and Claude Code, running as `node`, cannot
# write ~/.claude/.credentials.json. Login then loops forever: OAuth succeeds, the token
# fails to persist, the next check finds no credentials and re-prompts.
#
# The .keep file is load-bearing: copy-up is only guaranteed to apply the directory's
# ownership when there is content to copy. An empty dir can leave the volume root-owned.
RUN mkdir -p /home/node/.claude \
    && touch /home/node/.claude/.keep \
    && chown -R node:node /home/node/.claude

# Set working directory
WORKDIR /workspace

# Switch to non-root user (also required for Claude Code's --dangerously-skip-permissions)
USER node
