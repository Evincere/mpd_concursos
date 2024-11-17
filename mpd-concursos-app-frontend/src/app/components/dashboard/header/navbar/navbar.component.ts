import { Component } from '@angular/core';
import { UserInfoComponent } from './user-info/user-info.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    UserInfoComponent
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  username = 'Usuario Ejemplo';
  cuit = '20-12345678-9';  
}
