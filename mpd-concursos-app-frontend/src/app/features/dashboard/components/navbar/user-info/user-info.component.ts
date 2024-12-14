import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CuitFormatPipe } from '../../../../../shared/constants/pipes/cuit-format.pipe';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, CuitFormatPipe],
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss']
})
export class UserInfoComponent {
  @Input() username!: string;
  @Input() cuit!: string;
}
