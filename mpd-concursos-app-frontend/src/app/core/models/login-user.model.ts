export class LoginUser {
    username: string;
    password: string;

    constructor(username: string = '', password: string = '') {
        this.username = username?.trim();
        this.password = password;
    }

    isValid(): boolean {
        return Boolean(this.username && this.password && this.username.length >= 3 && this.password.length >= 6);
    }

    toJSON() {
        return {
            username: this.username,
            password: this.password
        };
    }
}