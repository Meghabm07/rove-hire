FROM node:20-alpine AS deps
WORKDIR /server
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:20-alpine AS builder
WORKDIR /server
COPY --from=deps /server/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /server
ENV NODE_ENV=production
COPY --from=deps /server/node_modules ./node_modules
COPY --from=builder /server/dist ./dist
COPY package.json ./package.json
EXPOSE 4000
CMD ["npm", "start"]
