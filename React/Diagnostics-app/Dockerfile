FROM node:20-alpine

WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY React/Diagnostics-app/package.json React/Diagnostics-app/package-lock.json ./

# Устанавливаем зависимости
RUN npm install

# Устанавливаем TypeScript
RUN npm install -g typescript

# Копируем весь проект
COPY React/Diagnostics-app/ ./

# Собираем приложение
RUN npm run build

# Используем Nginx для хостинга
FROM nginx:alpine

# Проверка папки dist
RUN ls -lh /app/dist  # Добавьте эту строку, чтобы удостовериться в наличии dist

# Копируем собранные файлы из предыдущего шага
COPY --from=node:20-alpine /app/dist /usr/share/nginx/html

# Открываем порт 80
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]
