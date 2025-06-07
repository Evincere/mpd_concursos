import { 
  Directive, 
  Input, 
  TemplateRef, 
  ViewContainerRef, 
  OnInit, 
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthorizationService, AuthorizationContext } from '@core/services/roles/authorization.service';

/**
 * Directiva estructural para mostrar/ocultar elementos basado en permisos
 * 
 * Uso:
 * *hasPermission="'users.create'"
 * *hasPermission="'users.edit'; context: { userId: user.id }"
 * *hasPermission="['users.create', 'users.edit']; operator: 'any'"
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {

  @Input() set hasPermission(permissions: string | string[]) {
    this._permissions = Array.isArray(permissions) ? permissions : [permissions];
    this.updateView();
  }

  @Input() set hasPermissionContext(context: AuthorizationContext) {
    this._context = context;
    this.updateView();
  }

  @Input() set hasPermissionOperator(operator: 'all' | 'any') {
    this._operator = operator;
    this.updateView();
  }

  @Input() set hasPermissionElse(template: TemplateRef<any>) {
    this._elseTemplate = template;
    this.updateView();
  }

  private _permissions: string[] = [];
  private _context?: AuthorizationContext;
  private _operator: 'all' | 'any' = 'all';
  private _elseTemplate?: TemplateRef<any>;
  private _hasView = false;
  private _hasElseView = false;

  private destroy$ = new Subject<void>();

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authorizationService: AuthorizationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateView();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView(): void {
    if (this._permissions.length === 0) {
      this.showElseView();
      return;
    }

    // Determinar qué método de verificación usar
    const checkMethod = this._operator === 'any' 
      ? this.authorizationService.hasAnyPermission(this._permissions, this._context)
      : this.authorizationService.hasAllPermissions(this._permissions, this._context);

    checkMethod.pipe(
      takeUntil(this.destroy$)
    ).subscribe(hasPermission => {
      if (hasPermission) {
        this.showMainView();
      } else {
        this.showElseView();
      }
      this.cdr.markForCheck();
    });
  }

  private showMainView(): void {
    if (!this._hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this._hasView = true;
      this._hasElseView = false;
    }
  }

  private showElseView(): void {
    if (!this._hasElseView) {
      this.viewContainer.clear();
      if (this._elseTemplate) {
        this.viewContainer.createEmbeddedView(this._elseTemplate);
      }
      this._hasView = false;
      this._hasElseView = true;
    }
  }
}

/**
 * Directiva estructural para mostrar/ocultar elementos basado en roles
 * 
 * Uso:
 * *hasRole="'ADMIN'"
 * *hasRole="['ADMIN', 'MANAGER']; operator: 'any'"
 */
