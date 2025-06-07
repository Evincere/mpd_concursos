/**
 * Interfaz para permisos del sistema
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: PermissionAction;
  resource: string;
  conditions?: PermissionCondition[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Tipos de acciones de permisos
 */
export type PermissionAction = 
  | 'CREATE' 
  | 'READ' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'EXECUTE' 
  | 'APPROVE' 
  | 'REJECT' 
  | 'PUBLISH' 
  | 'ARCHIVE'
  | 'EXPORT'
  | 'IMPORT'
  | 'MANAGE';

/**
 * Condiciones para permisos contextuales
 */
export interface PermissionCondition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'NOT_IN' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS';
  value: any;
  description?: string;
}

/**
 * Interfaz para roles del sistema
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  type: RoleType;
  level: RoleLevel;
  permissions: Permission[];
  isSystem: boolean;
  isActive: boolean;
  parentRoleId?: string;
  childRoles?: Role[];
  userCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Tipos de roles
 */
export type RoleType = 
  | 'SYSTEM'      // Roles del sistema (no modificables)
  | 'CUSTOM'      // Roles personalizados
  | 'TEMPLATE'    // Plantillas de roles
  | 'TEMPORARY';  // Roles temporales

/**
 * Niveles de roles (jerarquía)
 */
export type RoleLevel = 
  | 'SUPER_ADMIN'    // Acceso total al sistema
  | 'ADMIN'          // Administrador general
  | 'MANAGER'        // Gestor de área
  | 'OPERATOR'       // Operador especializado
  | 'USER'           // Usuario común
  | 'GUEST';         // Invitado (solo lectura)

/**
 * Interfaz para asignación de roles a usuarios
 */
export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role?: Role;
  assignedAt: Date | string;
  assignedBy: string;
  expiresAt?: Date | string;
  isActive: boolean;
  context?: UserRoleContext;
  notes?: string;
}

/**
 * Contexto de asignación de rol
 */
export interface UserRoleContext {
  department?: string;
  project?: string;
  location?: string;
  temporaryUntil?: Date | string;
  restrictions?: string[];
}

/**
 * Interfaz para matriz de permisos
 */
export interface PermissionMatrix {
  module: string;
  resources: PermissionMatrixResource[];
}

export interface PermissionMatrixResource {
  resource: string;
  actions: PermissionMatrixAction[];
}

export interface PermissionMatrixAction {
  action: PermissionAction;
  roles: {
    roleId: string;
    roleName: string;
    hasPermission: boolean;
    conditions?: PermissionCondition[];
  }[];
}

/**
 * Interfaz para configuración de roles
 */
export interface RoleConfiguration {
  allowRoleInheritance: boolean;
  allowMultipleRoles: boolean;
  requireApprovalForRoleChanges: boolean;
  maxRolesPerUser: number;
  defaultRole: string;
  guestRole: string;
  systemRoles: string[];
  roleHierarchy: RoleHierarchy[];
}

export interface RoleHierarchy {
  parentRole: string;
  childRoles: string[];
  inheritPermissions: boolean;
}

/**
 * Interfaz para auditoría de roles
 */
export interface RoleAudit {
  id: string;
  userId: string;
  roleId: string;
  action: RoleAuditAction;
  previousValue?: any;
  newValue?: any;
  reason?: string;
  performedBy: string;
  performedAt: Date | string;
  ipAddress?: string;
  userAgent?: string;
}

export type RoleAuditAction = 
  | 'ROLE_ASSIGNED' 
  | 'ROLE_REMOVED' 
  | 'ROLE_MODIFIED' 
  | 'PERMISSION_GRANTED' 
  | 'PERMISSION_REVOKED'
  | 'ROLE_CREATED'
  | 'ROLE_DELETED'
  | 'ROLE_ACTIVATED'
  | 'ROLE_DEACTIVATED';

/**
 * Interfaz para estadísticas de roles
 */
export interface RoleStatistics {
  totalRoles: number;
  activeRoles: number;
  systemRoles: number;
  customRoles: number;
  totalPermissions: number;
  usersWithRoles: number;
  usersWithoutRoles: number;
  roleDistribution: {
    roleId: string;
    roleName: string;
    userCount: number;
    percentage: number;
  }[];
  permissionUsage: {
    permissionId: string;
    permissionName: string;
    roleCount: number;
    userCount: number;
  }[];
}

/**
 * Interfaz para validación de permisos
 */
export interface PermissionValidation {
  hasPermission: boolean;
  reason?: string;
  requiredPermissions: string[];
  userPermissions: string[];
  missingPermissions: string[];
  context?: any;
}

/**
 * Interfaz para plantilla de rol
 */
export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  permissions: string[];
  suggestedLevel: RoleLevel;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date | string;
  usageCount: number;
}

/**
 * Interfaz para solicitud de rol
 */
export interface RoleRequest {
  id: string;
  userId: string;
  requestedRoleId: string;
  requestedRole?: Role;
  reason: string;
  status: RoleRequestStatus;
  requestedAt: Date | string;
  reviewedAt?: Date | string;
  reviewedBy?: string;
  reviewNotes?: string;
  expiresAt?: Date | string;
}

export type RoleRequestStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'EXPIRED' 
  | 'CANCELLED';

/**
 * Interfaz para permisos efectivos de un usuario
 */
export interface UserEffectivePermissions {
  userId: string;
  roles: Role[];
  permissions: Permission[];
  deniedPermissions: Permission[];
  inheritedPermissions: Permission[];
  directPermissions: Permission[];
  contextualPermissions: {
    context: string;
    permissions: Permission[];
  }[];
  lastCalculated: Date | string;
}

/**
 * Utilidades para trabajar con roles y permisos
 */
export class RoleUtils {
  
  /**
   * Verifica si un rol tiene un permiso específico
   */
  static hasPermission(role: Role, permissionId: string): boolean {
    return role.permissions.some(p => p.id === permissionId);
  }

  /**
   * Obtiene todos los permisos únicos de una lista de roles
   */
  static getAllPermissions(roles: Role[]): Permission[] {
    const permissionMap = new Map<string, Permission>();
    
    roles.forEach(role => {
      role.permissions.forEach(permission => {
        permissionMap.set(permission.id, permission);
      });
    });

    return Array.from(permissionMap.values());
  }

  /**
   * Verifica si un nivel de rol es superior a otro
   */
  static isHigherLevel(level1: RoleLevel, level2: RoleLevel): boolean {
    const hierarchy: RoleLevel[] = [
      'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR', 'USER', 'GUEST'
    ];
    
    return hierarchy.indexOf(level1) < hierarchy.indexOf(level2);
  }

  /**
   * Formatea el nombre de un permiso para mostrar
   */
  static formatPermissionName(permission: Permission): string {
    return `${permission.module}.${permission.resource}.${permission.action}`;
  }

  /**
   * Agrupa permisos por módulo
   */
  static groupPermissionsByModule(permissions: Permission[]): Map<string, Permission[]> {
    const grouped = new Map<string, Permission[]>();
    
    permissions.forEach(permission => {
      const module = permission.module;
      if (!grouped.has(module)) {
        grouped.set(module, []);
      }
      grouped.get(module)!.push(permission);
    });

    return grouped;
  }
}
