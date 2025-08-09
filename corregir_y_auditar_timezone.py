#!/usr/bin/env python3
"""
CORRECCIÓN Y AUDITORÍA COMPLETA - PROBLEMA TIMEZONE
1. Corrige el registro de Gabriela Luis
2. Identifica otros usuarios potencialmente afectados
"""

import mysql.connector
from datetime import datetime, timedelta
import sys

def conectar_bd():
    """Establece conexión con la base de datos"""
    try:
        return mysql.connector.connect(
            host='localhost',
            port=3307,
            user='root',
            password='root1234',
            database='mpd_concursos'
        )
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")
        sys.exit(1)

def corregir_gabriela_luis():
    """Aplica la corrección específica para Gabriela Luis"""
    print("🔧 APLICANDO CORRECCIÓN PARA GABRIELA LUIS")
    print("=" * 50)
    
    connection = conectar_bd()
    cursor = connection.cursor()
    
    try:
        # Aplicar corrección
        cursor.execute("""
            UPDATE inscriptions 
            SET 
                created_at = DATE_SUB(created_at, INTERVAL 3 HOUR),
                updated_at = DATE_SUB(updated_at, INTERVAL 3 HOUR),
                inscription_date = DATE_SUB(inscription_date, INTERVAL 3 HOUR)
            WHERE id = UNHEX('9EDF14C057DF4F21B5FCB5271267D993')
        """)
        
        if cursor.rowcount > 0:
            connection.commit()
            print(f"✅ Corrección aplicada exitosamente")
            
            # Verificar resultado
            cursor.execute("""
                SELECT 
                    HEX(i.id) as inscription_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    i.created_at,
                    i.inscription_date,
                    DATE(i.created_at) as fecha_inscripcion
                FROM inscriptions i
                JOIN user_entity u ON i.user_id = u.id
                WHERE i.id = UNHEX('9EDF14C057DF4F21B5FCB5271267D993')
            """)
            
            result = cursor.fetchone()
            if result:
                ins_id, first_name, last_name, email, created_at, inscription_date, fecha = result
                print(f"📋 VERIFICACIÓN POST-CORRECCIÓN:")
                print(f"   Usuario: {first_name} {last_name}")
                print(f"   Email: {email}")
                print(f"   🕐 Nuevo Created At: {created_at}")
                print(f"   📅 Nueva Fecha: {fecha}")
                print(f"   ✅ Estado: CORREGIDO")
        else:
            print(f"❌ No se encontró el registro para actualizar")
    
    except Exception as e:
        connection.rollback()
        print(f"❌ Error aplicando corrección: {e}")
    
    finally:
        connection.close()

