FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_JEJAKU_URL
ENV NEXT_PUBLIC_JEJAKU_URL=$NEXT_PUBLIC_JEJAKU_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4001
# Docker auto-sets HOSTNAME to the container ID for every container, and
# Next's standalone server.js reads that same var to decide what address
# to bind to — without this override it ends up bound only to the
# container's own bridge IP, not 0.0.0.0. External traffic still reaches
# it fine (Docker's port-forwarding targets that IP directly), but
# anything hitting localhost/127.0.0.1 *inside* the container — including
# this Dockerfile's own healthcheck — gets refused.
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 4001
CMD ["node", "server.js"]
