import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, fromEvent, merge } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, retry, catchError } from 'rxjs/operators';
import { ExamenEnCurso, RespuestaUsuario } from '@shared/interfaces/examen/pregunta.interface';
import { environment } from '@env/environment';
import { ExamenNotificationService } from './examen-notification.service';
import { ExamenStateService } from './state/examen-state.service';

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

  constructor(
    private http: HttpClient,
    private notificationService: ExamenNotificationService,
    private stateService: ExamenStateService
  ) {
    this.setupConnectivityMonitoring();
  }

  private setupConnectivityMonitoring(): void {
    merge(
      fromEvent(window, 'online'),
      fromEvent(window, 'offline')
    ).subscribe(() => {
      this.isOnline$.next(navigator.onLine);
      this.notificationService.showConnectionWarning(navigator.onLine);
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
        // Obtener el estado actual del examen y guardarlo
        this.stateService.getExamenEnCurso().subscribe(examen => {
          if (examen) {
            this.saveToLocalBackup(examenId, examen);
          }
        });
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
          if (error.status === 500) {
            // Asegurarnos de que el backup local existe
            const backupKey = this.BACKUP_KEY_PREFIX + examenId;
            if (!localStorage.getItem(backupKey)) {
              localStorage.setItem(backupKey, JSON.stringify(backup));
            }

            console.warn('Error del servidor al sincronizar, guardando localmente');
            this.notificationService.showConnectionWarning(false);
            this.pendingChanges$.next(true);
            return [];
          }
          throw error;
        })
      )
      .subscribe({
        next: () => {
          this.lastSyncTimestamp = Date.now();
          this.pendingChanges$.next(false);
          this.notificationService.showConnectionWarning(true);
        },
        error: () => {
          this.pendingChanges$.next(true);
        }
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
        const examenRecuperado = this.validateAndRecoverBackup(serverBackup);
        if (examenRecuperado) {
          return examenRecuperado;
        }
      }

      // Si no hay backup en el servidor, intentar recuperar local
      const localBackup = localStorage.getItem(this.BACKUP_KEY_PREFIX + examenId);
      if (localBackup) {
        const examenRecuperado = this.validateAndRecoverBackup(JSON.parse(localBackup));
        if (examenRecuperado) {
          return examenRecuperado;
        }
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

  getLatestBackup(examenId: string): { examen: ExamenEnCurso; timestamp: number; version: number; } | null {
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

  // Métodos obsoletos que ahora se manejan a través del ExamenStateService
  saveExamenState(examen: ExamenEnCurso): void {
    this.stateService.initializeState(examen);
  }

  recoverExamenState(): ExamenEnCurso | null {
    let examenRecuperado: ExamenEnCurso | null = null;
    this.stateService.getExamenEnCurso().subscribe(examen => {
      examenRecuperado = examen;
    });
    return examenRecuperado;
  }

  guardarRespuestas(examenId: string, respuestas: { [key: string]: string | string[] }): void {
    this.stateService.getExamenEnCurso().subscribe(examen => {
      if (!examen) return;

      // Convertir el formato de respuestas al formato esperado por el estado
      const respuestasUsuario: RespuestaUsuario[] = Object.entries(respuestas).map(([preguntaId, respuesta]) => ({
        preguntaId,
        respuesta,
        timestamp: new Date().toISOString(),
        intentos: 1
      }));

      // Guardar cada respuesta en el estado
      respuestasUsuario.forEach(respuesta => {
        this.stateService.guardarRespuesta(respuesta);
      });

      // Guardar backup local y sincronizar con el servidor
      this.saveToLocalBackup(examenId, examen);
    });
  }

  recuperarRespuestas(examenId: string): { [key: string]: string | string[] } | null {
    const backup = this.getLatestBackup(examenId);
    if (!backup || !backup.examen || !backup.examen.respuestas) return null;

    // Convertir el formato de respuestas al formato esperado por el componente
    return backup.examen.respuestas.reduce((acc: { [key: string]: string | string[] }, respuesta: RespuestaUsuario) => {
      acc[respuesta.preguntaId] = respuesta.respuesta;
      return acc;
    }, {});
  }
}
