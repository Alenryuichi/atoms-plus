# Railway rebuild trigger: 2026-03-01
ARG OPENHANDS_BUILD_VERSION=dev
FROM node:25.2-trixie-slim AS frontend-builder

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy frontend source files, excluding node_modules and build artifacts
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/scripts ./scripts
COPY frontend/.eslintrc frontend/.prettierrc.json ./
COPY frontend/tsconfig.json frontend/vite.config.ts frontend/vite-env.d.ts ./
COPY frontend/tailwind.config.js frontend/react-router.config.ts ./
COPY frontend/global.d.ts frontend/components.json ./

RUN npm run build

FROM python:3.13.7-slim-trixie AS base
FROM base AS backend-builder

WORKDIR /app
ENV PYTHONPATH='/app'

ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

RUN apt-get update -y \
    && apt-get install -y curl make git build-essential jq gettext \
    && python3 -m pip install poetry --break-system-packages

COPY pyproject.toml poetry.lock ./
RUN touch README.md
# Install with third_party_runtimes extras for Daytona, E2B, Modal, Runloop support
RUN export POETRY_CACHE_DIR && poetry install --no-root --extras third_party_runtimes && rm -rf $POETRY_CACHE_DIR

FROM base AS openhands-app

WORKDIR /app

# re-declare for this section
ARG OPENHANDS_BUILD_VERSION

ENV RUN_AS_OPENHANDS=true
# A random number--we need this to be different from the user's UID on the host machine
ENV OPENHANDS_USER_ID=42420
ENV SANDBOX_LOCAL_RUNTIME_URL=http://host.docker.internal
ENV USE_HOST_NETWORK=false
ENV WORKSPACE_BASE=/opt/workspace_base
ENV OPENHANDS_BUILD_VERSION=$OPENHANDS_BUILD_VERSION
ENV SANDBOX_USER_ID=0
ENV FILE_STORE=local
ENV FILE_STORE_PATH=/.openhands
ENV INIT_GIT_IN_EMPTY_WORKSPACE=1
RUN mkdir -p $FILE_STORE_PATH
RUN mkdir -p $WORKSPACE_BASE

# CACHE_BUST: Change this value to force rebuild of apt-get layer
ARG CACHE_BUST_APT=2026-03-10-npm-yes-config
# Install Node.js 22 LTS for ProcessSandboxService (RUNTIME=local)
# Required for: npm create, npx, and other frontend dev commands
RUN apt-get update -y \
    && apt-get install -y curl ssh sudo tmux git ca-certificates gnupg \
    # Install Node.js 22 LTS from NodeSource
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update -y \
    && apt-get install -y nodejs \
    # Playwright/Chromium dependencies
    && apt-get install -y \
        libnss3 libnspr4 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 \
        libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
        libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 \
        libcairo2 libatspi2.0-0 libwayland-client0 \
    && rm -rf /var/lib/apt/lists/* \
    # Configure npm to auto-confirm all prompts (skip "Ok to proceed?")
    && npm config set yes true \
    # Verify installations
    && node --version && npm --version \
    && echo "npm config yes=true (auto-confirm enabled)"

# Default is 1000, but OSX is often 501
RUN sed -i 's/^UID_MIN.*/UID_MIN 499/' /etc/login.defs
# Default is 60000, but we've seen up to 200000
RUN sed -i 's/^UID_MAX.*/UID_MAX 1000000/' /etc/login.defs

RUN groupadd --gid $OPENHANDS_USER_ID openhands
RUN useradd -l -m -u $OPENHANDS_USER_ID --gid $OPENHANDS_USER_ID -s /bin/bash openhands && \
    usermod -aG openhands openhands && \
    usermod -aG sudo openhands && \
    echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
RUN chown -R openhands:openhands /app && chmod -R 770 /app
RUN sudo chown -R openhands:openhands $WORKSPACE_BASE && sudo chmod -R 770 $WORKSPACE_BASE
USER openhands

ENV VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH='/app'

COPY --chown=openhands:openhands --chmod=770 --from=backend-builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}

COPY --chown=openhands:openhands --chmod=770 ./skills ./skills
COPY --chown=openhands:openhands --chmod=770 ./openhands ./openhands
COPY --chown=openhands:openhands --chmod=777 ./openhands/runtime/plugins ./openhands/runtime/plugins
COPY --chown=openhands:openhands --chmod=770 ./atoms_plus ./atoms_plus
COPY --chown=openhands:openhands --chmod=770 ./third_party ./third_party
COPY --chown=openhands:openhands pyproject.toml poetry.lock README.md MANIFEST.in LICENSE ./

# This is run as "openhands" user, and will create __pycache__ with openhands:openhands ownership
RUN python openhands/core/download.py # No-op to download assets

# Add this line to set group ownership of all files/directories not already in "app" group
# openhands:openhands -> openhands:openhands
RUN find /app \! -group openhands -exec chgrp openhands {} +

COPY --chown=openhands:openhands --chmod=770 --from=frontend-builder /app/build ./frontend/build
COPY --chown=openhands:openhands --chmod=770 ./containers/app/entrypoint.sh /app/entrypoint.sh

# Switch to root to install Playwright browser (needs write to system directories)
USER root

# Install Playwright Chromium browser for browser_use tool
# This enables web browsing capabilities in the agent
# Use /opt/playwright-browsers as the standard location (same as runtime_templates/Dockerfile.j2)
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers
RUN mkdir -p /opt/playwright-browsers && \
    playwright install chromium && \
    # Set proper permissions for shared access
    chmod -R 755 /opt/playwright-browsers && \
    # Create cache directories and symlinks for both users (following runtime template pattern)
    mkdir -p /home/openhands/.cache && \
    mkdir -p /root/.cache && \
    ln -sf /opt/playwright-browsers /home/openhands/.cache/ms-playwright && \
    ln -sf /opt/playwright-browsers /root/.cache/ms-playwright && \
    chown -h openhands:openhands /home/openhands/.cache/ms-playwright && \
    # Also create symlink for ~/.cache/playwright (used by browser_env.py for local runtime)
    ln -sf /opt/playwright-browsers /home/openhands/.cache/playwright && \
    chown -h openhands:openhands /home/openhands/.cache/playwright

WORKDIR /app

ENTRYPOINT ["/app/entrypoint.sh"]
# Use atoms_plus server which includes OpenHands + Race Mode extensions
# Railway requires using $PORT env var, default to 3000 for local development
CMD ["sh", "-c", "uvicorn atoms_plus.atoms_server:app --host 0.0.0.0 --port ${PORT:-3000}"]
