FROM node:24.11.1-bookworm-slim

# native modules building needs python and build tools as a fallback in case
# a prebuilt binary isn't available for this platform (better-sqlite3 does
# not currently ship musl/Alpine prebuilds for Node 24, which used to force
# a from-source compile here - and that compile crashed with SIGILL when
# cross-building arm64 under QEMU emulation on GitHub Actions. Debian/glibc
# has working prebuilt binaries, so this toolchain should now stay unused.)
RUN apt-get update && apt-get install --no-install-recommends -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Use the node user from the image (instead of the root user)
USER node
COPY --chown=node:node ./backend /usr/src/app
COPY --chown=node:node ./frontend/build /var/www/html

# Set NODE_ENV environment variable
ENV NODE_ENV production
RUN npm ci --omit=dev --no-fund --no-audit  && npm cache clean --force # reinstall deps since they can be binary incompatible

EXPOSE 3000

# Start the server using the production build
CMD [ "node", "dist/backend/src/main.js" ]
