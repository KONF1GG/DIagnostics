FROM node:20-alpine AS build-stage

WORKDIR /app

COPY React/package.json React/package-lock.json ./
RUN npm install

RUN npm install -g typescript

COPY React/Diagnostics-app ./
RUN npm run build

FROM nginx:latest AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
