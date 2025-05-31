import {
  BaseUserDTO,
  UserRegisterDTO,
  AdminCreateUserDTO,
  UserUpdateDTO,
  UserStatus
} from '../interfaces/user/base-user.interface';
import { NewUser } from '../interfaces/auth/new-user.interface';
import { User } from '../../features/admin/components/users/domain/models/user.model';
import { CreateUserRequest } from '../../features/admin/components/users/domain/models/user.model';

/**
 * Clase para mapear entre las diferentes interfaces de usuario
 * Proporciona métodos para convertir entre las interfaces antiguas y las nuevas
 */
export class UserDtoMapper {

  /**
   * Convierte un objeto NewUser a UserRegisterDTO
   * @param newUser Objeto NewUser a convertir
   * @returns UserRegisterDTO
   */
  static newUserToUserRegisterDTO(newUser: NewUser): UserRegisterDTO {
    return {
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
      confirmPassword: newUser.confirmPassword,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      dni: newUser.dni,
      cuit: newUser.cuit,
      termsAccepted: true // Asumimos que si se está registrando, aceptó los términos
    };
  }

  /**
   * Convierte un objeto UserRegisterDTO a NewUser
   * @param userRegisterDTO Objeto UserRegisterDTO a convertir
   * @returns NewUser
   */
  static userRegisterDTOToNewUser(userRegisterDTO: UserRegisterDTO): NewUser {
    return {
      ...userRegisterDTO,
      roles: new Set<string>(['ROLE_USER'])
    };
  }

  /**
   * Convierte un objeto CreateUserRequest a AdminCreateUserDTO
   * @param createUserRequest Objeto CreateUserRequest a convertir
   * @returns AdminCreateUserDTO
   */
  static createUserRequestToAdminCreateUserDTO(createUserRequest: CreateUserRequest): AdminCreateUserDTO {
    return {
      username: createUserRequest.username,
      email: createUserRequest.email,
      firstName: createUserRequest.firstName,
      lastName: createUserRequest.lastName,
      dni: createUserRequest.dni,
      cuit: createUserRequest.cuit,
      roles: createUserRequest.roles,
      telefono: createUserRequest.telefono,
      legalAddress: createUserRequest.direccion,
      password: createUserRequest.password,
      sendWelcomeEmail: createUserRequest.sendWelcomeEmail,
      enabled: createUserRequest.enabled ?? true,
      status: (createUserRequest.status as UserStatus) ?? UserStatus.ACTIVE
    };
  }

  /**
   * Convierte un objeto AdminCreateUserDTO a CreateUserRequest
   * @param adminCreateUserDTO Objeto AdminCreateUserDTO a convertir
   * @returns CreateUserRequest
   */
  static adminCreateUserDTOToCreateUserRequest(adminCreateUserDTO: AdminCreateUserDTO): CreateUserRequest {
    return {
      username: adminCreateUserDTO.username,
      email: adminCreateUserDTO.email,
      firstName: adminCreateUserDTO.firstName,
      lastName: adminCreateUserDTO.lastName,
      dni: adminCreateUserDTO.dni,
      cuit: adminCreateUserDTO.cuit,
      roles: adminCreateUserDTO.roles,
      telefono: adminCreateUserDTO.telefono,
      direccion: adminCreateUserDTO.legalAddress,
      password: adminCreateUserDTO.password,
      sendWelcomeEmail: adminCreateUserDTO.sendWelcomeEmail
    };
  }

  /**
   * Convierte un objeto User a BaseUserDTO
   * @param user Objeto User a convertir
   * @returns BaseUserDTO
   */
  static userToBaseUserDTO(user: User): BaseUserDTO {
    return {
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      dni: user.dni,
      cuit: user.cuit,
      telefono: user.telefono,
      legalAddress: user.direccion,
      // Campos adicionales que podrían estar disponibles en el futuro
      birthDate: undefined,
      country: undefined,
      province: undefined,
      municipality: undefined,
      residentialAddress: undefined
    };
  }

  /**
   * Convierte un objeto BaseUserDTO a formato backend
   * @param baseUserDTO Objeto BaseUserDTO a convertir
   * @returns Objeto con el formato esperado por el backend
   */
  static baseUserDTOToBackendFormat(baseUserDTO: BaseUserDTO): Record<string, any> {
    return {
      username: baseUserDTO.username,
      email: baseUserDTO.email,
      nombre: baseUserDTO.firstName, // Mapeo a nombre para el backend
      apellido: baseUserDTO.lastName, // Mapeo a apellido para el backend
      dni: baseUserDTO.dni,
      cuit: baseUserDTO.cuit?.replace(/-/g, ''), // Eliminar guiones si existen
      telefono: baseUserDTO.telefono,
      direccion: baseUserDTO.legalAddress // Usar legalAddress como direccion
    };
  }
}
