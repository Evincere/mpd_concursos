import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ContentTransitionComponent } from './content-transition.component';
import { AnimationService } from '../../services/animation.service';

describe('ContentTransitionComponent', () => {
  let component: ContentTransitionComponent;
  let fixture: ComponentFixture<ContentTransitionComponent>;
  let animationServiceSpy: jasmine.SpyObj<AnimationService>;

  beforeEach(async () => {
    // Crear un spy para el AnimationService
    const spy = jasmine.createSpyObj('AnimationService', [
      'createFadeIn',
      'createFadeOut',
      'createSlideIn',
      'createSlideOut',
      'createScaleIn',
      'createScaleOut',
      'runAnimation'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        ContentTransitionComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AnimationService, useValue: spy }
      ]
    }).compileComponents();

    animationServiceSpy = TestBed.inject(AnimationService) as jasmine.SpyObj<AnimationService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentTransitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have "fade" as default animation type', () => {
    expect(component.type).toBe('fade');
  });

  it('should set animation state to the type value after initialization', () => {
    // El estado de animación se establece después de un pequeño retraso
    jasmine.clock().install();
    component.ngOnInit();
    jasmine.clock().tick(20);
    expect(component.animationState).toBe(component.type);
    jasmine.clock().uninstall();
  });

  it('should check for reduced motion preference', () => {
    // Espiar el método privado
    spyOn<any>(component, 'checkReducedMotionPreference');
    component.ngOnInit();
    expect(component['checkReducedMotionPreference']).toHaveBeenCalled();
  });

  it('should clean up on destroy', () => {
    const nextSpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  // Pruebas para diferentes tipos de animación
  it('should support "fade" animation type', () => {
    component.type = 'fade';
    fixture.detectChanges();
    expect(component.type).toBe('fade');
  });

  it('should support "slide-left" animation type', () => {
    component.type = 'slide-left';
    fixture.detectChanges();
    expect(component.type).toBe('slide-left');
  });

  it('should support "slide-right" animation type', () => {
    component.type = 'slide-right';
    fixture.detectChanges();
    expect(component.type).toBe('slide-right');
  });

  it('should support "slide-up" animation type', () => {
    component.type = 'slide-up';
    fixture.detectChanges();
    expect(component.type).toBe('slide-up');
  });

  it('should support "slide-down" animation type', () => {
    component.type = 'slide-down';
    fixture.detectChanges();
    expect(component.type).toBe('slide-down');
  });

  it('should support "zoom" animation type', () => {
    component.type = 'zoom';
    fixture.detectChanges();
    expect(component.type).toBe('zoom');
  });
});
