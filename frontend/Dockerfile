
FROM node:20-slim AS build
# ...existing code...

FROM nginx:stable-alpine
COPY --from=build /app/dist/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Install wget for health checks
RUN apk add --no-cache wget

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]