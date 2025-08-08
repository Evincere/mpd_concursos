#!/usr/bin/env python3
"""
Script de recuperación integral de documentos - Versión 2
Corregido para buscar en las ubicaciones correctas de los backups
"""

import os
import sys
import subprocess
import json
import tempfile
import shutil
from datetime import datetime
from pathlib import Path

class DocumentRecovery:
    def __init__(self):
        self.base_dir = "/root/concursos/mpd_concursos"
        self.temp_dir = None
        self.missing_files = []
        self.recovery_stats = {
            'found_in_backups': 0,
            'successfully_restored': 0,
            'failed_to_restore': 0,
            'still_missing': 0
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
    
    def setup_temp_directory(self):
        """Crea directorio temporal para extracciones"""
        self.temp_dir = tempfile.mkdtemp(prefix="recovery_", dir="/tmp")
        print(f"📁 Directorio temporal: {self.temp_dir}")
        return True
    
    def cleanup_temp_directory(self):
        """Limpia directorio temporal"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
            print(f"🧹 Limpieza del directorio temporal completada")
    
    def extract_backup(self, backup_path, extract_to):
        """Extrae un backup a un directorio específico"""
        try:
            print(f"📦 Extrayendo {os.path.basename(backup_path)}...")
            
            # Crear directorio de destino
            os.makedirs(extract_to, exist_ok=True)
            
            # Extraer backup
            result = subprocess.run([
                'tar', '-xzf', backup_path, '-C', extract_to
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"✅ Backup extraído exitosamente")
                return True
            else:
                print(f"❌ Error extrayendo backup: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error en extracción: {e}")
            return False
    
    def find_file_in_backup(self, file_path, backup_dir):
        """Busca un archivo específico en las diferentes ubicaciones posibles del backup"""
        # Posibles ubicaciones del archivo en el backup
        search_paths = [
            os.path.join(backup_dir, file_path),  # Ruta directa
            os.path.join(backup_dir, "storage", file_path),  # Con prefijo storage/
            os.path.join(backup_dir, "app", "storage", file_path),  # Con prefijo app/storage/
        ]
        
        # También buscar por nombre de archivo en caso de que la estructura sea diferente
        file_name = os.path.basename(file_path)
        
        for search_path in search_paths:
            if os.path.isfile(search_path) and os.path.getsize(search_path) > 0:
                return search_path
        
        # Búsqueda recursiva por nombre de archivo como último recurso
        for root, dirs, files in os.walk(backup_dir):
            if file_name in files:
                full_path = os.path.join(root, file_name)
                # Verificar que el archivo existe y tiene contenido
                if os.path.isfile(full_path) and os.path.getsize(full_path) > 0:
                    return full_path
        
        return None
    
    def copy_file_to_storage(self, source_path, target_relative_path):
        """Copia un archivo al volumen de storage de Docker"""
        try:
            # Crear directorio en el contenedor si no existe
            target_dir = os.path.dirname(target_relative_path)
            if target_dir:
                cmd = [
                    'docker', 'compose', 'exec', '-T', 'backend',
                    'mkdir', '-p', f'/app/storage/{target_dir}'
                ]
                subprocess.run(cmd, cwd=self.base_dir, capture_output=True)
            
            # Copiar archivo al contenedor
            cmd = [
                'docker', 'cp', source_path,
                f'mpd-concursos-backend:/app/storage/{target_relative_path}'
            ]
            
            result = subprocess.run(cmd, cwd=self.base_dir, capture_output=True, text=True)
            
            if result.returncode == 0:
                # Verificar que el archivo se copió correctamente
                verify_cmd = [
                    'docker', 'compose', 'exec', '-T', 'backend',
                    'test', '-f', f'/app/storage/{target_relative_path}'
                ]
                verify_result = subprocess.run(verify_cmd, cwd=self.base_dir, capture_output=True)
                
                return verify_result.returncode == 0
            else:
                return False
                
        except Exception as e:
            print(f"❌ Error en copia: {e}")
            return False
    
    def process_backup_source(self, backup_path, source_name):
        """Procesa una fuente de backup específica"""
        print(f"\n🔍 PROCESANDO: {source_name}")
        print(f"📄 Archivo: {os.path.basename(backup_path)}")
        print("=" * 60)
        
        if not os.path.exists(backup_path):
            print(f"⚠️ Backup no encontrado: {backup_path}")
            return 0
        
        # Crear directorio de extracción para este backup
        extract_dir = os.path.join(self.temp_dir, f"extract_{source_name}")
        
        # Extraer backup
        if not self.extract_backup(backup_path, extract_dir):
            print(f"❌ No se pudo extraer el backup")
            return 0
        
        # Buscar archivos faltantes en este backup
        recovered_count = 0
        found_files = []
        
        for i, missing_file in enumerate(self.missing_files, 1):
            file_path = missing_file.get('file_path', '')
            email = missing_file.get('email', '')
            doc_id = missing_file.get('document_id', '')
            
            if not file_path or 'recovered_from' in missing_file:
                continue
            
            # Mostrar progreso cada 25 archivos
            if i % 25 == 0:
                print(f"📊 Progreso: {i}/{len(self.missing_files)} - Recuperados: {recovered_count}")
            
            # Buscar archivo en el backup extraído
            found_file = self.find_file_in_backup(file_path, extract_dir)
            
            if found_file:
                found_files.append({
                    'missing_file': missing_file,
                    'found_path': found_file,
                    'doc_id': doc_id,
                    'email': email
                })
        
        print(f"🔍 Archivos encontrados en backup: {len(found_files)}")
        
        # Procesar archivos encontrados
        for file_info in found_files:
            missing_file = file_info['missing_file']
            found_file_path = file_info['found_path']
            file_path = missing_file.get('file_path', '')
            doc_id = file_info['doc_id']
            email = file_info['email']
            
            # Intentar copiar al storage
            if self.copy_file_to_storage(found_file_path, file_path):
                recovered_count += 1
                self.recovery_stats['successfully_restored'] += 1
                missing_file['recovered_from'] = source_name
                print(f"✅ RECUPERADO: {doc_id[:8]} - {email[:30]}")
            else:
                self.recovery_stats['failed_to_restore'] += 1
                print(f"⚠️ ENCONTRADO PERO NO COPIADO: {doc_id[:8]} - {email[:30]}")
        
        print(f"\n📊 RESULTADOS DE {source_name}:")
        print(f"✅ Archivos recuperados: {recovered_count}")
        print(f"🔍 Archivos encontrados pero no copiados: {len(found_files) - recovered_count}")
        
        # Limpiar directorio de extracción
        if os.path.exists(extract_dir):
            shutil.rmtree(extract_dir)
        
        return recovered_count
    
    def run_comprehensive_recovery(self):
        """Ejecuta la recuperación integral utilizando todos los backups"""
        print("🚀 INICIANDO RECUPERACIÓN INTEGRAL DE DOCUMENTOS V2")
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
        
        # Setup directorio temporal
        if not self.setup_temp_directory():
            return False
        
        # Definir fuentes de backup en orden de prioridad (más reciente primero)
        backup_sources = [
            ("storage_backup_pre_consolidation_20250806_115303.tar.gz", "PRE_CONSOLIDATION_06_AUG"),
            ("storage_backup_pre_migration_20250806_113406.tar.gz", "PRE_MIGRATION_06_AUG"),
            ("storage_backup_actual_20250803_111402.tar.gz", "ACTUAL_03_AUG"),
            ("storage_backup_20250731_100528.tar.gz", "BACKUP_31_JUL")
        ]
        
        total_recovered = 0
        
        try:
            # Procesar cada fuente de backup
            for backup_file, source_name in backup_sources:
                backup_path = os.path.join(self.base_dir, backup_file)
                recovered = self.process_backup_source(backup_path, source_name)
                total_recovered += recovered
                
                # Verificar cuántos quedan por recuperar
                remaining = len([f for f in self.missing_files if 'recovered_from' not in f])
                print(f"📊 Archivos restantes por recuperar: {remaining}")
                
                if remaining == 0:
                    print("\n🎉 ¡TODOS LOS ARCHIVOS HAN SIDO RECUPERADOS!")
                    break
            
            # Procesar backup dentro del contenedor si quedan archivos
            remaining = len([f for f in self.missing_files if 'recovered_from' not in f])
            if remaining > 0:
                print(f"\n🔍 PROCESANDO BACKUP INTERNO DEL CONTENEDOR")
                print(f"📊 Archivos aún por recuperar: {remaining}")
                
                # Copiar backup del contenedor al host temporal
                container_backup = "/app/storage/backup_before_recovery_20250806_183729.tar.gz"
                temp_backup_path = os.path.join(self.temp_dir, "container_backup.tar.gz")
                
                copy_cmd = [
                    'docker', 'cp', f'mpd-concursos-backend:{container_backup}', temp_backup_path
                ]
                
                result = subprocess.run(copy_cmd, cwd=self.base_dir, capture_output=True)
                if result.returncode == 0:
                    recovered = self.process_backup_source(temp_backup_path, "CONTAINER_BACKUP_06_AUG")
                    total_recovered += recovered
                else:
                    print("⚠️ No se pudo acceder al backup del contenedor")
            
        finally:
            # Cleanup
            self.cleanup_temp_directory()
        
        # Estadísticas finales
        still_missing = len([f for f in self.missing_files if 'recovered_from' not in f])
        
        print("\n" + "=" * 60)
        print("📊 RESUMEN FINAL DE RECUPERACIÓN")
        print("=" * 60)
        print(f"✅ Total de archivos recuperados: {total_recovered}")
        print(f"❌ Archivos aún faltantes: {still_missing}")
        
        if total_recovered + still_missing > 0:
            recovery_percentage = (total_recovered/(total_recovered + still_missing))*100
            print(f"📈 Porcentaje de recuperación: {recovery_percentage:.2f}%")
        else:
            print(f"📈 Porcentaje de recuperación: 0.00%")
        
        # Guardar reporte de recuperación
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        recovery_report = {
            'timestamp': timestamp,
            'total_recovered': total_recovered,
            'still_missing': still_missing,
            'missing_files_remaining': [f for f in self.missing_files if 'recovered_from' not in f],
            'recovered_files': [f for f in self.missing_files if 'recovered_from' in f],
            'recovery_sources_used': [source[1] for source in backup_sources]
        }
        
        report_file = f"recovery_report_{timestamp}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(recovery_report, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"💾 Reporte de recuperación guardado: {report_file}")
        
        return total_recovered > 0

def main():
    recovery = DocumentRecovery()
    
    try:
        success = recovery.run_comprehensive_recovery()
        if success:
            print("\n🎉 RECUPERACIÓN COMPLETADA CON ARCHIVOS RECUPERADOS")
            sys.exit(0)
        else:
            print("\n⚠️ RECUPERACIÓN COMPLETADA SIN ARCHIVOS RECUPERADOS")
            sys.exit(0)
            
    except KeyboardInterrupt:
        print("\n⚠️ Recuperación interrumpida por usuario")
        recovery.cleanup_temp_directory()
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error durante recuperación: {e}")
        recovery.cleanup_temp_directory()
        sys.exit(1)

if __name__ == "__main__":
    main()
