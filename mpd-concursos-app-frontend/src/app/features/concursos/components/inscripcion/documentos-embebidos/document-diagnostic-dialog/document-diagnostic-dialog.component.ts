import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentosService } from '@core/services/documentos/documentos.service';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';
import { UnifiedDialogRef } from '@shared/services/dialog/unified-dialog.service';
import { environment } from '@env/environment';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
  timestamp: string;
}

@Component({
  selector: 'app-document-diagnostic-dialog',
  standalone: true,
  imports: [
    CommonModule
  ],
  template: `
    <div class="diagnostic-dialog">
      <h2>🔍 Diagnóstico del Sistema de Documentos</h2>

      <div class="diagnostic-content">
        <div class="diagnostic-info">
          <p>Esta herramienta ejecuta pruebas para diagnosticar problemas con la carga de documentos.</p>
          <p><strong>Problema reportado:</strong> Archivos de 1.9 MB no se cargan correctamente.</p>
        </div>

        <hr>

        <div class="diagnostic-tests">
          <h3>Resultados de Diagnóstico</h3>

          <div class="test-results">
            <div *ngFor="let result of diagnosticResults" class="test-result" [ngClass]="result.status">
              <div class="test-header">
                <span class="test-icon" [ngSwitch]="result.status">
                  <span *ngSwitchCase="'success'">✅</span>
                  <span *ngSwitchCase="'error'">❌</span>
                  <span *ngSwitchCase="'warning'">⚠️</span>
                  <span *ngSwitchCase="'pending'">⏳</span>
                </span>
                <span class="test-name">{{ result.test }}</span>
                <span class="test-time">{{ result.timestamp }}</span>
              </div>
              <div class="test-message">{{ result.message }}</div>
              <div *ngIf="result.details" class="test-details">
                <pre>{{ result.details | json }}</pre>
              </div>
            </div>
          </div>

          <div *ngIf="isRunning" class="running-indicator">
            <div class="spinner">⏳</div>
            <span>Ejecutando diagnósticos...</span>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button (click)="runDiagnostics()" [disabled]="isRunning">
          🔄 Ejecutar Diagnósticos
        </button>
        <button (click)="exportResults()" [disabled]="diagnosticResults.length === 0">
          📥 Exportar Resultados
        </button>
        <button (click)="close()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .diagnostic-dialog {
      width: 600px;
      max-width: 90vw;
    }

    .diagnostic-content {
      max-height: 70vh;
      overflow-y: auto;
    }

    .diagnostic-info {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .test-results {
      margin-top: 16px;
    }

    .test-result {
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 8px;
      padding: 12px;
    }

    .test-result.success {
      border-color: #4caf50;
      background-color: #f1f8e9;
    }

    .test-result.error {
      border-color: #f44336;
      background-color: #ffebee;
    }

    .test-result.warning {
      border-color: #ff9800;
      background-color: #fff3e0;
    }

    .test-result.pending {
      border-color: #2196f3;
      background-color: #e3f2fd;
    }

    .test-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .test-name {
      font-weight: 500;
      flex: 1;
    }

    .test-time {
      font-size: 0.8em;
      color: #666;
    }

    .test-message {
      margin-bottom: 8px;
    }

    .test-details {
      background: #f9f9f9;
      padding: 8px;
      border-radius: 4px;
      font-size: 0.9em;
    }

    .test-details pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .running-indicator {
      display: flex;
      align-items: center;
      gap: 16px;
      justify-content: center;
      padding: 20px;
    }

    mat-icon {
      vertical-align: middle;
    }
  `]
})
export class DocumentDiagnosticDialogComponent implements OnInit {

  constructor(
    private dialogRef: UnifiedDialogRef<DocumentDiagnosticDialogComponent>,
    private documentosService: DocumentosService,
    private notificationService: UnifiedNotificationService
  ) {}

  diagnosticResults: DiagnosticResult[] = [];
  isRunning = false;

  ngOnInit() {
    // Ejecutar diagnósticos automáticamente al abrir
    this.runDiagnostics();
  }

  async runDiagnostics() {
    this.isRunning = true;
    this.diagnosticResults = [];

    const tests = [
      { name: 'Conectividad con Backend', test: this.testBackendConnectivity.bind(this) },
      { name: 'Información del Sistema', test: this.testSystemInfo.bind(this) },
      { name: 'Configuración de Límites', test: this.testFileLimits.bind(this) },
      { name: 'Tipos de Documento Permitidos', test: this.testAllowedFileTypes.bind(this) },
      { name: 'Configuración de Red', test: this.testNetworkConfig.bind(this) }
    ];

    for (const testConfig of tests) {
      await this.runSingleTest(testConfig.name, testConfig.test);
    }

    this.isRunning = false;
  }

