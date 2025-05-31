#!/bin/bash

# Script para ejecutar pruebas específicas del módulo de concursos

echo "🧪 Ejecutando pruebas del módulo de concursos..."

# Ejecutar pruebas específicas
ng test --include="**/admin-concursos.service.spec.ts" --watch=false --browsers=ChromeHeadless --code-coverage

echo "📊 Ejecutando pruebas del componente de formulario..."
ng test --include="**/concurso-form-page.component.spec.ts" --watch=false --browsers=ChromeHeadless --code-coverage

echo "✅ Pruebas completadas. Revisa el reporte de cobertura en coverage/"
