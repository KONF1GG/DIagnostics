FROM node:17-alpine
WORKDIR /app
COPY React/Diagnostics-app/package.json React/Diagnostics-app/package-lock.json* ./
RUN npm install
COPY React/Diagnostics-app/ ./
RUN npm run build


