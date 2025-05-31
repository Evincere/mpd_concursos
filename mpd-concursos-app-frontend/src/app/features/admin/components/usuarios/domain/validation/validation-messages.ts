/**
 * Mensajes de validación para el formulario de usuario
 */

export const NAME_VALIDATION = {
  REQUIRED_MESSAGE: 'Este campo es obligatorio',
  MIN_LENGTH_MESSAGE: 'Debe tener al menos 2 caracteres',
  MAX_LENGTH_MESSAGE: 'No debe exceder los 50 caracteres',
  INVALID_FORMAT_MESSAGE: 'No debe contener números ni caracteres especiales'
};

export const DNI_VALIDATION = {
  REQUIRED_MESSAGE: 'El DNI es obligatorio',
  INVALID_FORMAT_MESSAGE: 'El DNI debe tener entre 7 y 8 dígitos numéricos',
  DUPLICATE_MESSAGE: 'Este DNI ya está registrado'
};

export const EMAIL_VALIDATION = {
  REQUIRED_MESSAGE: 'El email es obligatorio',
  INVALID_FORMAT_MESSAGE: 'Debe ingresar un email válido',
  DUPLICATE_MESSAGE: 'Este email ya está registrado'
};

export const PASSWORD_VALIDATION = {
  REQUIRED_MESSAGE: 'La contraseña es obligatoria',
  MIN_LENGTH_MESSAGE: 'La contraseña debe tener al menos 8 caracteres',
  PATTERN_MESSAGE: 'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número',
  MISMATCH_MESSAGE: 'Las contraseñas no coinciden'
};

export const PHONE_VALIDATION = {
  INVALID_FORMAT_MESSAGE: 'El teléfono debe tener un formato válido'
};

export const ADDRESS_VALIDATION = {
  INVALID_FORMAT_MESSAGE: 'La dirección debe tener un formato válido'
};

export const ROLES_VALIDATION = {
  REQUIRED_MESSAGE: 'Debe seleccionar al menos un rol'
};

export const USERNAME_VALIDATION = {
  REQUIRED_MESSAGE: 'El nombre de usuario es obligatorio',
  MIN_LENGTH_MESSAGE: 'El nombre de usuario debe tener al menos 4 caracteres',
  MAX_LENGTH_MESSAGE: 'El nombre de usuario no debe exceder los 20 caracteres',
  PATTERN_MESSAGE: 'El nombre de usuario solo puede contener letras, números y guiones bajos',
  DUPLICATE_MESSAGE: 'Este nombre de usuario ya está registrado'
};
