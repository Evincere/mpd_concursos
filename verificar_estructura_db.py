#!/usr/bin/env python3
"""
Verificar estructura de la base de datos
"""

import mysql.connector

def conectar_db():
    return mysql.connector.connect(
        host='localhost',
        port=3307,
        user='mpd_user',
        password='mpd_password',
        database='mpd_concursos'
    )

def verificar_estructura():
    conn = conectar_db()
    cursor = conn.cursor()
    
    print("🔍 VERIFICANDO ESTRUCTURA DE LA BASE DE DATOS")
    print("=" * 60)
    
    # Mostrar todas las tablas
    cursor.execute("SHOW TABLES")
    tablas = cursor.fetchall()
    
    print("📋 TABLAS DISPONIBLES:")
    for tabla in tablas:
        print(f"   • {tabla[0]}")
    
    print("\n📊 ESTRUCTURA DE LA TABLA user_entity:")
    print("-" * 50)
    cursor.execute("DESCRIBE user_entity")
    columnas = cursor.fetchall()
    
    for columna in columnas:
        print(f"   • {columna[0]} ({columna[1]}) - {columna[3] if columna[3] else 'NOT NULL'}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    verificar_estructura()