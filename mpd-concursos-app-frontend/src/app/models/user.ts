import { JwtDto } from './jwt-dto';

export class User {
    id?: number;
    username: string;
    email: string;
    password?: string;
    nombre: string;
    apellido: string;
    dni: string;
    jwtDto?: JwtDto;

    constructor(
        username: string = '',
        email: string = '',
        nombre: string = '',
        apellido: string = '',
        dni: string = '',
        id?: number,
        password?: string,
        jwtDto?: JwtDto
    ) {
        this.username = username;
        this.email = email;
        this.nombre = nombre;
        this.apellido = apellido;
        this.dni = dni;
        this.id = id;
        this.password = password;
        this.jwtDto = jwtDto;
    }
}
