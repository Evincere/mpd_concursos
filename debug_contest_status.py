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
            else:
                print(f"⏰ Inscripción ABIERTA (faltan {inscription_end - now})")
                print("🟢 Estado debería ser: ACTIVE")
        
        print(f"\n=== PROBLEMA IDENTIFICADO ===")
        print(f"Estado en DB: {contest[2]}")
        if inscription_end and now > inscription_end:
            if contest[2] == 'ACTIVE':
                print("🚨 PROBLEMA: El concurso está ACTIVE pero debería estar CLOSED")
                print("🚨 El scheduler no está actualizando correctamente el estado")
        
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
