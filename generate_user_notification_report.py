#!/usr/bin/env python3
"""
Script para generar reportes de notificación a usuarios
Crea listados detallados por usuario de documentos que deben volver a subir
"""

import os
import sys
import subprocess
import json
from datetime import datetime
from collections import defaultdict

class UserNotificationGenerator:
    def __init__(self):
        self.base_dir = "/root/concursos/mpd_concursos"
        self.missing_files = []
        
    def load_missing_files(self, report_file):
        """Carga la lista de archivos faltantes"""
        try:
            with open(report_file, 'r', encoding='utf-8') as f:
                report = json.load(f)
            
            self.missing_files = report.get('missing_files', [])
            print(f"✅ Cargados {len(self.missing_files)} archivos faltantes")
            return True
        except Exception as e:
            print(f"❌ Error cargando reporte: {e}")
            return False
    
    def get_document_type_from_path(self, file_path):
        """Extrae el tipo de documento desde el nombre del archivo"""
        filename = os.path.basename(file_path)
        
        # Mapeo de tipos de documentos comunes
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
        
        # Si no encuentra un mapeo específico, extraer del nombre
        if '_' in filename:
            parts = filename.split('_')
            if len(parts) > 2:
                # Intentar reconstruir el tipo desde las partes
                type_part = '_'.join(parts[1:-1])  # Excluir UUID y timestamp
                return type_part.replace('_', ' ')
        
        return 'Documento'
    
    def generate_user_reports(self):
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
        if not self.load_missing_files(latest_report):
            return False
        
        # Agrupar por usuario
        users_missing_files = defaultdict(list)
        
        for missing_file in self.missing_files:
            email = missing_file.get('email', 'sin_email@unknown.com')
            if email and email != 'sin_email@unknown.com':
                users_missing_files[email].append(missing_file)
        
        print(f"👥 Usuarios afectados: {len(users_missing_files)}")
        print(f"📄 Total documentos faltantes: {len(self.missing_files)}")
        print()
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Generar reporte CSV para administradores
        csv_filename = f"usuarios_documentos_faltantes_{timestamp}.csv"
        html_filename = f"notificaciones_usuarios_{timestamp}.html"
        
        # Crear CSV
        with open(csv_filename, 'w', encoding='utf-8') as csv_file:
            csv_file.write("email,cantidad_documentos,tipos_documentos,documento_ids\n")
            
            for email, files in sorted(users_missing_files.items()):
                doc_types = []
                doc_ids = []
                
                for file in files:
                    doc_type = self.get_document_type_from_path(file.get('file_path', ''))
                    doc_types.append(doc_type)
                    doc_ids.append(file.get('document_id', '')[:8])
                
                types_str = '; '.join(set(doc_types))  # Unique types
                ids_str = '; '.join(doc_ids)
                
                csv_file.write(f'"{email}",{len(files)},"{types_str}","{ids_str}"\n')
        
        # Crear HTML con template de emails
        with open(html_filename, 'w', encoding='utf-8') as html_file:
            html_file.write("""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notificaciones - Documentos Faltantes MPD Concursos</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .user-section { 
            border: 1px solid #ddd; 
            margin: 20px 0; 
            padding: 15px; 
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        .email-template {
            background-color: #fff;
            border: 1px solid #ccc;
            padding: 15px;
            margin: 10px 0;
            border-radius: 3px;
        }
        .document-list {
            background-color: #f0f8ff;
            padding: 10px;
            margin: 10px 0;
            border-left: 4px solid #0066cc;
        }
        h1 { color: #333; }
        h2 { color: #666; }
        .stats {
            background-color: #e8f4fd;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <h1>🔔 Notificaciones de Documentos Faltantes - MPD Concursos</h1>
    
    <div class="stats">
        <h2>📊 Estadísticas</h2>
        <ul>
""")
            html_file.write(f"            <li><strong>Fecha:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>\n")
            html_file.write(f"            <li><strong>Usuarios afectados:</strong> {len(users_missing_files)}</li>\n")
            html_file.write(f"            <li><strong>Total documentos faltantes:</strong> {len(self.missing_files)}</li>\n")
            html_file.write("        </ul>\n    </div>\n\n")
            
            # Generar sección por usuario
            user_count = 0
            for email, files in sorted(users_missing_files.items(), key=lambda x: len(x[1]), reverse=True):
                user_count += 1
                
                html_file.write(f'    <div class="user-section">\n')
                html_file.write(f'        <h2>👤 Usuario {user_count}: {email}</h2>\n')
                html_file.write(f'        <p><strong>Documentos faltantes:</strong> {len(files)}</p>\n\n')
                
                # Template de email
                html_file.write('        <div class="email-template">\n')
                html_file.write('            <h3>📧 Template de Email</h3>\n')
                html_file.write('            <hr>\n')
                html_file.write('            <p><strong>Asunto:</strong> MPD Concursos - Actualización requerida de documentos</p>\n')
                html_file.write('            <p><strong>Estimado/a usuario/a,</strong></p>\n')
                html_file.write('            <p>Como parte de las mejoras en nuestro sistema, hemos detectado que algunos de sus documentos requieren ser nuevamente cargados.</p>\n')
                html_file.write('            <div class="document-list">\n')
                html_file.write('                <p><strong>📋 Documentos que debe volver a cargar:</strong></p>\n')
                html_file.write('                <ul>\n')
                
                # Listar documentos únicos
                doc_types = set()
                for file in files:
                    doc_type = self.get_document_type_from_path(file.get('file_path', ''))
                    doc_types.add(doc_type)
                
                for doc_type in sorted(doc_types):
                    html_file.write(f'                    <li>{doc_type}</li>\n')
                
                html_file.write('                </ul>\n')
                html_file.write('            </div>\n')
                html_file.write('            <p><strong>📝 Instrucciones:</strong></p>\n')
                html_file.write('            <ol>\n')
                html_file.write('                <li>Ingrese a su cuenta en el sistema MPD Concursos</li>\n')
                html_file.write('                <li>Vaya a la sección de documentos</li>\n')
                html_file.write('                <li>Localice los documentos listados arriba</li>\n')
                html_file.write('                <li><strong>Elimine los documentos que aparecen pero no se pueden visualizar</strong></li>\n')
                html_file.write('                <li>Cargue nuevamente cada documento requerido</li>\n')
                html_file.write('            </ol>\n')
                html_file.write('            <p>Si tiene alguna consulta, no dude en contactarnos.</p>\n')
                html_file.write('            <p>Saludos cordiales,<br>Equipo MPD Concursos</p>\n')
                html_file.write('        </div>\n')
                html_file.write('    </div>\n\n')
        
        html_file.write('</body>\n</html>')
        
        # Generar lista simple de emails
        emails_filename = f"emails_para_notificar_{timestamp}.txt"
        with open(emails_filename, 'w', encoding='utf-8') as emails_file:
            for email in sorted(users_missing_files.keys()):
                emails_file.write(f"{email}\n")
        
        # Generar reporte estadístico
        stats_filename = f"estadisticas_faltantes_{timestamp}.json"
        
        stats_data = {
            'timestamp': timestamp,
            'total_users_affected': len(users_missing_files),
            'total_documents_missing': len(self.missing_files),
            'users_by_document_count': {},
            'document_types_frequency': defaultdict(int)
        }
        
        # Estadísticas por cantidad de documentos
        for email, files in users_missing_files.items():
            count = len(files)
            if count not in stats_data['users_by_document_count']:
                stats_data['users_by_document_count'][count] = 0
            stats_data['users_by_document_count'][count] += 1
            
            # Frecuencia de tipos de documentos
            for file in files:
                doc_type = self.get_document_type_from_path(file.get('file_path', ''))
                stats_data['document_types_frequency'][doc_type] += 1
        
        with open(stats_filename, 'w', encoding='utf-8') as stats_file:
            json.dump(stats_data, stats_file, indent=2, ensure_ascii=False, default=str)
        
        # Mostrar resumen
        print("📊 RESUMEN DE REPORTES GENERADOS:")
        print("=" * 40)
        print(f"📄 CSV Administrativo: {csv_filename}")
        print(f"🌐 HTML con Templates: {html_filename}")
        print(f"📧 Lista de Emails: {emails_filename}")
        print(f"📈 Estadísticas: {stats_filename}")
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
                doc_type = self.get_document_type_from_path(file.get('file_path', ''))
                doc_type_count[doc_type] += 1
        
        sorted_doc_types = sorted(doc_type_count.items(), key=lambda x: x[1], reverse=True)
        for doc_type, count in sorted_doc_types[:10]:
            print(f"• {doc_type}: {count} documentos")
        
        print()
        print("✅ GENERACIÓN DE REPORTES COMPLETADA")
        
        return True

def main():
    generator = UserNotificationGenerator()
    
    try:
        success = generator.generate_user_reports()
        if not success:
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Error generando reportes: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
