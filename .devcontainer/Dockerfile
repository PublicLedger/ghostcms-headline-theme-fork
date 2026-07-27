# Custom devcontainer with sqlite3 pre-installed
FROM mcr.microsoft.com/devcontainers/javascript-node:24

# Install sqlite3 at build time
RUN apt-get update \
    && apt-get install -y sqlite3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
