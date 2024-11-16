export class JwtDto {
    token: string;
    type: string;
    username: string;
    authorities: { authority: string }[];

    constructor(token: string = '', type: string = 'Bearer', username: string = '', authorities: { authority: string }[] = []) {
        this.token = token;
        this.type = type;
        this.username = username;
        this.authorities = authorities;
    }
} 