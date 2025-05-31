import {
  User,
  UserCreateDTO,
  UserUpdateDTO
} from '../interfaces/user/user.interface';

/**
 * Clase para mapear entre diferentes representaciones de usuarios
 */
export class UserMapper {
  /**
   * Convierte un objeto User a un formato de visualización
   * @param user Usuario a convertir
   * @returns Usuario formateado para visualización
   */
  static toViewModel(user: User): Record<string, unknown> {
    return {
      id: user.id,
      nombre: `${user.nombre} ${user.apellido}`,
      email: user.email,
      roles: user.roles,
      estado: user.estado,
      fechaRegistro: user.fechaRegistro,
      ultimoAcceso: user.ultimoAcceso,
      telefono: user.telefono || '',
      direccion: user.direccion || ''
    };
  }

  /**
   * Convierte un objeto User a UserUpdateDTO
   * @param user Usuario a convertir
   * @returns DTO para actualización
   */
  static toUpdateDTO(user: User): UserUpdateDTO {
    return {
      id: user.id!,
      nombre: user.nombre,
      apellido: user.apellido,
      dni: user.dni,
      email: user.email,
      roles: user.roles,
      estado: user.estado,
      telefono: user.telefono,
      direccion: user.direccion
    };
  }

  /**
   * Convierte un formulario a UserCreateDTO
   * @param formData Datos del formulario
   * @returns DTO para creación
   */
  static formToCreateDTO(formData: unknown): UserCreateDTO {
    const roles: string[] = [];
    const formDataObj = formData as Record<string, unknown>;

    if (formData && typeof formData === "object" && "admin" in formDataObj && formDataObj["admin"]) roles.push('Administrador');
    if (formData && typeof formData === "object" && "evaluador" in formDataObj && formDataObj["evaluador"]) roles.push('Evaluador');
    if (formData && typeof formData === "object" && "usuario" in formDataObj && formDataObj["usuario"]) roles.push('Usuario');

    return {
      nombre: (formData && typeof formData === "object" && "nombre" in formDataObj) ? formDataObj["nombre"] as string : "",
      apellido: (formData && typeof formData === "object" && "apellido" in formDataObj) ? formDataObj["apellido"] as string : "",
      dni: (formData && typeof formData === "object" && "dni" in formDataObj) ? formDataObj["dni"] as string : "",
      email: (formData && typeof formData === "object" && "email" in formDataObj) ? formDataObj["email"] as string : "",
      password: (formData && typeof formData === "object" && "password" in formDataObj) ? formDataObj["password"] as string : "",
      roles: roles,
      telefono: (formData && typeof formData === "object" && "telefono" in formDataObj) ? formDataObj["telefono"] as string : undefined,
      direccion: (formData && typeof formData === "object" && "direccion" in formDataObj) ? formDataObj["direccion"] as string : undefined
    };
  }

  /**
   * Convierte un formulario a UserUpdateDTO
   * @param id ID del usuario
   * @param formData Datos del formulario
   * @returns DTO para actualización
   */
  static formToUpdateDTO(id: number, formData: unknown): UserUpdateDTO {
    const roles: string[] = [];
    const formDataObj = formData as Record<string, unknown>;

    if (formData && typeof formData === "object" && "admin" in formDataObj && formDataObj["admin"]) roles.push('Administrador');
    if (formData && typeof formData === "object" && "evaluador" in formDataObj && formDataObj["evaluador"]) roles.push('Evaluador');
    if (formData && typeof formData === "object" && "usuario" in formDataObj && formDataObj["usuario"]) roles.push('Usuario');

    return {
      id: id,
      nombre: (formData && typeof formData === "object" && "nombre" in formDataObj) ? formDataObj["nombre"] as string : undefined,
      apellido: (formData && typeof formData === "object" && "apellido" in formDataObj) ? formDataObj["apellido"] as string : undefined,
      dni: (formData && typeof formData === "object" && "dni" in formDataObj) ? formDataObj["dni"] as string : undefined,
      email: (formData && typeof formData === "object" && "email" in formDataObj) ? formDataObj["email"] as string : undefined,
      roles: roles,
      estado: (formData && typeof formData === "object" && "estado" in formDataObj) ? formDataObj["estado"] as 'activo' | 'inactivo' | 'bloqueado' : undefined,
      telefono: (formData && typeof formData === "object" && "telefono" in formDataObj) ? formDataObj["telefono"] as string : undefined,
      direccion: (formData && typeof formData === "object" && "direccion" in formDataObj) ? formDataObj["direccion"] as string : undefined
    };
  }

  /**
   * Convierte un objeto User a datos de formulario
   * @param user Usuario a convertir
   * @returns Datos para formulario
   */
  static toFormData(user: User): Record<string, unknown> {
    return {
      nombre: user.nombre,
      apellido: user.apellido,
      dni: user.dni,
      email: user.email,
      telefono: user.telefono || '',
      direccion: user.direccion || '',
      admin: user.roles.includes('Administrador'),
      evaluador: user.roles.includes('Evaluador'),
      usuario: user.roles.includes('Usuario'),
      estado: user.estado
    };
  }
}
