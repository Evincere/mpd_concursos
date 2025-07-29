/**
 * Tests de integración para capturar el estado baseline del sistema de inscripciones
 * Estos tests validan el comportamiento actual end-to-end antes de las mejoras
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { InscriptionStateService } from '@core/services/inscripcion/inscription-state.service';
import { InscriptionRecoveryService } from '@core/services/inscripcion/inscription-recovery.service';

// Componente mock para testing de navegación
@Component({
  template: '<div>Mock Component</div>'
})
class MockComponent { }

describe('Inscription System Integration - Baseline Tests', () => {
  let inscriptionService: InscriptionService;
  let inscriptionStateService: InscriptionStateService;
  let inscriptionRecoveryService: InscriptionRecoveryService;
  let httpMock: HttpTestingController;
  let router: Router;
  let location: Location;

  // Métricas de integración baseline
  const integrationMetrics = {
    duplicateInscriptionsCreated: 0,
    stateSyncFailures: 0,
    recoveryAttempts: 0,
    networkErrorsHandled: 0
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([
          { path: 'dashboard', component: MockComponent },
          { path: 'dashboard/concursos', component: MockComponent },
          { path: 'dashboard/inscripcion', component: MockComponent }
        ])
      ],
      declarations: [MockComponent],
      providers: [
        InscriptionService,
        InscriptionStateService,
        InscriptionRecoveryService
      ]
    }).compileComponents();

    inscriptionService = TestBed.inject(InscriptionService);
    inscriptionStateService = TestBed.inject(InscriptionStateService);
    inscriptionRecoveryService = TestBed.inject(InscriptionRecoveryService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('PROBLEMA 1: Condiciones de Carrera - Baseline', () => {
    it('should allow multiple simultaneous inscription creation attempts (PROBLEMATIC)', async () => {
      const contestId = 'test-contest-id';
      const mockInscription = {
        id: 'inscription-1',
        contestId,
        state: 'ACTIVE',
        currentStep: 1
      };

      // Act: Simular múltiples llamadas simultáneas (comportamiento actual problemático)
      const promise1 = inscriptionService.createInscription({ contestId }).toPromise();
      const promise2 = inscriptionService.createInscription({ contestId }).toPromise();

      // Simular respuestas del backend
      const req1 = httpMock.expectOne(req => req.url.includes('/inscriptions'));
      const req2 = httpMock.expectOne(req => req.url.includes('/inscriptions'));
      
      req1.flush(mockInscription);
      req2.flush({ ...mockInscription, id: 'inscription-2' }); // Duplicado

      const results = await Promise.all([promise1, promise2]);

      // Assert: Sistema actual permite duplicados (PROBLEMÁTICO)
      expect(results).toHaveLength(2);
      expect(results[0].id).not.toBe(results[1].id);
      integrationMetrics.duplicateInscriptionsCreated++;
      
      console.log('🚨 BASELINE: Inscripciones duplicadas creadas por condición de carrera');
    });
  });

  describe('PROBLEMA 7: Múltiples Fuentes de Verdad - Baseline', () => {
    it('should maintain separate state in different localStorage keys (PROBLEMATIC)', () => {
      const inscriptionId = 'test-inscription-id';
      const contestId = 'test-contest-id';

      // Act: Guardar estado en múltiples lugares (comportamiento actual)
      inscriptionStateService.saveInProgressInscription({
        id: inscriptionId,
        contestId,
        state: 'ACTIVE',
        currentStep: 2
      });

      inscriptionStateService.saveInscriptionState(inscriptionId, {
        currentStep: 3, // Diferente del anterior
        formData: { test: 'data' }
      });

      // Assert: Verificar que hay múltiples fuentes de verdad
      const progressData = localStorage.getItem('inscription_in_progress');
      const stateData = localStorage.getItem(`inscription_state_${inscriptionId}`);

      expect(progressData).toBeTruthy();
      expect(stateData).toBeTruthy();

      const progressObj = JSON.parse(progressData!);
      const stateObj = JSON.parse(stateData!);

      // Estados inconsistentes (PROBLEMÁTICO)
      expect(progressObj.currentStep).not.toBe(stateObj.currentStep);
      integrationMetrics.stateSyncFailures++;

      console.log('🚨 BASELINE: Múltiples fuentes de verdad con estados inconsistentes');
    });
  });

  describe('PROBLEMA 28: Pérdida de Sincronización por Errores de Red - Baseline', () => {
    it('should update local state even when backend call fails (PROBLEMATIC)', async () => {
      const inscriptionId = 'test-inscription-id';

      // Arrange: Simular inscripción en localStorage
      inscriptionStateService.saveInProgressInscription({
        id: inscriptionId,
        contestId: 'test-contest',
        state: 'ACTIVE',
        currentStep: 2
      });

      // Act: Intentar cancelar con error de red
      const cancelPromise = inscriptionService.cancelInscription(inscriptionId, true).toPromise();

      // Simular error de red
      const req = httpMock.expectOne(req => req.url.includes(`/inscriptions/${inscriptionId}/cancel`));
      req.error(new ErrorEvent('Network error'));

      try {
        await cancelPromise;
      } catch (error) {
        // Error esperado
      }

      // Assert: Verificar que estado local se actualizó a pesar del error (PROBLEMÁTICO)
      const incompleteInscriptions = inscriptionStateService.getAllIncompleteInscriptions();
      const targetInscription = incompleteInscriptions.find(i => i.id === inscriptionId);

      // Estado local dice "cancelado" pero backend no se actualizó
      expect(targetInscription).toBeFalsy(); // Removido de lista local
      integrationMetrics.networkErrorsHandled++;

      console.log('🚨 BASELINE: Estado local actualizado a pesar de error de red');
    });
  });

  describe('PROBLEMA 32: Validación de Reinscripción Inconsistente - Baseline', () => {
    it('should show different inscription status from different sources (PROBLEMATIC)', async () => {
      const contestId = 'test-contest-id';
      const inscriptionId = 'test-inscription-id';

      // Arrange: Estado local dice ACTIVE
      inscriptionStateService.saveInProgressInscription({
        id: inscriptionId,
        contestId,
        state: 'ACTIVE',
        currentStep: 2
      });

      // Act: Verificar estado desde servicio (usa caché local)
      const localStatus = await inscriptionService.getInscriptionStatus(contestId).toPromise();

      // Simular respuesta del backend diferente
      const backendPromise = inscriptionService.refreshInscriptions().toPromise();
      const req = httpMock.expectOne(req => req.url.includes('/inscriptions'));
      req.flush([{
        id: inscriptionId,
        contestId,
        state: 'CANCELLED', // Backend dice CANCELLED
        currentStep: 2
      }]);

      await backendPromise;
      const backendStatus = await inscriptionService.getInscriptionStatus(contestId).toPromise();

      // Assert: Estados diferentes según la fuente (PROBLEMÁTICO)
      expect(localStatus).toBe('ACTIVE');
      expect(backendStatus).toBe('CANCELLED');
      integrationMetrics.stateSyncFailures++;

      console.log('🚨 BASELINE: Estados inconsistentes entre local y backend');
    });
  });

  describe('PROBLEMA 15: Estados Resumibles Hardcodeados - Baseline', () => {
    it('should use hardcoded resumable states that may not match backend (PROBLEMATIC)', () => {
      // Act: Verificar estados hardcodeados en recovery service
      const testInscription = {
        id: 'test-id',
        state: 'IN_PROCESS', // Estado que no existe en backend
        contestId: 'test-contest'
      };

      const canResume = inscriptionRecoveryService.canResumeInscription(testInscription);

      // Assert: Puede intentar resumir estado inexistente (PROBLEMÁTICO)
      expect(canResume).toBe(true); // Basado en lista hardcodeada
      integrationMetrics.recoveryAttempts++;

      console.log('🚨 BASELINE: Estados resumibles hardcodeados inconsistentes con backend');
    });
  });

  describe('Navegación y Estado - Integration Baseline', () => {
    it('should lose inscription state on navigation without proper cleanup', async () => {
      const inscriptionId = 'test-inscription-id';

      // Arrange: Inscripción en progreso
      inscriptionStateService.saveInProgressInscription({
        id: inscriptionId,
        contestId: 'test-contest',
        state: 'ACTIVE',
        currentStep: 2
      });

      // Act: Simular navegación (sin guards de protección)
      await router.navigate(['/dashboard']);

      // Assert: Estado puede perderse sin confirmación (PROBLEMÁTICO)
      expect(location.path()).toBe('/dashboard');
      console.log('🚨 BASELINE: Navegación sin protección permite pérdida de estado');
    });
  });

  describe('Métricas de Integración Baseline', () => {
    afterAll(() => {
      console.log('📊 MÉTRICAS DE INTEGRACIÓN BASELINE:');
      console.log(`- Inscripciones duplicadas: ${integrationMetrics.duplicateInscriptionsCreated}`);
      console.log(`- Fallos de sincronización: ${integrationMetrics.stateSyncFailures}`);
      console.log(`- Intentos de recuperación: ${integrationMetrics.recoveryAttempts}`);
      console.log(`- Errores de red manejados: ${integrationMetrics.networkErrorsHandled}`);

      // Guardar métricas para comparación posterior
      const allMetrics = {
        integration: integrationMetrics,
        timestamp: new Date().toISOString(),
        phase: 'baseline'
      };
      
      localStorage.setItem('inscription-integration-baseline', JSON.stringify(allMetrics));
    });
  });
});
