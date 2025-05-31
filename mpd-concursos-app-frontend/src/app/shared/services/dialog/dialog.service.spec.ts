import { TestBed } from '@angular/core/testing';
import { Component, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService } from './dialog.service';
import { UnifiedDialogService } from './unified-dialog.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Componente de prueba
@Component({
  template: '<div>Test Dialog Content</div>'
})
class TestDialogComponent {}

// Módulo de prueba
@NgModule({
  declarations: [TestDialogComponent],
  imports: [CommonModule],
  exports: [TestDialogComponent]
})
class TestModule {}

describe('DialogService', () => {
  let service: DialogService;
  let unifiedDialogService: jasmine.SpyObj<UnifiedDialogService>;

  beforeEach(() => {
    const unifiedDialogSpy = jasmine.createSpyObj('UnifiedDialogService', ['open', 'openConfirm']);
    
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        TestModule
      ],
      providers: [
        DialogService,
        { provide: UnifiedDialogService, useValue: unifiedDialogSpy }
      ]
    });
    
    service = TestBed.inject(DialogService);
    unifiedDialogService = TestBed.inject(UnifiedDialogService) as jasmine.SpyObj<UnifiedDialogService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('open', () => {
    it('should call unifiedDialogService.open with correct parameters', () => {
      // Configurar el mock para devolver un objeto con afterClosed
      const mockDialogRef = {
        afterClosed: () => ({ subscribe: () => {} })
      };
      unifiedDialogService.open.and.returnValue(mockDialogRef as any);
      
      // Opciones de prueba
      const options = {
        title: 'Test Dialog',
        size: 'medium' as const,
        data: { test: 'data' },
        showCloseButton: true
      };
      
      // Llamar al método
      const result = service.open(TestDialogComponent, options);
      
      // Verificar que se llamó al método correcto con los parámetros correctos
      expect(unifiedDialogService.open).toHaveBeenCalledWith(TestDialogComponent, options);
      
      // Verificar que se devolvió un DialogRef
      expect(result).toBeTruthy();
      expect(result.afterClosed).toBeDefined();
      expect(typeof result.close).toBe('function');
    });
  });

  describe('confirm', () => {
    it('should call unifiedDialogService.openConfirm with correct parameters', () => {
      // Configurar el mock para devolver un objeto con afterClosed
      const mockDialogRef = {
        afterClosed: () => ({ subscribe: () => {} })
      };
      unifiedDialogService.openConfirm.and.returnValue(mockDialogRef as any);
      
      // Opciones de prueba
      const options = {
        title: 'Confirm Dialog',
        message: 'Are you sure?',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        confirmButtonColor: 'primary' as const,
        icon: 'question',
        size: 'small' as const
      };
      
      // Llamar al método
      const result = service.confirm(options);
      
      // Verificar que se llamó al método correcto con los parámetros correctos
      expect(unifiedDialogService.openConfirm).toHaveBeenCalledWith(options);
      
      // Verificar que se devolvió un DialogRef
      expect(result).toBeTruthy();
      expect(result.afterClosed).toBeDefined();
      expect(typeof result.close).toBe('function');
    });
  });

  describe('DialogRef', () => {
    it('should call close on the underlying dialogRef', () => {
      // Crear un mock para el dialogRef
      const mockDialogRef = {
        close: jasmine.createSpy('close'),
        afterClosed: () => ({ subscribe: (fn: any) => fn('result') })
      };
      
      // Configurar el mock para devolver el dialogRef
      unifiedDialogService.open.and.returnValue(mockDialogRef as any);
      
      // Llamar al método
      const dialogRef = service.open(TestDialogComponent);
      
      // Llamar a close en el DialogRef
      dialogRef.close('test result');
      
      // Verificar que se llamó a close en el dialogRef subyacente
      expect(mockDialogRef.close).toHaveBeenCalledWith('test result');
    });

    it('should emit the result when afterClosed is called', (done) => {
      // Crear un mock para el dialogRef
      const mockDialogRef = {
        close: () => {},
        afterClosed: () => ({ subscribe: (fn: any) => { setTimeout(() => fn('result'), 0); } })
      };
      
      // Configurar el mock para devolver el dialogRef
      unifiedDialogService.open.and.returnValue(mockDialogRef as any);
      
      // Llamar al método
      const dialogRef = service.open(TestDialogComponent);
      
      // Suscribirse a afterClosed
      dialogRef.afterClosed().subscribe(result => {
        expect(result).toBe('result');
        done();
      });
    });
  });
});
