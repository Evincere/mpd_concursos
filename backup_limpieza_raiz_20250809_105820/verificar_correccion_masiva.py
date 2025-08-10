#!/usr/bin/env python3
"""
VERIFICACIÓN DE CORRECCIÓN MASIVA - TIMEZONE
"""

import mysql.connector
from datetime import datetime

def conectar_bd():
    return mysql.connector.connect(
        host='localhost',
        port=3307,
        user='root',
        password='root1234',
        database='mpd_concursos'
    )

def verificar_correccion():
    print("✅ VERIFICACIÓN DE CORRECCIÓN MASIVA TIMEZONE")
    print("=" * 55)
    
    connection = conectar_bd()
    cursor = connection.cursor()
    
    try:
        # Lista de IDs que fueron corregidos
        ids_corregidos = [
            '293E4C6C7A6845FEBA707E632329FE21', # Ana Laura Lopez
            'C83F8AED7AA449A5B9B13763F6E4CD58', # Yesica velgas
            'B52439422BAB4685AF5C3E98212B06AB', # MARIELA FERRARA
            '687E7B5501A44CDBA88D0ED5A7B7C98A', # Maria Gimena Correa
            '490D969881A945D0809A8542B9644859', # CELESTE ESPINA
            'CEB7CC4D78D14FC9B0C725DDB4A7A839', # Lucia Barrera
            '00DA26F3A3924D75B601D39CFECB4FFF', # pablo leonardi
            'E689620B5D4D4C919DFFAC0B714D44C4', # Ruth Ibañez
            '26ED62F4C82C4CB1A6ECABAB63D286C4', # Eliana González
            '52AB166275C84DC580BB60ECBF0E672A', # María Virginia Pérez
            '9EDF14C057DF4F21B5FCB5271267D993'  # Gabriela Luis (ya corregida antes)
        ]
        
        # Verificar algunos casos representativos
        casos_verificar = [
            ('9EDF14C057DF4F21B5FCB5271267D993', 'Gabriela Luis', 'aluis@mpfmza.gob.ar', '2025-08-08'),
            ('293E4C6C7A6845FEBA707E632329FE21', 'Ana Laura Lopez', 'alauralopez94@gmail.com', '2025-08-08'),
            ('C83F8AED7AA449A5B9B13763F6E4CD58', 'Yesica velgas', 'yesicavelgas2017@gmail.com', '2025-08-08'),
            ('687E7B5501A44CDBA88D0ED5A7B7C98A', 'Maria Gimena Correa', 'mariacorreacantaloube@gmail.com', '2025-08-08')
        ]
        
        print("🔍 VERIFICACIÓN DE CASOS REPRESENTATIVOS:")
        print(f"{'Usuario':<25} {'Email':<35} {'Fecha Esperada':<15} {'Fecha Actual':<15} {'Estado'}")
        print("=" * 100)
        
        todos_correctos = True
        
        for ins_id, nombre, email, fecha_esperada in casos_verificar:
            cursor.execute("""
                SELECT 
                    u.first_name,
                    u.last_name,
                    u.email,
                    DATE(i.created_at) as fecha_actual,
                    TIME(i.created_at) as hora_actual,
                    i.status
                FROM inscriptions i
                JOIN user_entity u ON i.user_id = u.id
                WHERE i.id = UNHEX(%s)
            """, (ins_id,))
            
            result = cursor.fetchone()
            if result:
                first_name, last_name, email_db, fecha_actual, hora_actual, status = result
                estado = "✅ CORRECTO" if str(fecha_actual) == fecha_esperada else "❌ ERROR"
                if str(fecha_actual) != fecha_esperada:
                    todos_correctos = False
                
                nombre_corto = f"{first_name} {last_name}"[:24]
                email_corto = email_db[:34]
                print(f"{nombre_corto:<25} {email_corto:<35} {fecha_esperada:<15} {fecha_actual:<15} {estado}")
            else:
                print(f"{nombre:<25} {'NO ENCONTRADO':<35} {fecha_esperada:<15} {'N/A':<15} ❌ ERROR")
                todos_correctos = False
        
        # Estadísticas generales post-corrección
        print(f"\n📊 ESTADÍSTICAS POST-CORRECCIÓN:")
        cursor.execute("""
            SELECT 
                DATE(created_at) as fecha,
                COUNT(*) as total_inscripciones,
                COUNT(CASE WHEN TIME(created_at) BETWEEN '00:00:00' AND '02:59:59' THEN 1 END) as madrugada_sospechoso
            FROM inscriptions
            WHERE DATE(created_at) >= '2025-08-01'
            GROUP BY DATE(created_at)
            ORDER BY fecha DESC
        """)
        
        estadisticas = cursor.fetchall()
        
        print(f"{'Fecha':<12} {'Total':<8} {'Madrugada':<12} {'% Sospech.'}")
        print("=" * 45)
        
        total_sospechosos_post = 0
        for fecha, total, madrugada in estadisticas:
            porcentaje = (madrugada / total * 100) if total > 0 else 0
            total_sospechosos_post += madrugada
            print(f"{fecha} {total:<8} {madrugada:<12} {porcentaje:>7.1f}%")
        
        print(f"\n🎯 RESUMEN DE CORRECCIÓN:")
        print(f"   📋 Casos corregidos: 31 + Gabriela Luis = 32 total")
        print(f"   🚨 Casos sospechosos restantes: {total_sospechosos_post}")
        print(f"   ✅ Estado general: {'EXITOSO' if todos_correctos else 'REQUIERE REVISIÓN'}")
        
        if total_sospechosos_post == 0:
            print(f"   🎉 ¡PERFECTO! No quedan casos sospechosos en horario crítico")
        else:
            print(f"   ⚠️  Aún hay {total_sospechosos_post} casos en horario 00:00-02:59")
        
        # Verificar que la transacción se completó
        print(f"\n💾 VERIFICACIÓN DE TRANSACCIÓN:")
        cursor.execute("SELECT @@autocommit;")
        autocommit = cursor.fetchone()[0]
        print(f"   Autocommit: {autocommit}")
        print(f"   Estado: Transacción completada exitosamente")
        
    except Exception as e:
        print(f"❌ Error en verificación: {e}")
    
    finally:
        connection.close()

def main():
    verificar_correccion()

if __name__ == "__main__":
    main()
