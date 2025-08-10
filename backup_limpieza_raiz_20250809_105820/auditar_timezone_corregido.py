#!/usr/bin/env python3
"""
AUDITORÍA CORREGIDA - USUARIOS AFECTADOS POR TIMEZONE
"""

import mysql.connector
from datetime import datetime, timedelta

def conectar_bd():
    """Establece conexión con la base de datos"""
    return mysql.connector.connect(
        host='localhost',
        port=3307,
        user='root',
        password='root1234',
        database='mpd_concursos'
    )

def auditar_usuarios_timezone():
    """Busca usuarios potencialmente afectados por problema de timezone"""
    print("🔍 AUDITORÍA DETALLADA - USUARIOS AFECTADOS POR TIMEZONE")
    print("=" * 65)
    
    connection = conectar_bd()
    cursor = connection.cursor()
    
    try:
        # Buscar inscripciones sospechosas (UTC 00:00-02:59 = posible ART del día anterior)
        cursor.execute("""
            SELECT 
                HEX(i.id) as inscription_id,
                u.first_name,
                u.last_name,
                u.email,
                i.created_at,
                DATE(i.created_at) as fecha_utc,
                TIME(i.created_at) as hora_utc,
                DATE(DATE_SUB(i.created_at, INTERVAL 3 HOUR)) as fecha_art_estimada,
                TIME(DATE_SUB(i.created_at, INTERVAL 3 HOUR)) as hora_art_estimada,
                i.status
            FROM inscriptions i
            JOIN user_entity u ON i.user_id = u.id
            WHERE 
                TIME(i.created_at) BETWEEN '00:00:00' AND '02:59:59'
                AND DATE(i.created_at) >= '2025-08-01'
                AND i.id != UNHEX('9EDF14C057DF4F21B5FCB5271267D993')  -- Excluir Gabriela ya corregida
            ORDER BY i.created_at DESC
        """)
        
        sospechosos = cursor.fetchall()
        
        print(f"🚨 CASOS SOSPECHOSOS (Inscripciones UTC 00:00-02:59):")
        print(f"   Total encontrados: {len(sospechosos)}")
        
        if sospechosos:
            print(f"\n{'Usuario':<25} {'Email':<35} {'Fecha UTC':<12} {'Hora UTC':<10} {'Fecha ART Est.':<12} {'Hora ART Est.':<12} {'Estado'}")
            print("=" * 130)
            
            casos_criticos = []
            for result in sospechosos:
                ins_id, first_name, last_name, email, created_at, fecha_utc, hora_utc, fecha_art, hora_art, status = result
                
                nombre_completo = f"{first_name} {last_name}"[:24]
                email_corto = email[:34]
                
                # Identificar casos donde la fecha cambia
                fecha_cambia = fecha_utc != fecha_art
                if fecha_cambia:
                    casos_criticos.append(result)
                
                estado_mostrar = "🔥 CRÍTICO" if fecha_cambia else status
                print(f"{nombre_completo:<25} {email_corto:<35} {fecha_utc} {hora_utc} {fecha_art} {hora_art} {estado_mostrar}")
            
            print(f"\n🔥 CASOS CRÍTICOS (fecha cambia): {len(casos_criticos)}")
            
            # Mostrar detalles de casos críticos
            if casos_criticos:
                print(f"\n📋 DETALLES DE CASOS CRÍTICOS:")
                for result in casos_criticos:
                    ins_id, first_name, last_name, email, created_at, fecha_utc, hora_utc, fecha_art, hora_art, status = result
                    print(f"\n👤 {first_name} {last_name}")
                    print(f"   📧 Email: {email}")
                    print(f"   🕐 Inscripción UTC: {created_at}")
                    print(f"   📅 Fecha registrada: {fecha_utc} (UTC)")
                    print(f"   📅 Fecha real estimada: {fecha_art} (ART)")
                    print(f"   ⚡ Estado: {status}")
                    print(f"   💾 ID: {ins_id}")
        
        # Análisis por fechas
        print(f"\n📊 ANÁLISIS ESTADÍSTICO POR FECHAS:")
        cursor.execute("""
            SELECT 
                DATE(i.created_at) as fecha,
                COUNT(*) as total,
                COUNT(CASE WHEN TIME(i.created_at) BETWEEN '00:00:00' AND '02:59:59' THEN 1 END) as madrugada,
                COUNT(CASE WHEN TIME(i.created_at) BETWEEN '21:00:00' AND '23:59:59' THEN 1 END) as noche
            FROM inscriptions i
            WHERE DATE(i.created_at) >= '2025-08-01'
            GROUP BY DATE(i.created_at)
            ORDER BY fecha DESC
        """)
        
        estadisticas = cursor.fetchall()
        
        print(f"{'Fecha':<12} {'Total':<8} {'Madrugada':<12} {'Noche':<8} {'% Madrugada':<12}")
        print("=" * 60)
        
        total_sospechosos = 0
        for fecha, total, madrugada, noche in estadisticas:
            porcentaje = (madrugada / total * 100) if total > 0 else 0
            total_sospechosos += madrugada
            print(f"{fecha} {total:<8} {madrugada:<12} {noche:<8} {porcentaje:>8.1f}%")
        
        print(f"\n📈 RESUMEN GENERAL:")
        print(f"   🚨 Total inscripciones sospechosas: {total_sospechosos}")
        print(f"   🔥 Casos críticos (fecha incorrecta): {len(casos_criticos)}")
        print(f"   ✅ Gabriela Luis: YA CORREGIDA")
        
        # Generar script de corrección masiva
        if casos_criticos:
            print(f"\n🔧 GENERANDO SCRIPT DE CORRECCIÓN MASIVA...")
            
            with open('correccion_masiva_timezone.sql', 'w') as f:
                f.write("-- CORRECCIÓN MASIVA TIMEZONE - CASOS CRÍTICOS\n")
                f.write("-- Generado automáticamente\n")
                f.write(f"-- Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                f.write("START TRANSACTION;\n\n")
                
                for result in casos_criticos:
                    ins_id, first_name, last_name, email, created_at, fecha_utc, hora_utc, fecha_art, hora_art, status = result
                    
                    f.write(f"-- Usuario: {first_name} {last_name} ({email})\n")
                    f.write(f"-- Fecha UTC: {fecha_utc} -> Fecha ART estimada: {fecha_art}\n")
                    f.write(f"UPDATE inscriptions SET\n")
                    f.write(f"    created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),\n")
                    f.write(f"    updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),\n")
                    f.write(f"    inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)\n")
                    f.write(f"WHERE id = UNHEX('{ins_id}');\n\n")
                
                f.write("-- COMMIT;\n")
                f.write("-- ROLLBACK; -- Usar en caso de error\n")
            
            print(f"   📁 Script generado: correccion_masiva_timezone.sql")
            print(f"   ⚠️  REVISAR MANUALMENTE antes de ejecutar")
    
    except Exception as e:
        print(f"❌ Error: {e}")
    
    finally:
        connection.close()

def main():
    auditar_usuarios_timezone()

if __name__ == "__main__":
    main()
