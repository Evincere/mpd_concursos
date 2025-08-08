#!/usr/bin/env python3
"""
Investigación sobre la situación del usuario María Jimena Nieto - DNI 28542331
"""

import mysql.connector
import json
from datetime import datetime

def conectar_db():
    """Conectar a la base de datos MySQL"""
    return mysql.connector.connect(
        host='localhost',
        port=3307,
        user='root',
        password='root1234',
        database='mpd_concursos'
    )

def investigar_usuario():
    """Investigar la situación completa del usuario"""
    conn = conectar_db()
    cursor = conn.cursor(dictionary=True)
    
    reporte = {
        "fecha_investigacion": datetime.now().isoformat(),
        "usuario_investigado": {
            "nombre": "María Jimena Nieto",
            "dni": "28542331"
        },
        "problema_reportado": "Usuario indica que el sistema le dice que su usuario no es válido, pero al intentar registrarse nuevamente se le notifica que su DNI ya está asociado a un usuario",
        "hallazgos": {}
    }
    
    try:
        # 1. Buscar información del usuario
        print("🔍 Investigando usuario en base de datos...")
        cursor.execute("""
            SELECT HEX(id) as id_hex, username, dni, first_name, last_name, email, 
                   status, created_at, birth_date, telefono, direccion, provincia, cuit
            FROM user_entity 
            WHERE dni = %s
        """, ('28542331',))
        
        usuario = cursor.fetchone()
        if usuario:
            reporte["hallazgos"]["usuario_encontrado"] = True
            reporte["hallazgos"]["datos_usuario"] = usuario
            print(f"✅ Usuario encontrado: {usuario['first_name']} {usuario['last_name']}")
            print(f"   Username: '{usuario['username']}'")
            print(f"   Estado: {usuario['status']}")
            print(f"   Email: {usuario['email']}")
            print(f"   Fecha creación: {usuario['created_at']}")
        else:
            reporte["hallazgos"]["usuario_encontrado"] = False
            print("❌ Usuario NO encontrado en la base de datos")
        
        # 2. Buscar intentos de login fallidos
        print("\n🔍 Buscando intentos de login...")
        cursor.execute("""
            SELECT * FROM audit_logs 
            WHERE username LIKE %s AND event_type = 'LOGIN_FAILURE'
            ORDER BY timestamp DESC 
            LIMIT 20
        """, ('%mjnieto%',))
        
        intentos_login = cursor.fetchall()
        reporte["hallazgos"]["intentos_login_fallidos"] = len(intentos_login)
        reporte["hallazgos"]["detalle_intentos_login"] = intentos_login
        
        print(f"📊 Encontrados {len(intentos_login)} intentos de login fallidos")
        
        # Mostrar los últimos intentos
        if intentos_login:
            print("🕒 Últimos intentos de login:")
            for intento in intentos_login[:5]:
                print(f"   - {intento['timestamp']}: '{intento['username']}' - {intento['description']}")
        
        # 3. Verificar patrones de username
        usernames_intentados = set()
        for intento in intentos_login:
            if intento['username']:
                usernames_intentados.add(intento['username'])
        
        reporte["hallazgos"]["usernames_intentados"] = list(usernames_intentados)
        print(f"\n📝 Usernames intentados: {list(usernames_intentados)}")
        
        # 4. Comparar con el username real
        if usuario:
            username_real = usuario['username']
            print(f"🎯 Username real en BD: '{username_real}'")
            
            # Analizar diferencias
            diferencias = []
            for username_intentado in usernames_intentados:
                if username_intentado != username_real:
                    diferencias.append({
                        "intentado": username_intentado,
                        "real": username_real,
                        "diferencia": f"El usuario intenta '{username_intentado}' pero el real es '{username_real}'"
                    })
            
            reporte["hallazgos"]["diferencias_username"] = diferencias
        
        # 5. Verificar inscripciones
        if usuario:
            print("\n🔍 Verificando inscripciones...")
            cursor.execute("""
                SELECT i.*, c.name as contest_name 
                FROM inscriptions i
                JOIN contests c ON i.contest_id = c.id
                WHERE i.user_id = UNHEX(%s)
            """, (usuario['id_hex'],))
            
            inscripciones = cursor.fetchall()
            reporte["hallazgos"]["inscripciones"] = len(inscripciones)
            reporte["hallazgos"]["detalle_inscripciones"] = inscripciones
            
            print(f"📋 Inscripciones encontradas: {len(inscripciones)}")
        
        # 6. Verificar documentos
        if usuario:
            print("\n🔍 Verificando documentos...")
            cursor.execute("""
                SELECT d.*, dt.name as document_type_name
                FROM documents d
                JOIN document_types dt ON d.document_type_id = dt.id
                WHERE d.user_id = UNHEX(%s)
            """, (usuario['id_hex'],))
            
            documentos = cursor.fetchall()
            reporte["hallazgos"]["documentos"] = len(documentos)
            reporte["hallazgos"]["detalle_documentos"] = documentos
            
            print(f"📄 Documentos encontrados: {len(documentos)}")
        
        # 7. Análisis del problema
        print("\n" + "="*60)
        print("📋 ANÁLISIS DEL PROBLEMA")
        print("="*60)
        
        if usuario:
            username_db = usuario['username']
            print(f"✅ DIAGNÓSTICO: El usuario SÍ existe en la base de datos")
            print(f"   - DNI: {usuario['dni']}")
            print(f"   - Nombre: {usuario['first_name']} {usuario['last_name']}")
            print(f"   - Username en BD: '{username_db}'")
            print(f"   - Estado: {usuario['status']}")
            
            # Verificar el problema del username
            username_limpio = username_db.rstrip('-')  # Remover guión final si existe
            print(f"\n🔧 PROBLEMA IDENTIFICADO:")
            print(f"   El username en la BD es: '{username_db}'")
            
            if username_db.endswith('-'):
                print(f"   ⚠️  El username termina con un guión '-' que puede estar causando problemas")
                print(f"   💡 El usuario probablemente está intentando: 'mjnieto7208' o 'mjnieto.7208'")
                print(f"   ❌ Pero el username correcto es: '{username_db}'")
                
                reporte["hallazgos"]["problema_identificado"] = {
                    "tipo": "username_con_caracter_especial",
                    "descripcion": "El username en la base de datos termina con un guión '-'",
                    "username_correcto": username_db,
                    "usernames_intentados": list(usernames_intentados)
                }
            
            print(f"\n💡 SOLUCIONES POSIBLES:")
            print(f"   1. El usuario debe usar exactamente: '{username_db}' para ingresar")
            print(f"   2. Considerar corregir el username en la BD si el guión final es un error")
            print(f"   3. Verificar el proceso de registro que generó este username")
            
        else:
            print(f"❌ El usuario NO existe en la base de datos")
            print(f"   Esto indica un problema más serio en el sistema")
        
        reporte["hallazgos"]["conclusion"] = {
            "usuario_existe": bool(usuario),
            "problema_principal": "Username con formato incorrecto (termina en guión)",
            "solucion_recomendada": f"Usuario debe ingresar con: '{usuario['username']}'" if usuario else "Investigar por qué no se creó el usuario"
        }
        
    except Exception as e:
        print(f"❌ Error en la investigación: {e}")
        reporte["hallazgos"]["error"] = str(e)
    
    finally:
        cursor.close()
        conn.close()
    
    # Guardar reporte
    with open('reporte_maria_jimena_nieto.json', 'w', encoding='utf-8') as f:
        json.dump(reporte, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"\n📄 Reporte guardado en: reporte_maria_jimena_nieto.json")
    return reporte

if __name__ == "__main__":
    investigar_usuario()
