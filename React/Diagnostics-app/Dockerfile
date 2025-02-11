# Используем Node.js для сборки
FROM node:20-alpine AS build-stage

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY React/Diagnostics-app/package.json React/Diagnostics-app/package-lock.json ./
RUN npm install

# Копируем исходный код и собираем проект
COPY React/Diagnostics-app/ ./
RUN npm run build

# Используем Nginx для раздачи собранного фронта
FROM nginx:latest AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
