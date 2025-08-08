#!/usr/bin/env python3
"""
Analiza patrones en los archivos faltantes
"""

import json
from datetime import datetime
from collections import defaultdict, Counter

def analyze_report(report_file):
    """Analiza el reporte de auditoría"""
    
    with open(report_file, 'r', encoding='utf-8') as f:
        report = json.load(f)
    
    missing_files = report.get('missing_files', [])
    
    print("🔍 ANÁLISIS DE PATRONES EN ARCHIVOS FALTANTES")
    print("=" * 60)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📁 Total archivos faltantes: {len(missing_files)}")
    print()
    
    if not missing_files:
        print("✅ No hay archivos faltantes para analizar")
        return
    
    # Análisis por fecha
    print("📅 ANÁLISIS POR FECHA DE SUBIDA:")
    print("-" * 40)
    dates_count = defaultdict(int)
    
    for file in missing_files:
        upload_date = file.get('upload_date', '')
        if upload_date:
            date_only = upload_date.split(' ')[0]  # Solo la fecha, sin hora
            dates_count[date_only] += 1
    
    for date, count in sorted(dates_count.items(), reverse=True)[:10]:
        print(f"📅 {date}: {count} archivos faltantes")
    print()
    
    # Análisis por usuario
    print("👥 USUARIOS MÁS AFECTADOS:")
    print("-" * 40)
    users_count = Counter(file.get('email', 'NO_EMAIL') for file in missing_files)
    
    for email, count in users_count.most_common(15):
        print(f"📧 {email}: {count} archivos faltantes")
    print()
    
    # Análisis por ruta
    print("📂 ANÁLISIS POR ESTRUCTURA DE DIRECTORIOS:")
    print("-" * 40)
    path_patterns = defaultdict(int)
    
    for file in missing_files:
        file_path = file.get('file_path', '')
        if file_path:
            # Extraer patrón de directorio
            parts = file_path.split('/')
            if len(parts) >= 2:
                pattern = f"{parts[0]}/{parts[1] if parts[1].isdigit() else 'OTHER'}"
                path_patterns[pattern] += 1
    
    for pattern, count in sorted(path_patterns.items(), key=lambda x: x[1], reverse=True):
        print(f"📂 {pattern}: {count} archivos faltantes")
    print()
    
    # Análisis por horarios
    print("⏰ ANÁLISIS POR HORA DE SUBIDA:")
    print("-" * 40)
    hours_count = defaultdict(int)
    
    for file in missing_files:
        upload_date = file.get('upload_date', '')
        if upload_date and ' ' in upload_date:
            time_part = upload_date.split(' ')[1]
            if ':' in time_part:
                hour = time_part.split(':')[0]
                hours_count[hour] += 1
    
    for hour in sorted(hours_count.keys()):
        count = hours_count[hour]
        bar = "█" * min(count // 5, 50)  # Gráfico simple
        print(f"⏰ {hour}:00 - {count:3d} archivos {bar}")
    print()
    
    # Recomendaciones
    print("💡 RECOMENDACIONES:")
    print("-" * 40)
    
    # Analizar si hay concentración temporal
    total_missing = len(missing_files)
    max_date_count = max(dates_count.values()) if dates_count else 0
    
    if max_date_count > total_missing * 0.3:
        print("🔴 CRÍTICO: Más del 30% de archivos faltantes corresponden a una sola fecha")
        print("   → Posible pérdida masiva de datos en esa fecha específica")
        print()
    
    if len(users_count.most_common(1)) > 0:
        most_affected_user, max_user_count = users_count.most_common(1)[0]
        if max_user_count > total_missing * 0.2:
            print(f"🔴 USUARIO MÁS AFECTADO: {most_affected_user} ({max_user_count} archivos)")
            print("   → Revisar específicamente los documentos de este usuario")
            print()
    
    print("📋 ACCIONES SUGERIDAS:")
    print("1. 🔍 Verificar backups del volumen de almacenamiento")
    print("2. 🗂️  Revisar logs de sistema para fechas con más archivos faltantes")
    print("3. 📞 Contactar usuarios más afectados para re-subida de documentos")
    print("4. 🔧 Implementar verificación de integridad automática")
    print("5. 💾 Establecer backup automático de documentos")
    print()

if __name__ == "__main__":
    import sys
    
    # Buscar el reporte más reciente
    import glob
    reports = glob.glob("document_integrity_report_*.json")
    if not reports:
        print("❌ No se encontró ningún reporte de auditoría")
        sys.exit(1)
    
    latest_report = max(reports)
    print(f"📄 Analizando reporte: {latest_report}")
    print()
    
    analyze_report(latest_report)
