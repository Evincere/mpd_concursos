import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [],
  templateUrl: './user-info.component.html',
  styleUrl: './user-info.component.scss'
})
export class UserInfoComponent {
  @Input() username!: string;
  @Input() cuit!: string;
}
