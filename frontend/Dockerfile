FROM node:20-slim AS build
# ...existing code...

FROM nginx:stable-alpine
COPY --from=build /app/dist/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Install curl for healthcheck and set permissions
RUN apk add --no-cache curl && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]