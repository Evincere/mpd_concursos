import { Component, Input } from '@angular/core';
import { CuitFormatPipe } from '../../../../../pipes/cuit-format.pipe';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CuitFormatPipe],
  templateUrl: './user-info.component.html',
  styleUrl: './user-info.component.scss'
})
export class UserInfoComponent {
  @Input() username!: string;
  @Input() cuit!: string;
}
