import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CuitFormatPipe } from '../../../../../shared/constants/pipes/cuit-format.pipe';
import { AuthService } from '../../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, CuitFormatPipe],
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss']
})
export class UserInfoComponent {
  private authService = inject(AuthService);
  
  protected readonly userInfo = this.authService.userInfo;
  
  protected readonly hasProfileImage = computed(() => {
    const profileImage = this.userInfo().profileImage;
    return !!profileImage && profileImage.trim().length > 0;
  });
}