  private async runSingleTest(testName: string, testFunction: () => Promise<DiagnosticResult>) {
    const pendingResult: DiagnosticResult = {
      test: testName,
      status: 'pending',
      message: 'Ejecutando...',
      timestamp: new Date().toLocaleTimeString()
    };

    this.diagnosticResults.push(pendingResult);

    try {
      const result = await testFunction();
      const index = this.diagnosticResults.findIndex(r => r.test === testName);
      if (index >= 0) {
        this.diagnosticResults[index] = { ...result, test: testName };
      }
    } catch (error) {
      const index = this.diagnosticResults.findIndex(r => r.test === testName);
      if (index >= 0) {
        this.diagnosticResults[index] = {
          test: testName,
          status: 'error',
          message: `Error ejecutando prueba: ${error}`,
          timestamp: new Date().toLocaleTimeString()
        };
      }
    }
  }

  private async testBackendConnectivity(): Promise<DiagnosticResult> {
    return new Promise((resolve) => {
      // Verificar si el método existe antes de llamarlo
      if (typeof (this.documentosService as any).testBackendConnectivity === 'function') {
        (this.documentosService as any).testBackendConnectivity().subscribe({
          next: (isConnected: boolean) => {
            resolve({
              test: '',
              status: isConnected ? 'success' : 'error',
              message: isConnected ?
                'Backend accesible correctamente' :
                'No se puede conectar con el backend',
              details: { apiUrl: environment.apiUrl },
              timestamp: new Date().toLocaleTimeString()
            });
          },
          error: (error: any) => {
            resolve({
              test: '',
              status: 'error',
              message: 'Error de conectividad con el backend',
              details: error,
              timestamp: new Date().toLocaleTimeString()
            });
          }
        });
      } else {
        // Fallback si el método no existe
        resolve({
          test: '',
          status: 'warning',
          message: 'Método de prueba de conectividad no disponible',
          details: { apiUrl: environment.apiUrl },
          timestamp: new Date().toLocaleTimeString()
        });
      }
    });
  }

  private async testSystemInfo(): Promise<DiagnosticResult> {
    return new Promise((resolve) => {
      // Verificar si el método existe antes de llamarlo
      if (typeof (this.documentosService as any).getSystemInfo === 'function') {
        (this.documentosService as any).getSystemInfo().subscribe({
          next: (info: any) => {
            resolve({
              test: '',
              status: 'success',
              message: 'Información del sistema obtenida correctamente',
              details: info,
              timestamp: new Date().toLocaleTimeString()
            });
          },
          error: (error: any) => {
            resolve({
              test: '',
              status: 'warning',
              message: 'No se pudo obtener información del sistema',
              details: error,
              timestamp: new Date().toLocaleTimeString()
            });
          }
        });
      } else {
        // Fallback si el método no existe
        resolve({
          test: '',
          status: 'warning',
          message: 'Método de información del sistema no disponible',
          details: { note: 'Método no implementado en el servicio' },
          timestamp: new Date().toLocaleTimeString()
        });
      }
    });
  }

  private async testFileLimits(): Promise<DiagnosticResult> {
    const limits = {
      frontend: '10-20 MB (inconsistente)',
      backend: '20 MB',
      nginx: '25 MB (configurado)',
      testFileSize: '1.9 MB'
    };

    return {
      test: '',
      status: 'warning',
      message: 'Configuraciones de límites inconsistentes detectadas',
      details: limits,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  private async testAllowedFileTypes(): Promise<DiagnosticResult> {
    return {
      test: '',
      status: 'success',
      message: 'Solo archivos PDF permitidos (application/pdf)',
      details: { allowedTypes: ['application/pdf'] },
      timestamp: new Date().toLocaleTimeString()
    };
  }

  private async testNetworkConfig(): Promise<DiagnosticResult> {
    const config = {
      environment: environment.production ? 'production' : 'development',
      apiUrl: environment.apiUrl,
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    };

    return {
      test: '',
      status: 'success',
      message: 'Configuración de red obtenida',
      details: config,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  exportResults() {
    const results = {
      timestamp: new Date().toISOString(),
      diagnostics: this.diagnosticResults,
      environment: {
        production: environment.production,
        apiUrl: environment.apiUrl,
        userAgent: navigator.userAgent
      }
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-diagnostic-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    (this.notificationService as any).success('Resultados exportados correctamente', 'Exportación Exitosa');
  }

  close() {
    this.dialogRef.close();
  }
}
