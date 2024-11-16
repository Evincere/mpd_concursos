
import { Component } from '@angular/core';
import { NavbarComponent } from './navbar/navbar.component';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    NavbarComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  imgname = 'assets/img/logo.png';
}