def auditar_usuarios_afectados():
    """Identifica otros usuarios que podrían estar afectados por el problema de timezone"""
    print(f"\n🔍 AUDITORÍA DE USUARIOS POTENCIALMENTE AFECTADOS")
    print("=" * 60)
    
    connection = conectar_bd()
    cursor = connection.cursor()
    
    try:
        # Buscar inscripciones en horario crítico (21:00-23:59 ART = 00:00-02:59 UTC del día siguiente)
        cursor.execute("""
            SELECT 
                HEX(i.id) as inscription_id,
                u.first_name,
                u.last_name,
                u.email,
                i.created_at as utc_time,
                DATE(i.created_at) as fecha_utc,
                TIME(i.created_at) as hora_utc,
                DATE(DATE_SUB(i.created_at, INTERVAL 3 HOUR)) as fecha_art_estimada,
                TIME(DATE_SUB(i.created_at, INTERVAL 3 HOUR)) as hora_art_estimada,
                i.status,
                CASE 
                    WHEN TIME(i.created_at) BETWEEN '00:00:00' AND '02:59:59' THEN 'SOSPECHOSO'
                    WHEN TIME(i.created_at) BETWEEN '21:00:00' AND '23:59:59' THEN 'REVISAR'
                    ELSE 'OK'
                END as evaluacion
            FROM inscriptions i
            JOIN user_entity u ON i.user_id = u.id
            WHERE 
                (
                    -- Inscripciones UTC entre 00:00-02:59 (posiblemente del día anterior ART)
                    TIME(i.created_at) BETWEEN '00:00:00' AND '02:59:59'
                    OR
                    -- Inscripciones UTC entre 21:00-23:59 (para comparación)
                    TIME(i.created_at) BETWEEN '21:00:00' AND '23:59:59'
                )
                AND DATE(i.created_at) >= '2025-08-01'  -- Solo agosto en adelante
            ORDER BY i.created_at DESC
        """)
        
        results = cursor.fetchall()
        
        print(f"📊 RESULTADOS DE AUDITORÍA:")
        print(f"   Total inscripciones analizadas: {len(results)}")
        
        sospechosos = [r for r in results if r[10] == 'SOSPECHOSO']
        revisar = [r for r in results if r[10] == 'REVISAR']
        
        print(f"   🚨 Casos SOSPECHOSOS (00:00-02:59 UTC): {len(sospechosos)}")
        print(f"   ⚠️  Casos a REVISAR (21:00-23:59 UTC): {len(revisar)}")
        
        if sospechosos:
            print(f"\n🚨 CASOS SOSPECHOSOS (posible fecha incorrecta):")
            print(f"{'Usuario':<25} {'Email':<30} {'Fecha UTC':<12} {'Hora UTC':<10} {'Fecha ART Est.':<12} {'Hora ART Est.':<10}")
            print("=" * 110)
            
            for result in sospechosos:
                ins_id, first_name, last_name, email, utc_time, fecha_utc, hora_utc, fecha_art, hora_art, status, eval = result
                nombre_completo = f"{first_name} {last_name}"[:24]
                email_corto = email[:29]
                print(f"{nombre_completo:<25} {email_corto:<30} {fecha_utc} {hora_utc} {fecha_art} {hora_art}")
        
        if revisar:
            print(f"\n⚠️  CASOS PARA REVISAR (inscripciones nocturnas):")
            print(f"{'Usuario':<25} {'Email':<30} {'Fecha UTC':<12} {'Hora UTC':<10}")
            print("=" * 80)
            
            for result in revisar[:10]:  # Solo primeros 10
                ins_id, first_name, last_name, email, utc_time, fecha_utc, hora_utc, fecha_art, hora_art, status, eval = result
                nombre_completo = f"{first_name} {last_name}"[:24]
                email_corto = email[:29]
                print(f"{nombre_completo:<25} {email_corto:<30} {fecha_utc} {hora_utc}")
            
            if len(revisar) > 10:
                print(f"... y {len(revisar) - 10} casos más")
        
        # Análisis por fechas
        print(f"\n📈 ANÁLISIS POR FECHAS:")
        cursor.execute("""
            SELECT 
                DATE(i.created_at) as fecha_utc,
                COUNT(*) as total_inscripciones,
                COUNT(CASE WHEN TIME(i.created_at) BETWEEN '00:00:00' AND '02:59:59' THEN 1 END) as sospechosas,
                COUNT(CASE WHEN TIME(i.created_at) BETWEEN '21:00:00' AND '23:59:59' THEN 1 END) as nocturnas
            FROM inscriptions i
            WHERE DATE(i.created_at) >= '2025-08-01'
            GROUP BY DATE(i.created_at)
            ORDER BY DATE(i.created_at) DESC
        """)
        
        fechas = cursor.fetchall()
        
        print(f"{'Fecha UTC':<12} {'Total':<8} {'Sospech.':<10} {'Nocturn.':<10} {'% Sospech.':<12}")
        print("=" * 60)
        
        for fecha_utc, total, sospechosas, nocturnas in fechas:
            porcentaje = (sospechosas / total * 100) if total > 0 else 0
            print(f"{fecha_utc} {total:<8} {sospechosas:<10} {nocturnas:<10} {porcentaje:>7.1f}%")
    
    except Exception as e:
        print(f"❌ Error en auditoría: {e}")
    
    finally:
        connection.close()

def generar_reporte_detallado():
    """Genera un reporte detallado para seguimiento"""
    print(f"\n📋 REPORTE DETALLADO DE CORRECCIÓN")
    print("=" * 50)
    
    print(f"🕐 Timestamp de corrección: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Acción realizada:")
    print(f"   ✅ Corrección aplicada a Gabriela Luis (aluis@mpfmza.gob.ar)")
    print(f"   🔍 Auditoría completa de casos similares")
    
    print(f"\n📋 PRÓXIMOS PASOS RECOMENDADOS:")
    print(f"   1. Revisar casos sospechosos identificados")
    print(f"   2. Contactar usuarios afectados para validación")
    print(f"   3. Preparar corrección masiva si es necesario")
    print(f"   4. Implementar solución general de timezone")
    print(f"   5. Establecer monitoreo de timestamps")
    
    print(f"\n⚠️  NOTAS IMPORTANTES:")
    print(f"   • Corrección aplicada solo afecta timestamps, no otros datos")
    print(f"   • Casos sospechosos requieren validación manual")
    print(f"   • Problema de timezone general persiste")
    print(f"   • Recomendar implementación urgente de solución general")

def main():
    """Función principal"""
    print("🔧 CORRECCIÓN Y AUDITORÍA TIMEZONE - MPD CONCURSOS")
    print("=" * 70)
    
    # 1. Corregir Gabriela Luis
    corregir_gabriela_luis()
    
    # 2. Auditar otros casos
    auditar_usuarios_afectados()
    
    # 3. Generar reporte
    generar_reporte_detallado()
    
    print(f"\n✅ Proceso completado exitosamente")

if __name__ == "__main__":
    main()
