#!/usr/bin/env python3
import mysql.connector
from datetime import datetime

# Conexión a la base de datos
try:
    conn = mysql.connector.connect(
        host='localhost',
        port=3307,
        user='root',
        password='root1234',
        database='mpd_concursos'
    )
    cursor = conn.cursor()
    
    # Obtener el concurso
    cursor.execute("""
        SELECT id, title, status, inscription_start_date, inscription_end_date, 
               start_date, end_date, created_at, updated_at
        FROM contests 
        WHERE id = 1
    """)
    
    contest = cursor.fetchone()
    
    if contest:
        print("=== DATOS DEL CONCURSO ===")
        print(f"ID: {contest[0]}")
        print(f"Título: {contest[1]}")
        print(f"Estado actual en DB: {contest[2]}")
        print(f"Fecha inicio inscripción: {contest[3]}")
        print(f"Fecha fin inscripción: {contest[4]}")
        print(f"Fecha inicio concurso: {contest[5]}")
        print(f"Fecha fin concurso: {contest[6]}")
        print(f"Creado: {contest[7]}")
        print(f"Actualizado: {contest[8]}")
        
        # Verificar fechas
        now = datetime.now()
        print(f"\n=== ANÁLISIS TEMPORAL ===")
        print(f"Fecha/Hora actual del sistema: {now}")
        
        inscription_end = contest[4]
        print(f"Fecha límite inscripción: {inscription_end}")
        
        if inscription_end:
            if now > inscription_end:
                print(f"✅ Inscripción CERRADA (pasaron {now - inscription_end})")
                print("🔴 Estado debería ser: CLOSED")
                
                # Simular el método getCurrentStatus() corregido
                status = contest[2]  # ACTIVE
                print(f"\n=== SIMULACIÓN getCurrentStatus() ===")
                print(f"Status actual: {status}")
                
                if status in ['ACTIVE', 'SCHEDULED']:
                    if inscription_end and now > inscription_end:
                        print("🎯 RESULTADO: getCurrentStatus() debería devolver CLOSED")
                        print("⚡ Con la corrección aplicada, el scheduler DEBERÍA actualizar el estado")
                    else:
                        print("⏰ RESULTADO: getCurrentStatus() devolvería ACTIVE")
                        
                # Verificar si el scheduler realmente está detectando el cambio
                print(f"\n=== DIAGNÓSTICO SCHEDULER ===")
                print("Si el scheduler muestra '0 concursos actualizados' significa que:")
                print("1. El método getCurrentStatus() está devolviendo el mismo estado que ya está en DB")
                print("2. O hay un problema en la lógica de comparación del scheduler")
            else:
                print(f"⏰ Inscripción ABIERTA (faltan {inscription_end - now})")
                print("🟢 Estado debería ser: ACTIVE")
                
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
