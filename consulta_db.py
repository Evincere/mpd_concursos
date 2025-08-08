import mysql.connector

db_config = {
    'host': 'localhost',
    'port': 3307,
    'user': 'root',
    'password': 'root1234',
    'database': 'mpd_concursos'
}

conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

# Contar documentos total en BD
cursor.execute("SELECT COUNT(*) as total_docs FROM documents WHERE is_archived = 0;")
total_docs = cursor.fetchone()[0]

# Contar documentos únicos por file_path
cursor.execute("SELECT COUNT(DISTINCT file_path) as unique_paths FROM documents WHERE is_archived = 0 AND file_path IS NOT NULL AND file_path != '';")
unique_paths = cursor.fetchone()[0]

# Ejemplo de algunos file_paths
cursor.execute("SELECT file_path FROM documents WHERE is_archived = 0 AND file_path IS NOT NULL AND file_path != '' LIMIT 10;")
sample_paths = cursor.fetchall()

print(f"Total documentos en BD: {total_docs}")
print(f"Rutas únicas de archivos: {unique_paths}")
print("\nEjemplos de rutas almacenadas:")
for path in sample_paths:
    print(f"  - {path[0]}")

cursor.close()
conn.close()
