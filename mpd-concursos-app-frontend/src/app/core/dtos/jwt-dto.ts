export class JwtDto {
    token: string;
    refreshToken: string;
    type: string;
    username: string;
    authorities: { authority: string }[];
    cuit: string;

    constructor(token: string = '', refreshToken: string = '', type: string = 'Bearer', username: string = '', authorities: { authority: string }[] = [], cuit: string) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.type = type;
        this.username = username;
        this.authorities = authorities;
        this.cuit = cuit;
    }
}