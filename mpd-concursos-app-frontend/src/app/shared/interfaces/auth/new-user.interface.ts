import { UserRegisterDTO } from '../user/base-user.interface';

/**
 * Interfaz para el registro de nuevos usuarios
 * @deprecated Use UserRegisterDTO instead
 */
export interface NewUser extends UserRegisterDTO {
  /**
   * Roles asignados al usuario
   * @deprecated En el registro público siempre se asigna ROLE_USER
   */
  roles: Set<string>;
}