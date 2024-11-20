export interface NewUser {
    nombre: string;
    apellido: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    dni: string;
    cuit: string;
    roles: Set<string>;
  }