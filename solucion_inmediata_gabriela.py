#!/usr/bin/env python3
"""
SOLUCIÓN INMEDIATA - CASO GABRIELA LUIS
Corrección específica del timestamp de inscripción
"""

import mysql.connector
from datetime import datetime, timedelta

def corregir_timestamp_gabriela():
    """Corrige el timestamp de la inscripción de Gabriela Luis"""
    print("🔧 CORRECCIÓN INMEDIATA - INSCRIPCIÓN GABRIELA LUIS")
    print("=" * 60)
    
    try:
        connection = mysql.connector.connect(
            host='localhost',
            port=3307,
            user='root',
            password='root1234',
            database='mpd_concursos'
        )
        
        cursor = connection.cursor()
        
        # 1. Verificar inscripción actual
        cursor.execute("""
            SELECT 
                HEX(i.id) as inscription_id,
                u.email,
                u.first_name,
                u.last_name,
                i.created_at,
                i.updated_at,
                i.inscription_date,
                i.status
            FROM inscriptions i
            JOIN user_entity u ON i.user_id = u.id
            WHERE u.email = 'aluis@mpfmza.gob.ar'
            ORDER BY i.created_at DESC
            LIMIT 1
        """)
        
        result = cursor.fetchone()
        
        if result:
            ins_id, email, first_name, last_name, created_at, updated_at, inscription_date, status = result
            
            print(f"📋 INSCRIPCIÓN ENCONTRADA:")
            print(f"   ID: {ins_id}")
            print(f"   Usuario: {first_name} {last_name}")
            print(f"   Email: {email}")
            print(f"   Estado: {status}")
            print(f"   🕐 Created At (UTC): {created_at}")
            print(f"   🕐 Updated At (UTC): {updated_at}")
            print(f"   🕐 Inscription Date (UTC): {inscription_date}")
            
            # 2. Calcular timestamp corregido (restar 3 horas)
            if created_at:
                # La inscripción se registró en UTC pero debería ser ART
                # UTC = ART + 3 horas, entonces ART = UTC - 3 horas
                corrected_created = created_at - timedelta(hours=3)
                corrected_updated = updated_at - timedelta(hours=3) if updated_at else None
                corrected_inscription_date = inscription_date - timedelta(hours=3) if inscription_date else None
                
                print(f"\n🔧 TIMESTAMPS CORREGIDOS (ART):")
                print(f"   Created At corregido: {corrected_created}")
                print(f"   Updated At corregido: {corrected_updated}")
                print(f"   Inscription Date corregido: {corrected_inscription_date}")
                
                # Verificar que la fecha corregida sea 08/08
                fecha_corregida = corrected_created.strftime('%Y-%m-%d')
                hora_corregida = corrected_created.strftime('%H:%M:%S')
                
                print(f"\n✅ VERIFICACIÓN:")
                print(f"   Fecha corregida: {fecha_corregida}")
                print(f"   Hora corregida: {hora_corregida}")
                
                if fecha_corregida == '2025-08-08':
                    print(f"   🎯 ¡CORRECTO! La inscripción fue el 08/08 como indicó la usuaria")
                    
                    print(f"\n❓ ¿APLICAR CORRECCIÓN?")
                    print(f"   IMPORTANTE: Esto modificará directamente la base de datos")
                    print(f"   Comando SQL que se ejecutaría:")
                    
                    # Convertir UUID hex a binary para la query
                    uuid_binary = f"UNHEX('{ins_id}')"
                    
                    print(f"""
   UPDATE inscriptions 
   SET 
       created_at = '{corrected_created}',
       updated_at = '{corrected_updated}',
       inscription_date = '{corrected_inscription_date}'
   WHERE id = {uuid_binary};
   """)
                    
                    print(f"\n⚠️  ADVERTENCIA:")
                    print(f"   - Esto afectará solo a esta inscripción específica")
                    print(f"   - Es una corrección puntual para resolver el reclamo")
                    print(f"   - El problema de timezone general seguirá existiendo")
                    
                else:
                    print(f"   ❌ ERROR: Fecha corregida no coincide con reclamo")
            
        else:
            print(f"❌ No se encontró inscripción para aluis@mpfmza.gob.ar")
        
        connection.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

def generar_reporte_gabriela():
    """Genera reporte completo del caso"""
    print(f"\n📋 REPORTE COMPLETO - CASO GABRIELA LUIS")
    print("=" * 60)
    
    print(f"👤 USUARIO AFECTADO:")
    print(f"   Nombre: Alejandra Gabriela LUIS")
    print(f"   Email: aluis@mpfmza.gob.ar")
    print(f"   Cargo: Co-Defensor/Co-Asesor Multifuero - Clase 03")
    
    print(f"\n🎯 PROBLEMA:")
    print(f"   • Se inscribió el 08/08 antes de las 21:45hs")
    print(f"   • Sistema registró fecha como 09/08")
    print(f"   • Causa: Contenedores en UTC vs usuarios en ART")
    
    print(f"\n✅ SOLUCIÓN INMEDIATA:")
    print(f"   • Corrección manual del timestamp en BD")
    print(f"   • Restar 3 horas a los timestamps UTC")
    print(f"   • Confirmar fecha real: 08/08/2025")
    
    print(f"\n🔧 SOLUCIÓN GENERAL:")
    print(f"   • Configurar timezone America/Argentina/Buenos_Aires")
    print(f"   • Actualizar docker-compose.production.yml")
    print(f"   • Reiniciar contenedores en horario de mantenimiento")
    
    print(f"\n📋 RECOMENDACIONES:")
    print(f"   1. Aplicar corrección inmediata para Gabriela Luis")
    print(f"   2. Programar corrección general de timezone")
    print(f"   3. Auditar otras inscripciones del mismo período")
    print(f"   4. Comunicar solución a la usuaria")

def main():
    """Función principal"""
    print("🕐 SOLUCIÓN INMEDIATA - PROBLEMA TIMEZONE GABRIELA LUIS")
    print("=" * 80)
    
    corregir_timestamp_gabriela()
    generar_reporte_gabriela()
    
    print(f"\n🎯 Análisis completado. Decisión requerida para aplicar corrección.")

if __name__ == "__main__":
    main()
