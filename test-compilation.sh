#!/bin/bash

echo "🔧 Testing compilation of updated entities..."

cd concurso-backend

echo "📊 Compiling WorkExperienceEntity..."
javac -cp "$(find ~/.m2/repository -name "*.jar" | tr '\n' ':')" \
  src/main/java/ar/gov/mpd/concursobackend/experience/infrastructure/persistence/WorkExperienceEntity.java \
  2>&1 | head -20

echo "📚 Compiling EducationRecordEntity..."
javac -cp "$(find ~/.m2/repository -name "*.jar" | tr '\n' ':')" \
  src/main/java/ar/gov/mpd/concursobackend/education/infrastructure/persistence/entity/EducationRecordEntity.java \
  2>&1 | head -20

echo "✅ Compilation test complete"
