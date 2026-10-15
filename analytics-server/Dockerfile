FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=8787 ANALYTICS_DB=/data/analytics.sqlite
WORKDIR /app
COPY --chown=node:node library-v2.json ./library-v2.json
COPY --chown=node:node analytics-server/ ./analytics-server/
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 8787
VOLUME ["/data"]
CMD ["node", "analytics-server/server.mjs"]
