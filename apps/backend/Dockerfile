FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY apps/backend apps/backend
COPY packages/shared packages/shared
RUN npm run backend:build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/backend apps/backend
COPY --from=build /app/packages/shared packages/shared

EXPOSE 5000
CMD ["sh", "-c", "npm run migrate --workspace=gaushala-backend && npm run start --workspace=gaushala-backend"]
