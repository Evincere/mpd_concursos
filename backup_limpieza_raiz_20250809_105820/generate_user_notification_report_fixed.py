#!/usr/bin/env python3
"""
Script para generar reportes de notificación a usuarios - CORREGIDO
"""

import os
import sys
import json
from datetime import datetime
from collections import defaultdict

def generate_user_reports():
    """Genera reportes por usuario"""
    print("🚀 GENERANDO REPORTES DE NOTIFICACIÓN A USUARIOS")
    print("=" * 60)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Cargar archivos faltantes
    report_files = [f for f in os.listdir('.') if f.startswith('document_integrity_report_') and f.endswith('.json')]
    if not report_files:
        print("❌ No se encontró reporte de auditoría")
        return False
    
    latest_report = max(report_files)
    
    try:
        with open(latest_report, 'r', encoding='utf-8') as f:
            report = json.load(f)
        
        missing_files = report.get('missing_files', [])
        print(f"✅ Cargados {len(missing_files)} archivos faltantes")
    except Exception as e:
        print(f"❌ Error cargando reporte: {e}")
        return False
    
    # Función para extraer tipo de documento
    def get_document_type_from_path(file_path):
        filename = os.path.basename(file_path)
        
        type_mappings = {
            'DNI__Frontal__': 'DNI (Frontal)',
            'DNI__Dorso__': 'DNI (Dorso)', 
            'Constancia_de_CUIL': 'Constancia de CUIL',
            'Certificado_de_Antecedentes_Penales': 'Certificado de Antecedentes Penales',
            'T_tulo_Universitario_y_Certificado_Anal_tico': 'Título Universitario y Certificado Analítico',
            'Certificado_Ley_Micaela': 'Certificado Ley Micaela',
            'Certificado_de_Antig_edad_Profesional': 'Certificado de Antigüedad Profesional',
            'Certificado_Sin_Sanciones_Disciplinarias': 'Certificado Sin Sanciones Disciplinarias',
            'Documento_Adicional': 'Documento Adicional'
        }
        
        for key, value in type_mappings.items():
            if key in filename:
                return value
        
        return 'Documento'
    
    # Agrupar por usuario
    users_missing_files = defaultdict(list)
    
    for missing_file in missing_files:
        email = missing_file.get('email', 'sin_email@unknown.com')
        if email and email != 'sin_email@unknown.com':
            users_missing_files[email].append(missing_file)
    
    print(f"👥 Usuarios afectados: {len(users_missing_files)}")
    print(f"📄 Total documentos faltantes: {len(missing_files)}")
    print()
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Generar reporte CSV para administradores
    csv_filename = f"usuarios_documentos_faltantes_{timestamp}.csv"
    
    print("📝 Generando CSV administrativo...")
    with open(csv_filename, 'w', encoding='utf-8') as csv_file:
        csv_file.write("email,cantidad_documentos,tipos_documentos,documento_ids\n")
        
        for email, files in sorted(users_missing_files.items()):
            doc_types = []
            doc_ids = []
            
            for file in files:
                doc_type = get_document_type_from_path(file.get('file_path', ''))
                doc_types.append(doc_type)
                doc_ids.append(file.get('document_id', '')[:8])
            
            types_str = '; '.join(set(doc_types))
            ids_str = '; '.join(doc_ids)
            
            csv_file.write(f'"{email}",{len(files)},"{types_str}","{ids_str}"\n')
    
    # Generar lista de emails
    emails_filename = f"emails_para_notificar_{timestamp}.txt"
    
    print("📧 Generando lista de emails...")
    with open(emails_filename, 'w', encoding='utf-8') as emails_file:
        for email in sorted(users_missing_files.keys()):
            emails_file.write(f"{email}\n")
    
    # Generar template de email individual
    template_filename = f"template_email_individual_{timestamp}.html"
    
    print("🌐 Generando template de email...")
    with open(template_filename, 'w', encoding='utf-8') as template_file:
        template_file.write("""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>MPD Concursos - Actualización de Documentos</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .footer { background-color: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 5px 5px; font-size: 12px; }
        .document-list { background-color: #fff; border-left: 4px solid #0066cc; padding: 15px; margin: 15px 0; }
        .steps { background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .warning { color: #d63384; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏛️ MPD Concursos</h1>
        <p>Actualización Requerida de Documentos</p>
    </div>
    
    <div class="content">
        <p><strong>Estimado/a usuario/a,</strong></p>
        
        <p>Como parte de las mejoras en nuestro sistema de concursos, hemos detectado que algunos de sus documentos requieren ser nuevamente cargados para asegurar su correcta visualización y procesamiento.</p>
        
        <div class="document-list">
            <h3>📋 Documentos que debe actualizar:</h3>
            <p><em>[AQUÍ SE INSERTARÁN LOS DOCUMENTOS ESPECÍFICOS PARA CADA USUARIO]</em></p>
            <ul>
                <li>DNI (Frontal)</li>
                <li>DNI (Dorso)</li>
                <li>Constancia de CUIL</li>
                <li>[Otros documentos según corresponda]</li>
            </ul>
        </div>
        
        <div class="steps">
            <h3>📝 Instrucciones paso a paso:</h3>
            <ol>
                <li>Ingrese a su cuenta en el sistema MPD Concursos</li>
                <li>Diríjase a la sección de <strong>"Documentos"</strong></li>
                <li>Localice los documentos listados arriba</li>
                <li class="warning">IMPORTANTE: Elimine los documentos que aparecen cargados pero que no se pueden visualizar</li>
                <li>Una vez eliminados, el sistema los marcará automáticamente como archivados</li>
                <li>Proceda a cargar nuevamente cada documento requerido</li>
                <li>Verifique que cada documento se visualice correctamente después de la carga</li>
            </ol>
        </div>
        
        <p><strong>⏰ Plazo recomendado:</strong> Le sugerimos completar este proceso dentro de los próximos 10 días hábiles.</p>
        
        <p><strong>❓ Consultas:</strong> Si tiene alguna duda o inconveniente técnico, no dude en contactarnos respondiendo a este email.</p>
        
        <p>Gracias por su colaboración para mantener la integridad del sistema.</p>
        
        <p>Saludos cordiales,</p>
        <p><strong>Equipo Técnico MPD Concursos</strong></p>
    </div>
    
    <div class="footer">
        <p>Este es un mensaje automático del sistema MPD Concursos</p>
        <p>Fecha de generación: """ + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + """</p>
    </div>
</body>
</html>""")
    
    # Mostrar estadísticas
    print("\n📊 RESUMEN DE REPORTES GENERADOS:")
    print("=" * 40)
    print(f"📄 CSV Administrativo: {csv_filename}")
    print(f"📧 Lista de Emails: {emails_filename}")
    print(f"🌐 Template HTML: {template_filename}")
    print()
    
    print("👥 TOP 10 USUARIOS MÁS AFECTADOS:")
    print("-" * 40)
    sorted_users = sorted(users_missing_files.items(), key=lambda x: len(x[1]), reverse=True)
    for i, (email, files) in enumerate(sorted_users[:10], 1):
        print(f"{i:2d}. {email}: {len(files)} documentos")
    
    print()
    print("📋 TIPOS DE DOCUMENTOS MÁS FALTANTES:")
    print("-" * 40)
    doc_type_count = defaultdict(int)
    for files in users_missing_files.values():
        for file in files:
            doc_type = get_document_type_from_path(file.get('file_path', ''))
            doc_type_count[doc_type] += 1
    
    sorted_doc_types = sorted(doc_type_count.items(), key=lambda x: x[1], reverse=True)
    for doc_type, count in sorted_doc_types:
        print(f"• {doc_type}: {count} documentos")
    
    print()
    print("✅ GENERACIÓN DE REPORTES COMPLETADA")
    
    return True

if __name__ == "__main__":
    try:
        success = generate_user_reports()
        if not success:
            sys.exit(1)
    except Exception as e:
        print(f"❌ Error generando reportes: {e}")
        sys.exit(1)
