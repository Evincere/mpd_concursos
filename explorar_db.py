import mysql.connector

db_config = {
    'host': 'localhost',
    'port': 3307,
    'user': 'root',
    'password': 'root1234',
    'database': 'mpd_concursos'
}

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    print("Tablas en la base de datos mpd_concursos:")
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    
    for table in tables:
        print(f"  - {table[0]}")
        
    # Buscar tablas que podrían contener información de usuarios
    user_tables = [t[0] for t in tables if 'user' in t[0].lower() or 'usuario' in t[0].lower() or 'person' in t[0].lower()]
    
    if user_tables:
        print(f"\nTablas relacionadas con usuarios: {user_tables}")
        for table in user_tables:
            print(f"\nEstructura de la tabla {table}:")
            cursor.execute(f"DESCRIBE {table}")
            columns = cursor.fetchall()
            for col in columns:
                print(f"  - {col[0]} ({col[1]})")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
