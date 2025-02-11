FROM node:20-alpine AS build-stage

WORKDIR /app

COPY React/Diagnostics-app/package.json React/Diagnostics-app/package-lock.json ./
RUN npm install

COPY React/Diagnostics-app/ ./
RUN npm run build

FROM nginx:latest AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY --from=build-stage /app/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
