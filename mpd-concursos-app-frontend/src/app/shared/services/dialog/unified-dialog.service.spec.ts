import { TestBed } from '@angular/core/testing';
import { ApplicationRef, Component, EnvironmentInjector, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Servicio a probar
import { UnifiedDialogService, UnifiedDialogRef, DIALOG_DATA } from './unified-dialog.service';

// Componente de prueba
@Component({
  selector: 'app-test-dialog-content',
  template: `<div class="test-dialog-content">Test Dialog Content</div>`,
  standalone: true,
  imports: [CommonModule]
})
class TestDialogContentComponent {
  constructor(public dialogRef: UnifiedDialogRef) {}

  close(result?: any): void {
    this.dialogRef.close(result);
  }
}

describe('UnifiedDialogService', () => {
  let service: UnifiedDialogService;
  let appRef: ApplicationRef;
  let environmentInjector: EnvironmentInjector;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      providers: [UnifiedDialogService]
    });
    service = TestBed.inject(UnifiedDialogService);
    appRef = TestBed.inject(ApplicationRef);
    environmentInjector = TestBed.inject(EnvironmentInjector);

    // Espiar los métodos del DOM
    spyOn(document.body, 'appendChild').and.callFake((element: Node) => {
      return element;
    });
    spyOn(document, 'createElement').and.callThrough();
    spyOn(document, 'querySelectorAll').and.returnValue([] as any);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('open', () => {
    it('should return a DialogRef', () => {
      // Espiar el método import
      spyOn(Promise, 'resolve').and.returnValue(Promise.resolve({
        CustomDialogComponent: class {
          dialogClose = { subscribe: jasmine.createSpy('subscribe') };
          dialogCancel = { subscribe: jasmine.createSpy('subscribe') };
          dialogConfirm = { subscribe: jasmine.createSpy('subscribe') };
          dialogDismiss = { subscribe: jasmine.createSpy('subscribe') };
        }
      }));

      const dialogRef = service.open(TestDialogContentComponent);
      expect(dialogRef).toBeTruthy();
      expect(dialogRef instanceof UnifiedDialogRef).toBe(true);
    });

    it('should call closeAll before opening a new dialog', () => {
      spyOn(service, 'closeAll');
      service.open(TestDialogContentComponent);
      expect(service.closeAll).toHaveBeenCalled();
    });
  });

  describe('closeAll', () => {
    it('should clean up all active dialogs', () => {
      // Configurar un diálogo activo simulado
      const mockComponentRef = {
        location: {
          nativeElement: document.createElement('div')
        },
        hostView: {
          detach: jasmine.createSpy('detach')
        },
        destroy: jasmine.createSpy('destroy')
      };

      // Acceder a la propiedad privada activeDialogs
      (service as any).activeDialogs = [mockComponentRef];

      // Espiar el método cleanupDialogElements
      spyOn<any>(service, 'cleanupDialogElements');

      // Llamar a closeAll
      service.closeAll();

      // Verificar que se limpiaron los diálogos activos
      expect(mockComponentRef.hostView.detach).toHaveBeenCalled();
      expect(mockComponentRef.destroy).toHaveBeenCalled();
      expect((service as any).activeDialogs.length).toBe(0);
      expect((service as any).cleanupDialogElements).toHaveBeenCalled();
    });

    it('should handle errors when cleaning up dialogs', () => {
      // Configurar un diálogo activo simulado que lanzará un error
      const mockComponentRef = {
        location: {
          nativeElement: document.createElement('div')
        },
        hostView: {
          detach: jasmine.createSpy('detach').and.throwError('Test error')
        },
        destroy: jasmine.createSpy('destroy')
      };

      // Acceder a la propiedad privada activeDialogs
      (service as any).activeDialogs = [mockComponentRef];

      // Espiar console.error
      spyOn(console, 'error');

      // Llamar a closeAll
      service.closeAll();

      // Verificar que se manejó el error
      expect(console.error).toHaveBeenCalled();
      expect((service as any).activeDialogs.length).toBe(0);
    });
  });

  describe('UnifiedDialogRef', () => {
    it('should emit and complete when closed', () => {
      const dialogRef = new UnifiedDialogRef<string>();
      const afterClosedSpy = jasmine.createSpy('afterClosed');
      
      dialogRef.afterClosed().subscribe(afterClosedSpy);
      
      const result = 'test result';
      dialogRef.close(result);
      
      expect(afterClosedSpy).toHaveBeenCalledWith(result);
    });

    it('should emit undefined when closed without result', () => {
      const dialogRef = new UnifiedDialogRef();
      const afterClosedSpy = jasmine.createSpy('afterClosed');
      
      dialogRef.afterClosed().subscribe(afterClosedSpy);
      
      dialogRef.close();
      
      expect(afterClosedSpy).toHaveBeenCalledWith(undefined);
    });
  });

  describe('cleanupDialogElements', () => {
    it('should remove dialog elements from the DOM', () => {
      // Crear elementos de diálogo simulados
      const mockDialogElements = [
        document.createElement('div'),
        document.createElement('div')
      ];
      
      // Configurar parentNode para los elementos
      mockDialogElements.forEach(element => {
        Object.defineProperty(element, 'parentNode', {
          value: {
            removeChild: jasmine.createSpy('removeChild')
          }
        });
      });
      
      // Configurar querySelectorAll para devolver los elementos simulados
      (document.querySelectorAll as jasmine.Spy).and.returnValue(mockDialogElements);
      
      // Espiar console.log
      spyOn(console, 'log');
      
      // Llamar al método privado cleanupDialogElements
      (service as any).cleanupDialogElements();
      
      // Verificar que se eliminaron los elementos
      mockDialogElements.forEach(element => {
        expect((element.parentNode as any).removeChild).toHaveBeenCalledWith(element);
      });
      
      // Verificar que se registró el mensaje
      expect(console.log).toHaveBeenCalledWith('Eliminando 2 elementos de diálogo del DOM');
    });

    it('should handle errors when removing elements', () => {
      // Crear un elemento de diálogo simulado que lanzará un error
      const mockDialogElement = document.createElement('div');
      
      // Configurar parentNode para lanzar un error
      Object.defineProperty(mockDialogElement, 'parentNode', {
        value: {
          removeChild: jasmine.createSpy('removeChild').and.throwError('Test error')
        }
      });
      
      // Configurar querySelectorAll para devolver el elemento simulado
      (document.querySelectorAll as jasmine.Spy).and.returnValue([mockDialogElement]);
      
      // Espiar console.error
      spyOn(console, 'error');
      
      // Llamar al método privado cleanupDialogElements
      (service as any).cleanupDialogElements();
      
      // Verificar que se manejó el error
      expect(console.error).toHaveBeenCalled();
    });
  });
});
