import { JwtDto } from '../dtos/jwt-dto';

export class User {
    id?: number;
    username: string;
    email: string;
    password?: string;
    nombre: string;
    apellido: string;
    dni: string;
    jwtDto?: JwtDto;
    cuit: string;

    constructor(
        username: string = '',
        email: string = '',
        nombre: string = '',
        apellido: string = '',
        cuit: string = '',
        id?: number,
        password?: string,
        jwtDto?: JwtDto,
    ) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.nombre = nombre;
        this.apellido = apellido;
        this.password = password;
        this.jwtDto = jwtDto;
        this.cuit = cuit;
        this.dni = this.extraerDni(cuit);
    }

    private extraerDni(cuit: string): string {
        return cuit.slice(2, -1);
    }
}
