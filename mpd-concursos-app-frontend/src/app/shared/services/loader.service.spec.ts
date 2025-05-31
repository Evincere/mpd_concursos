import { TestBed } from '@angular/core/testing';
import { LoaderService, LoadingState } from './loader.service';

describe('LoaderService', () => {
  let service: LoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have isLoading$ observable', () => {
    expect(service.isLoading$).toBeTruthy();
  });

  it('should initialize with isLoading=false', (done) => {
    service.isLoading$.subscribe((state: LoadingState) => {
      expect(state.isLoading).toBeFalse();
      done();
    });
  });

  it('should show loader', (done) => {
    service.show();
    
    service.isLoading$.subscribe((state: LoadingState) => {
      expect(state.isLoading).toBeTrue();
      expect(state.message).toBeUndefined();
      expect(state.transparent).toBeFalse();
      done();
    });
  });

  it('should show loader with message', (done) => {
    const testMessage = 'Test loading message';
    service.show(testMessage);
    
    service.isLoading$.subscribe((state: LoadingState) => {
      expect(state.isLoading).toBeTrue();
      expect(state.message).toBe(testMessage);
      done();
    });
  });

  it('should show transparent loader', (done) => {
    service.show('Loading', true);
    
    service.isLoading$.subscribe((state: LoadingState) => {
      expect(state.isLoading).toBeTrue();
      expect(state.transparent).toBeTrue();
      done();
    });
  });

  it('should hide loader', (done) => {
    // Primero mostrar el loader
    service.show();
    
    // Luego ocultarlo
    service.hide();
    
    service.isLoading$.subscribe((state: LoadingState) => {
      expect(state.isLoading).toBeFalse();
      done();
    });
  });

  it('should update message', (done) => {
    // Primero mostrar el loader con un mensaje
    const initialMessage = 'Initial message';
    service.show(initialMessage);
    
    // Luego actualizar el mensaje
    const updatedMessage = 'Updated message';
    service.updateMessage(updatedMessage);
    
    service.isLoading$.subscribe((state: LoadingState) => {
      expect(state.isLoading).toBeTrue();
      expect(state.message).toBe(updatedMessage);
      done();
    });
  });

  it('should not update message if loader is not showing', (done) => {
    // Asegurarse de que el loader está oculto
    service.hide();
    
    // Intentar actualizar el mensaje
    service.updateMessage('This should not be set');
    
    service.isLoading$.subscribe((state: LoadingState) => {
      expect(state.isLoading).toBeFalse();
      expect(state.message).toBeUndefined();
      done();
    });
  });

  it('should get current state', () => {
    // Establecer un estado conocido
    service.show('Test message', true);
    
    // Obtener el estado actual
    const currentState = service.getCurrentState();
    
    expect(currentState.isLoading).toBeTrue();
    expect(currentState.message).toBe('Test message');
    expect(currentState.transparent).toBeTrue();
  });
});
