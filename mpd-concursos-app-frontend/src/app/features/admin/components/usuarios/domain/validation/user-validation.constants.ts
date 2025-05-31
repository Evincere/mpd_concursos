/**
 * Constantes de validación para usuarios
 * 
 * Estas constantes definen las reglas de validación que deben ser aplicadas
 * tanto en el frontend como en el backend para garantizar la consistencia.
 */

/**
 * Validación para el nombre de usuario
 */
export const USERNAME_VALIDATION = {
  /** Longitud mínima del nombre de usuario */
  MIN_LENGTH: 4,
  /** Longitud máxima del nombre de usuario */
  MAX_LENGTH: 50,
  /** Expresión regular para validar el formato del nombre de usuario */
  PATTERN: /^[a-zA-Z0-9._-]+$/,
  /** Mensaje de error para longitud mínima */
  MIN_LENGTH_MESSAGE: 'El nombre de usuario debe tener al menos 4 caracteres',
  /** Mensaje de error para longitud máxima */
  MAX_LENGTH_MESSAGE: 'El nombre de usuario no puede tener más de 50 caracteres',
  /** Mensaje de error para formato inválido */
  PATTERN_MESSAGE: 'El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos',
  /** Mensaje de error para nombre de usuario ya existente */
  ALREADY_EXISTS_MESSAGE: 'Este nombre de usuario ya está en uso'
};

/**
 * Validación para el correo electrónico
 */
export const EMAIL_VALIDATION = {
  /** Longitud máxima del correo electrónico */
  MAX_LENGTH: 100,
  /** Expresión regular para validar el formato del correo electrónico */
  PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  /** Mensaje de error para correo electrónico inválido */
  INVALID_MESSAGE: 'Por favor, ingrese un correo electrónico válido',
  /** Mensaje de error para longitud máxima */
  MAX_LENGTH_MESSAGE: 'El correo electrónico no puede tener más de 100 caracteres',
  /** Mensaje de error para correo electrónico ya existente */
  ALREADY_EXISTS_MESSAGE: 'Este correo electrónico ya está registrado'
};

/**
 * Validación para el DNI
 */
export const DNI_VALIDATION = {
  /** Longitud mínima del DNI */
  MIN_LENGTH: 7,
  /** Longitud máxima del DNI */
  MAX_LENGTH: 8,
  /** Expresión regular para validar el formato del DNI */
  PATTERN: /^[0-9]+$/,
  /** Mensaje de error para DNI inválido */
  INVALID_MESSAGE: 'Por favor, ingrese un DNI válido (solo números)',
  /** Mensaje de error para longitud inválida */
  LENGTH_MESSAGE: 'El DNI debe tener entre 7 y 8 dígitos',
  /** Mensaje de error para DNI ya existente */
  ALREADY_EXISTS_MESSAGE: 'Este DNI ya está registrado'
};

/**
 * Validación para el CUIT
 */
export const CUIT_VALIDATION = {
  /** Longitud exacta del CUIT */
  LENGTH: 11,
  /** Expresión regular para validar el formato del CUIT */
  PATTERN: /^[0-9]{11}$/,
  /** Mensaje de error para CUIT inválido */
  INVALID_MESSAGE: 'Por favor, ingrese un CUIT válido (11 dígitos sin guiones)',
  /** Mensaje de error para longitud inválida */
  LENGTH_MESSAGE: 'El CUIT debe tener 11 dígitos',
  /** Mensaje de error para CUIT ya existente */
  ALREADY_EXISTS_MESSAGE: 'Este CUIT ya está registrado'
};

/**
 * Validación para el nombre y apellido
 */
export const NAME_VALIDATION = {
  /** Longitud mínima del nombre/apellido */
  MIN_LENGTH: 2,
  /** Longitud máxima del nombre/apellido */
  MAX_LENGTH: 50,
  /** Expresión regular para validar el formato del nombre/apellido */
  PATTERN: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/,
  /** Mensaje de error para longitud mínima */
  MIN_LENGTH_MESSAGE: 'Debe tener al menos 2 caracteres',
  /** Mensaje de error para longitud máxima */
  MAX_LENGTH_MESSAGE: 'No puede tener más de 50 caracteres',
  /** Mensaje de error para formato inválido */
  PATTERN_MESSAGE: 'Solo puede contener letras, espacios, apóstrofes y guiones'
};

/**
 * Validación para la contraseña
 */
export const PASSWORD_VALIDATION = {
  /** Longitud mínima de la contraseña */
  MIN_LENGTH: 8,
  /** Longitud máxima de la contraseña */
  MAX_LENGTH: 100,
  /** Expresión regular para validar que la contraseña tenga al menos una letra mayúscula */
  UPPERCASE_PATTERN: /[A-Z]/,
  /** Expresión regular para validar que la contraseña tenga al menos una letra minúscula */
  LOWERCASE_PATTERN: /[a-z]/,
  /** Expresión regular para validar que la contraseña tenga al menos un número */
  NUMBER_PATTERN: /[0-9]/,
  /** Expresión regular para validar que la contraseña tenga al menos un carácter especial */
  SPECIAL_CHAR_PATTERN: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
  /** Mensaje de error para longitud mínima */
  MIN_LENGTH_MESSAGE: 'La contraseña debe tener al menos 8 caracteres',
  /** Mensaje de error para longitud máxima */
  MAX_LENGTH_MESSAGE: 'La contraseña no puede tener más de 100 caracteres',
  /** Mensaje de error para falta de letra mayúscula */
  UPPERCASE_MESSAGE: 'La contraseña debe contener al menos una letra mayúscula',
  /** Mensaje de error para falta de letra minúscula */
  LOWERCASE_MESSAGE: 'La contraseña debe contener al menos una letra minúscula',
  /** Mensaje de error para falta de número */
  NUMBER_MESSAGE: 'La contraseña debe contener al menos un número',
  /** Mensaje de error para falta de carácter especial */
  SPECIAL_CHAR_MESSAGE: 'La contraseña debe contener al menos un carácter especial'
};

/**
 * Validación para el teléfono
 */
export const PHONE_VALIDATION = {
  /** Longitud mínima del teléfono */
  MIN_LENGTH: 8,
  /** Longitud máxima del teléfono */
  MAX_LENGTH: 20,
  /** Expresión regular para validar el formato del teléfono */
  PATTERN: /^[0-9+\-\s()]+$/,
  /** Mensaje de error para teléfono inválido */
  INVALID_MESSAGE: 'Por favor, ingrese un número de teléfono válido',
  /** Mensaje de error para longitud inválida */
  LENGTH_MESSAGE: 'El número de teléfono debe tener entre 8 y 20 caracteres'
};

/**
 * Validación para la dirección
 */
export const ADDRESS_VALIDATION = {
  /** Longitud mínima de la dirección */
  MIN_LENGTH: 5,
  /** Longitud máxima de la dirección */
  MAX_LENGTH: 200,
  /** Mensaje de error para longitud mínima */
  MIN_LENGTH_MESSAGE: 'La dirección debe tener al menos 5 caracteres',
  /** Mensaje de error para longitud máxima */
  MAX_LENGTH_MESSAGE: 'La dirección no puede tener más de 200 caracteres'
};

/**
 * Validación para los roles
 */
export const ROLES_VALIDATION = {
  /** Mensaje de error para roles vacíos */
  REQUIRED_MESSAGE: 'Debe seleccionar al menos un rol'
};
