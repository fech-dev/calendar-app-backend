ARG NODE_VERSION=20
ARG PNPM_VERSION=8.7.4

FROM mcr.microsoft.com/devcontainers/typescript-node:${NODE_VERSION}-bullseye


# Install pnpm.
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

# Run the application as a non-root user.
USER node

WORKDIR /usr/src/app

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.local/share/pnpm/store to speed up subsequent builds.
# Leverage a bind mounts to package.json and pnpm-lock.yaml to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install

# Expose the port that the application listens on.
EXPOSE 3000

# # Run the application.
CMD pnpm start:dev
