import { Component, OnInit } from '@angular/core';
import { UserInfoComponent } from './user-info/user-info.component';
import { AuthService } from '../../../../core/services/auth/auth.service';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    UserInfoComponent
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  userInfo: { username: string, cuit: string };

  constructor(private authService: AuthService) {
    this.userInfo = { username: '', cuit: '' };
  }

  ngOnInit(): void {
    this.userInfo = this.authService.getUserInfo();
  }

  onLogout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}
