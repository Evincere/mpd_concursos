#!/usr/bin/env python3
import csv
from collections import defaultdict

# Leer el archivo CSV
usuarios_documentos = defaultdict(list)

with open('reporte_usuarios_afectados_utf8.csv', 'r', encoding='utf-8') as file:
    reader = csv.DictReader(file, delimiter='\t')
    for row in reader:
        email = row['email']
        usuarios_documentos[email].append({
            'nombre': row['nombre_completo'],
            'dni': row['dni'],
            'tipo_documento': row['tipo_documento'],
            'archivo': row['archivo_requerido'],
            'fecha_original': row['fecha_subida_original'],
            'estado': row['estado_documento']
        })

# Generar reporte por usuario
with open('reporte_personalizado_por_usuario.txt', 'w', encoding='utf-8') as output:
    output.write("=== REPORTE DE USUARIOS AFECTADOS - DOCUMENTOS FALTANTES ===\n")
    output.write(f"Fecha del reporte: 2025-08-03\n")
    output.write(f"Total de usuarios afectados: {len(usuarios_documentos)}\n")
    output.write(f"Total de documentos a re-subir: {sum(len(docs) for docs in usuarios_documentos.values())}\n\n")
    
    for i, (email, documentos) in enumerate(usuarios_documentos.items(), 1):
        primer_doc = documentos[0]
        output.write(f"--- USUARIO {i} ---\n")
        output.write(f"Email: {email}\n")
        output.write(f"Nombre: {primer_doc['nombre']}\n")
        output.write(f"DNI: {primer_doc['dni']}\n")
        output.write(f"Documentos faltantes ({len(documentos)}):\n")
        
        for j, doc in enumerate(documentos, 1):
            output.write(f"  {j}. {doc['tipo_documento']}\n")
            output.write(f"     Archivo: {doc['archivo']}\n")
            output.write(f"     Subido originalmente: {doc['fecha_original']}\n")
            output.write(f"     Estado: {doc['estado']}\n")
        
        output.write("\n" + "="*60 + "\n\n")

# Generar CSV para envíos masivos
with open('lista_emails_afectados.csv', 'w', encoding='utf-8', newline='') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(['Email', 'Nombre', 'DNI', 'Cantidad_Documentos', 'Documentos_Faltantes'])
    
    for email, documentos in usuarios_documentos.items():
        primer_doc = documentos[0]
        tipos_documentos = '; '.join([doc['tipo_documento'] for doc in documentos])
        writer.writerow([
            email,
            primer_doc['nombre'],
            primer_doc['dni'],
            len(documentos),
            tipos_documentos
        ])

print(f"Usuarios afectados: {len(usuarios_documentos)}")
print(f"Total documentos faltantes: {sum(len(docs) for docs in usuarios_documentos.values())}")
