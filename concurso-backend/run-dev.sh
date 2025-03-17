#!/bin/bash
echo "Ejecutando backend en modo desarrollo local..."
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev 