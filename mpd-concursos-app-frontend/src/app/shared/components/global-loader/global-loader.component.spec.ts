import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { GlobalLoaderComponent } from './global-loader.component';
import { LoaderService } from '../../services/loader.service';
import { BehaviorSubject } from 'rxjs';

describe('GlobalLoaderComponent', () => {
  let component: GlobalLoaderComponent;
  let fixture: ComponentFixture<GlobalLoaderComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let loadingSubject: BehaviorSubject<{ isLoading: boolean; message?: string; transparent?: boolean }>;

  beforeEach(async () => {
    // Crear un BehaviorSubject para simular el observable isLoading$
    loadingSubject = new BehaviorSubject<{ isLoading: boolean; message?: string; transparent?: boolean }>({
      isLoading: false
    });

    // Crear un spy para el LoaderService
    const spy = jasmine.createSpyObj('LoaderService', ['show', 'hide', 'updateMessage', 'getCurrentState']);
    // Configurar el spy para que el getter isLoading$ devuelva el BehaviorSubject
    Object.defineProperty(spy, 'isLoading$', {
      get: () => loadingSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [
        GlobalLoaderComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: LoaderService, useValue: spy }
      ]
    }).compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GlobalLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show loader by default', () => {
    expect(component.isLoading).toBeFalse();
    const loaderElement = fixture.nativeElement.querySelector('.global-loader-container');
    expect(loaderElement).toBeNull();
  });

  it('should show loader when isLoading is true', () => {
    // Simular que el servicio emite un estado de carga
    loadingSubject.next({ isLoading: true });
    fixture.detectChanges();

    expect(component.isLoading).toBeTrue();
    const loaderElement = fixture.nativeElement.querySelector('.global-loader-container');
    expect(loaderElement).not.toBeNull();
  });

  it('should show message when provided', () => {
    // Simular que el servicio emite un estado de carga con mensaje
    const testMessage = 'Loading test...';
    loadingSubject.next({ isLoading: true, message: testMessage });
    fixture.detectChanges();

    expect(component.message).toBe(testMessage);
    const messageElement = fixture.nativeElement.querySelector('.message');
    expect(messageElement.textContent).toContain(testMessage);
  });

  it('should apply transparent class when transparent is true', () => {
    // Simular que el servicio emite un estado de carga con transparent=true
    loadingSubject.next({ isLoading: true, transparent: true });
    fixture.detectChanges();

    expect(component.transparent).toBeTrue();
    const loaderElement = fixture.nativeElement.querySelector('.global-loader-container');
    expect(loaderElement.classList).toContain('transparent');
  });

  it('should not show message element when no message is provided', () => {
    // Simular que el servicio emite un estado de carga sin mensaje
    loadingSubject.next({ isLoading: true });
    fixture.detectChanges();

    expect(component.message).toBe('');
    const messageElement = fixture.nativeElement.querySelector('.message');
    expect(messageElement).toBeNull();
  });

  it('should clean up subscription on destroy', () => {
    // Espiar el método next del Subject destroy$
    const nextSpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
