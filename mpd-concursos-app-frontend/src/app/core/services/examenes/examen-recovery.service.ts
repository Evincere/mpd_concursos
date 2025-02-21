import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, fromEvent, merge } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, retry, catchError } from 'rxjs/operators';
import { ExamenEnCurso, RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class ExamenRecoveryService {
  private readonly AUTOSAVE_INTERVAL = 30000; // 30 segundos
  private readonly BACKUP_KEY_PREFIX = 'examen_backup_';
  private readonly MAX_RETRIES = 3;
  private isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);
  private pendingChanges$ = new BehaviorSubject<boolean>(false);
  private lastSyncTimestamp: number = 0;

  constructor(private http: HttpClient) {
    this.setupConnectivityMonitoring();
  }

  private setupConnectivityMonitoring(): void {
    merge(
      fromEvent(window, 'online'),
      fromEvent(window, 'offline')
    ).subscribe(() => {
      this.isOnline$.next(navigator.onLine);
      if (navigator.onLine) {
        this.syncPendingChanges();
      }
    });
  }

  initializeAutoSave(examenId: string): void {
    // Configurar autoguardado periódico
    interval(this.AUTOSAVE_INTERVAL)
      .pipe(
        debounceTime(1000),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.saveToLocalBackup(examenId);
      });
  }

  saveToLocalBackup(examenId: string, examen?: ExamenEnCurso): void {
    if (examen) {
      const backup = {
        examen,
        timestamp: Date.now(),
        version: 1
      };
      localStorage.setItem(this.BACKUP_KEY_PREFIX + examenId, JSON.stringify(backup));
      this.pendingChanges$.next(true);
      this.syncWithServer(examenId, backup);
    }
  }

  private syncWithServer(examenId: string, backup: any): void {
    if (!this.isOnline$.value) {
      console.log('Offline: cambios guardados localmente');
      return;
    }

    this.http.post(`${environment.apiUrl}/examenes/${examenId}/backup`, backup)
      .pipe(
        retry(this.MAX_RETRIES),
        catchError(error => {
          console.error('Error al sincronizar con el servidor:', error);
          return [];
        })
      )
      .subscribe(() => {
        this.lastSyncTimestamp = Date.now();
        this.pendingChanges$.next(false);
      });
  }

  private syncPendingChanges(): void {
    const pendingBackups = this.getPendingBackups();
    pendingBackups.forEach(backup => {
      this.syncWithServer(backup.examenId, backup.data);
    });
  }

  private getPendingBackups(): Array<{examenId: string, data: any}> {
    const backups: Array<{examenId: string, data: any}> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.BACKUP_KEY_PREFIX)) {
        const examenId = key.replace(this.BACKUP_KEY_PREFIX, '');
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        backups.push({ examenId, data });
      }
    }
    return backups;
  }

  async recoverExamen(examenId: string): Promise<ExamenEnCurso | null> {
    try {
      // Intentar recuperar del servidor primero
      const serverBackup = await this.getServerBackup(examenId).toPromise();
      if (serverBackup) {
        return this.validateAndRecoverBackup(serverBackup);
      }

      // Si no hay backup en el servidor, intentar recuperar local
      const localBackup = localStorage.getItem(this.BACKUP_KEY_PREFIX + examenId);
      if (localBackup) {
        return this.validateAndRecoverBackup(JSON.parse(localBackup));
      }

      return null;
    } catch (error) {
      console.error('Error al recuperar el examen:', error);
      return null;
    }
  }

  private getServerBackup(examenId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/examenes/${examenId}/backup`);
  }

  private validateAndRecoverBackup(backup: any): ExamenEnCurso | null {
    if (!this.isValidBackup(backup)) {
      console.error('Backup inválido o corrupto');
      return null;
    }

    return backup.examen;
  }

  private isValidBackup(backup: any): boolean {
    return (
      backup &&
      backup.examen &&
      backup.timestamp &&
      backup.version &&
      backup.examen.examenId &&
      backup.examen.respuestas &&
      Array.isArray(backup.examen.respuestas)
    );
  }

  validatePostIncident(examenId: string, respuestas: RespuestaUsuario[]): boolean {
    const backup = this.getLatestBackup(examenId);
    if (!backup) return false;

    // Validar integridad de las respuestas
    const backupRespuestas = backup.examen.respuestas;
    return this.compareRespuestas(respuestas, backupRespuestas);
  }

  private getLatestBackup(examenId: string): any {
    const localBackup = localStorage.getItem(this.BACKUP_KEY_PREFIX + examenId);
    return localBackup ? JSON.parse(localBackup) : null;
  }

  private compareRespuestas(respuestas1: RespuestaUsuario[], respuestas2: RespuestaUsuario[]): boolean {
    if (respuestas1.length !== respuestas2.length) return false;

    return respuestas1.every((resp1, index) => {
      const resp2 = respuestas2[index];
      return (
        resp1.preguntaId === resp2.preguntaId &&
        JSON.stringify(resp1.respuesta) === JSON.stringify(resp2.respuesta)
      );
    });
  }

  cleanupBackups(examenId: string): void {
    localStorage.removeItem(this.BACKUP_KEY_PREFIX + examenId);
    // También limpiar en el servidor
    this.http.delete(`${environment.apiUrl}/examenes/${examenId}/backup`).subscribe();
  }

  saveExamenState(examen: ExamenEnCurso): void {
    // Implementar lógica de guardado
  }

  recoverExamenState(): ExamenEnCurso | null {
    // Implementar lógica de recuperación
    return null;
  }
}
