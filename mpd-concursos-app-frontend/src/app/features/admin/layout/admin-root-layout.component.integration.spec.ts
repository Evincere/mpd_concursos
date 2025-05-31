import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminRootLayoutComponent } from './admin-root-layout.component';
import { AdminHeaderComponent } from './components/admin-header/admin-header.component';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { AdminBreadcrumbsComponent } from './components/admin-breadcrumbs/admin-breadcrumbs.component';
import { SectionIndicatorComponent } from '../../../shared/components/section-indicator/section-indicator.component';
import { GlobalLoaderComponent } from '../../../shared/components/global-loader/global-loader.component';
import { ContentTransitionComponent } from '../../../shared/components/content-transition/content-transition.component';
import { KeyboardShortcutsHelpComponent } from '../../../shared/components/keyboard-shortcuts-help/keyboard-shortcuts-help.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { LoaderService } from '@shared/services/loader.service';
import { KeyboardShortcutsService } from '@shared/services/keyboard-shortcuts.service';
import { NavigationService } from '@shared/services/navigation.service';
import { By } from '@angular/platform-browser';

// Mock de los componentes hijos para simplificar la prueba
class MockComponent {}

describe('AdminRootLayoutComponent (Integration)', () => {
  let component: AdminRootLayoutComponent;
  let fixture: ComponentFixture<AdminRootLayoutComponent>;
  let loaderService: LoaderService;
  let keyboardShortcutsService: KeyboardShortcutsService;
  let navigationService: NavigationService;

  beforeEach(async () => {
    // Crear un spy para localStorage
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem');

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        NoopAnimationsModule,
        AdminRootLayoutComponent,
        AdminHeaderComponent,
        AdminSidebarComponent,
        AdminBreadcrumbsComponent,
        SectionIndicatorComponent,
        GlobalLoaderComponent,
        ContentTransitionComponent,
        KeyboardShortcutsHelpComponent,
        CustomButtonComponent
      ],
      providers: [
        LoaderService,
        KeyboardShortcutsService,
        NavigationService
      ]
    })
    .compileComponents();

    loaderService = TestBed.inject(LoaderService);
    keyboardShortcutsService = TestBed.inject(KeyboardShortcutsService);
    navigationService = TestBed.inject(NavigationService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminRootLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain all required components', () => {
    // Verificar que todos los componentes principales están presentes
    expect(fixture.debugElement.query(By.directive(AdminHeaderComponent))).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(AdminSidebarComponent))).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(AdminBreadcrumbsComponent))).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(SectionIndicatorComponent))).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(GlobalLoaderComponent))).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(ContentTransitionComponent))).toBeTruthy();
    expect(fixture.debugElement.query(By.directive(KeyboardShortcutsHelpComponent))).toBeTruthy();
  });

  it('should toggle sidebar when header emits toggleSidebar event', () => {
    // Obtener el componente de header
    const headerComponent = fixture.debugElement.query(By.directive(AdminHeaderComponent)).componentInstance;
    
    // Estado inicial del sidebar
    const initialState = component.isSidebarCollapsed;
    
    // Emitir evento de toggle desde el header
    headerComponent.toggleSidebar.emit(!initialState);
    
    // Verificar que el estado del sidebar cambió
    expect(component.isSidebarCollapsed).toBe(!initialState);
    
    // Verificar que se guardó la preferencia en localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'adminSidebarState',
      component.isSidebarCollapsed ? 'collapsed' : 'expanded'
    );
  });

  it('should show mobile sidebar toggle button when in mobile view and sidebar is collapsed', () => {
    // Simular vista móvil
    component.isMobile = true;
    component.isSidebarCollapsed = true;
    fixture.detectChanges();
    
    // Verificar que el botón de toggle está presente
    const toggleButton = fixture.debugElement.query(By.css('.mobile-sidebar-toggle'));
    expect(toggleButton).toBeTruthy();
  });

  it('should not show mobile sidebar toggle button when in desktop view', () => {
    // Simular vista de escritorio
    component.isMobile = false;
    component.isSidebarCollapsed = true;
    fixture.detectChanges();
    
    // Verificar que el botón de toggle no está presente
    const toggleButton = fixture.debugElement.query(By.css('.mobile-sidebar-toggle'));
    expect(toggleButton).toBeFalsy();
  });

  it('should apply sidebar-collapsed class to content when sidebar is collapsed', () => {
    // Colapsar el sidebar
    component.isSidebarCollapsed = true;
    fixture.detectChanges();
    
    // Verificar que la clase se aplicó
    const content = fixture.debugElement.query(By.css('.admin-content'));
    expect(content.classes['sidebar-collapsed']).toBeTrue();
  });

  it('should not apply sidebar-collapsed class to content when sidebar is expanded', () => {
    // Expandir el sidebar
    component.isSidebarCollapsed = false;
    fixture.detectChanges();
    
    // Verificar que la clase no se aplicó
    const content = fixture.debugElement.query(By.css('.admin-content'));
    expect(content.classes['sidebar-collapsed']).toBeFalsy();
  });

  it('should check screen size on initialization', () => {
    // Espiar el método checkScreenSize
    spyOn<any>(component, 'checkScreenSize').and.callThrough();
    
    // Llamar a ngOnInit
    component.ngOnInit();
    
    // Verificar que se llamó a checkScreenSize
    expect(component['checkScreenSize']).toHaveBeenCalled();
  });

  it('should check screen size on window resize', () => {
    // Espiar el método checkScreenSize
    spyOn<any>(component, 'checkScreenSize').and.callThrough();
    
    // Simular evento de resize
    window.dispatchEvent(new Event('resize'));
    
    // Verificar que se llamó a checkScreenSize
    expect(component['checkScreenSize']).toHaveBeenCalled();
  });

  it('should collapse sidebar on mobile view', () => {
    // Simular vista móvil
    spyOn(window, 'innerWidth').and.returnValue(500);
    
    // Expandir el sidebar
    component.isSidebarCollapsed = false;
    
    // Llamar a checkScreenSize
    component['checkScreenSize']();
    
    // Verificar que el sidebar se colapsó
    expect(component.isSidebarCollapsed).toBeTrue();
  });
});
