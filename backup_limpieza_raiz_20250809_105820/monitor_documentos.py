#!/usr/bin/env python3
# Script de monitoreo automático de documentos
# Ejecutar diariamente para verificar integridad

import mysql.connector
import subprocess
from datetime import datetime

def check_document_integrity():
    """Verifica integridad de documentos diariamente"""
    
    DB_CONFIG = {
        'host': 'localhost',
        'port': 3307,
        'user': 'root',
        'password': 'root1234',
        'database': 'mpd_concursos'
    }
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Verificar documentos huérfanos (en DB pero sin archivo)
        cursor.execute("SELECT COUNT(*) FROM documents WHERE status = 'PENDING' AND upload_date < DATE_SUB(NOW(), INTERVAL 1 HOUR)")
        old_pending = cursor.fetchone()[0]
        
        if old_pending > 10:
            print(f"⚠️  ALERTA: {old_pending} documentos pendientes por más de 1 hora")
            print("🔧 Ejecutar script de corrección")
        
        print(f"📊 Monitoreo completado: {datetime.now()}")
        
    except Exception as e:
        print(f"❌ Error en monitoreo: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    check_document_integrity()
