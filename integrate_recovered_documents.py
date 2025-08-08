#!/usr/bin/env python3
"""
Script para integrar documentos ya recuperados desde recovered_documents
"""

import os
import sys
import subprocess
import json
from datetime import datetime

class RecoveredDocumentsIntegrator:
    def __init__(self):
        self.base_dir = "/root/concursos/mpd_concursos"
        self.missing_files = []
        self.integration_stats = {
            'integrated': 0,
            'failed_integration': 0,
            'not_found_in_recovery': 0
        }
        
    def load_missing_files(self, report_file):
        """Carga la lista de archivos faltantes desde el reporte de auditoría"""
        try:
            with open(report_file, 'r', encoding='utf-8') as f:
                report = json.load(f)
            
            self.missing_files = report.get('missing_files', [])
            print(f"✅ Cargados {len(self.missing_files)} archivos faltantes desde {report_file}")
            return True
        except Exception as e:
            print(f"❌ Error cargando reporte: {e}")
            return False
    
    def get_recovered_files_map(self):
        """Obtiene un mapeo de todos los archivos en recovered_documents"""
        print("🔍 Escaneando archivos en recovered_documents...")
        
        # Listar archivos en recovered_documents
        cmd = [
            'docker', 'compose', 'exec', '-T', 'backend',
            'find', '/app/storage/recovered_documents', '-name', '*.pdf', '-type', 'f'
        ]
        
        result = subprocess.run(cmd, cwd=self.base_dir, capture_output=True, text=True)
        
        if result.returncode != 0:
            print("❌ Error obteniendo archivos recuperados")
            return {}
        
        recovered_files = {}
        lines = result.stdout.strip().split('\n')
        
        for line in lines:
            if line.strip():
                # Extraer nombre del archivo y crear mapeo
                filename = os.path.basename(line)
                recovered_files[filename] = line
                
                # También mapear por UUID si existe en el nombre
                parts = filename.split('_')
                if len(parts) > 0 and len(parts[0]) >= 8:
                    uuid_part = parts[0]
                    if '-' in uuid_part:
                        recovered_files[uuid_part] = line
        
        print(f"✅ Encontrados {len(lines)} archivos recuperados")
        return recovered_files
    
    def copy_from_recovery_to_documents(self, source_path, target_path):
        """Copia un archivo desde recovered_documents a documents"""
        try:
            # Crear directorio destino si no existe
            target_dir = os.path.dirname(target_path)
            if target_dir:
                cmd = [
                    'docker', 'compose', 'exec', '-T', 'backend',
                    'mkdir', '-p', f'/app/storage/{target_dir}'
                ]
                subprocess.run(cmd, cwd=self.base_dir, capture_output=True)
            
            # Copiar archivo dentro del contenedor
            cmd = [
                'docker', 'compose', 'exec', '-T', 'backend',
                'cp', source_path, f'/app/storage/{target_path}'
            ]
            
            result = subprocess.run(cmd, cwd=self.base_dir, capture_output=True, text=True)
            
            if result.returncode == 0:
                # Verificar que el archivo se copió
                verify_cmd = [
                    'docker', 'compose', 'exec', '-T', 'backend',
                    'test', '-f', f'/app/storage/{target_path}'
                ]
                verify_result = subprocess.run(verify_cmd, cwd=self.base_dir, capture_output=True)
                return verify_result.returncode == 0
            
            return False
            
        except Exception as e:
            print(f"❌ Error en copia: {e}")
            return False
    
    def integrate_recovered_documents(self):
        """Integra documentos desde recovered_documents"""
        print("🚀 INICIANDO INTEGRACIÓN DE DOCUMENTOS RECUPERADOS")
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
        
        # Obtener mapeo de archivos recuperados
        recovered_files_map = self.get_recovered_files_map()
        if not recovered_files_map:
            print("⚠️ No hay archivos en recovered_documents")
            return False
        
        # Intentar integrar cada archivo faltante
        integrated_count = 0
        
        print(f"🔍 Buscando coincidencias para {len(self.missing_files)} archivos faltantes...")
        print()
        
        for i, missing_file in enumerate(self.missing_files, 1):
            file_path = missing_file.get('file_path', '')
            email = missing_file.get('email', '')
            doc_id = missing_file.get('document_id', '')
            
            if not file_path:
                continue
            
            # Mostrar progreso
            if i % 20 == 0:
                print(f"📊 Progreso: {i}/{len(self.missing_files)} - Integrados: {integrated_count}")
            
            # Buscar archivo por diferentes métodos
            recovered_path = None
            filename = os.path.basename(file_path)
            
            # 1. Buscar por nombre completo
            if filename in recovered_files_map:
                recovered_path = recovered_files_map[filename]
            
            # 2. Buscar por UUID del documento
            elif doc_id in recovered_files_map:
                recovered_path = recovered_files_map[doc_id]
            
            # 3. Buscar por UUID en formato completo
            elif doc_id[:8] in recovered_files_map:
                recovered_path = recovered_files_map[doc_id[:8]]
            
            # 4. Buscar archivos que contengan el UUID
            else:
                for name, path in recovered_files_map.items():
                    if doc_id[:8] in name or doc_id in name:
                        recovered_path = path
                        break
            
            # Si encontramos el archivo, integrarlo
            if recovered_path:
                if self.copy_from_recovery_to_documents(recovered_path, file_path):
                    integrated_count += 1
                    self.integration_stats['integrated'] += 1
                    print(f"✅ INTEGRADO: {doc_id[:8]} - {email[:30]}")
                    missing_file['integrated_from'] = recovered_path
                else:
                    self.integration_stats['failed_integration'] += 1
                    print(f"⚠️ ENCONTRADO PERO NO INTEGRADO: {doc_id[:8]} - {email[:30]}")
            else:
                self.integration_stats['not_found_in_recovery'] += 1
        
        # Estadísticas finales
        still_missing = len([f for f in self.missing_files if 'integrated_from' not in f])
        
        print("\n" + "=" * 60)
        print("📊 RESUMEN DE INTEGRACIÓN")
        print("=" * 60)
        print(f"✅ Archivos integrados exitosamente: {integrated_count}")
        print(f"⚠️ Errores de integración: {self.integration_stats['failed_integration']}")
        print(f"❌ No encontrados en recovered_documents: {self.integration_stats['not_found_in_recovery']}")
        print(f"📊 Archivos aún faltantes: {still_missing}")
        
        if len(self.missing_files) > 0:
            integration_percentage = (integrated_count/len(self.missing_files))*100
            print(f"📈 Porcentaje de integración: {integration_percentage:.2f}%")
        
        # Guardar reporte
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        integration_report = {
            'timestamp': timestamp,
            'total_integrated': integrated_count,
            'failed_integration': self.integration_stats['failed_integration'],
            'not_found_in_recovery': self.integration_stats['not_found_in_recovery'],
            'still_missing': still_missing,
            'integrated_files': [f for f in self.missing_files if 'integrated_from' in f],
            'remaining_missing_files': [f for f in self.missing_files if 'integrated_from' not in f]
        }
        
        report_file = f"integration_report_{timestamp}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(integration_report, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"💾 Reporte de integración guardado: {report_file}")
        
        return integrated_count > 0

def main():
    integrator = RecoveredDocumentsIntegrator()
    
    try:
        success = integrator.integrate_recovered_documents()
        if success:
            print("\n🎉 INTEGRACIÓN COMPLETADA CON ARCHIVOS INTEGRADOS")
        else:
            print("\n⚠️ INTEGRACIÓN COMPLETADA SIN ARCHIVOS INTEGRADOS")
            
    except Exception as e:
        print(f"\n❌ Error durante integración: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