@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {

  @Input() set hasRole(roles: string | string[]) {
    this._roles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  @Input() set hasRoleOperator(operator: 'all' | 'any') {
    this._operator = operator;
    this.updateView();
  }

  @Input() set hasRoleElse(template: TemplateRef<any>) {
    this._elseTemplate = template;
    this.updateView();
  }

  private _roles: string[] = [];
  private _operator: 'all' | 'any' = 'any';
  private _elseTemplate?: TemplateRef<any>;
  private _hasView = false;
  private _hasElseView = false;

  private destroy$ = new Subject<void>();

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authorizationService: AuthorizationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateView();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView(): void {
    if (this._roles.length === 0) {
      this.showElseView();
      return;
    }

    // Para roles, normalmente usamos 'any' por defecto
    const checkMethod = this._operator === 'all'
      ? this.checkAllRoles()
      : this.authorizationService.hasAnyRole(this._roles);

    checkMethod.pipe(
      takeUntil(this.destroy$)
    ).subscribe(hasRole => {
      if (hasRole) {
        this.showMainView();
      } else {
        this.showElseView();
      }
      this.cdr.markForCheck();
    });
  }

  private checkAllRoles() {
    // Implementar verificación de todos los roles
    return this.authorizationService.getCurrentUserPermissions()?.roles
      ? this._roles.every(roleId => 
          this.authorizationService.getCurrentUserPermissions()!.roles.some(role => role.id === roleId)
        )
      : false;
  }

  private showMainView(): void {
    if (!this._hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this._hasView = true;
      this._hasElseView = false;
    }
  }

  private showElseView(): void {
    if (!this._hasElseView) {
      this.viewContainer.clear();
      if (this._elseTemplate) {
        this.viewContainer.createEmbeddedView(this._elseTemplate);
      }
      this._hasView = false;
      this._hasElseView = true;
    }
  }
}

/**
 * Directiva estructural para mostrar/ocultar elementos basado en nivel de rol
 * 
 * Uso:
 * *hasRoleLevel="'ADMIN'"
 * *hasRoleLevel="'MANAGER'; orHigher: true"
 */
@Directive({
  selector: '[hasRoleLevel]',
  standalone: true
})
export class HasRoleLevelDirective implements OnInit, OnDestroy {

  @Input() set hasRoleLevel(level: string) {
    this._level = level;
    this.updateView();
  }

  @Input() set hasRoleLevelOrHigher(orHigher: boolean) {
    this._orHigher = orHigher;
    this.updateView();
  }

  @Input() set hasRoleLevelElse(template: TemplateRef<any>) {
    this._elseTemplate = template;
    this.updateView();
  }

  private _level = '';
  private _orHigher = true;
  private _elseTemplate?: TemplateRef<any>;
  private _hasView = false;
  private _hasElseView = false;

  private destroy$ = new Subject<void>();

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authorizationService: AuthorizationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateView();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView(): void {
    if (!this._level) {
      this.showElseView();
      return;
    }

    this.authorizationService.hasRoleLevel(this._level).pipe(
      takeUntil(this.destroy$)
    ).subscribe(hasLevel => {
      if (hasLevel) {
        this.showMainView();
      } else {
        this.showElseView();
      }
      this.cdr.markForCheck();
    });
  }

  private showMainView(): void {
    if (!this._hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this._hasView = true;
      this._hasElseView = false;
    }
  }

  private showElseView(): void {
    if (!this._hasElseView) {
      this.viewContainer.clear();
      if (this._elseTemplate) {
        this.viewContainer.createEmbeddedView(this._elseTemplate);
      }
      this._hasView = false;
      this._hasElseView = true;
    }
  }
}

/**
 * Directiva de atributo para deshabilitar elementos basado en permisos
 * 
 * Uso:
 * <button [disableIfNoPermission]="'users.delete'">Eliminar</button>
 * <input [disableIfNoPermission]="'users.edit'" [disableIfNoPermissionContext]="{ userId: user.id }">
 */
@Directive({
  selector: '[disableIfNoPermission]',
  standalone: true
})
export class DisableIfNoPermissionDirective implements OnInit, OnDestroy {

  @Input() set disableIfNoPermission(permissions: string | string[]) {
    this._permissions = Array.isArray(permissions) ? permissions : [permissions];
    this.updateDisabledState();
  }

  @Input() set disableIfNoPermissionContext(context: AuthorizationContext) {
    this._context = context;
    this.updateDisabledState();
  }

  @Input() set disableIfNoPermissionOperator(operator: 'all' | 'any') {
    this._operator = operator;
    this.updateDisabledState();
  }

  private _permissions: string[] = [];
  private _context?: AuthorizationContext;
  private _operator: 'all' | 'any' = 'all';

  private destroy$ = new Subject<void>();

  constructor(
    private viewContainer: ViewContainerRef,
    private authorizationService: AuthorizationService
  ) {}

  ngOnInit(): void {
    this.updateDisabledState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateDisabledState(): void {
    if (this._permissions.length === 0) {
      this.setDisabled(true);
      return;
    }

    const checkMethod = this._operator === 'any' 
      ? this.authorizationService.hasAnyPermission(this._permissions, this._context)
      : this.authorizationService.hasAllPermissions(this._permissions, this._context);

    checkMethod.pipe(
      takeUntil(this.destroy$)
    ).subscribe(hasPermission => {
      this.setDisabled(!hasPermission);
    });
  }

  private setDisabled(disabled: boolean): void {
    const element = this.viewContainer.element.nativeElement;
    if (element) {
      element.disabled = disabled;
      if (disabled) {
        element.classList.add('permission-disabled');
        element.setAttribute('title', 'No tienes permisos para realizar esta acción');
      } else {
        element.classList.remove('permission-disabled');
        element.removeAttribute('title');
      }
    }
  }
}
