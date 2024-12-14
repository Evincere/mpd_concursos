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
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  userInfo: { username: string, cuit: string };

  constructor(private authService: AuthService) {
    this.userInfo = { username: '', cuit: '' };
  }

  ngOnInit(): void {
    const user = this.authService.getUser();
    const cuit = this.authService.getCuit();
    console.log('User Info:', { user, cuit });
    
    this.userInfo = {
      username: user?.username || '',
      cuit: cuit || ''
    };
  }

  onLogout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}
