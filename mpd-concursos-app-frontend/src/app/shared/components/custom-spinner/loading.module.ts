import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomSpinnerComponent } from './custom-spinner.component';
import { LoadingOverlayComponent } from './loading-overlay.component';
import { LoadingService } from './loading.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    CustomSpinnerComponent,
    LoadingOverlayComponent
  ],
  exports: [
    CustomSpinnerComponent,
    LoadingOverlayComponent
  ],
  providers: [
    LoadingService
  ]
})
export class LoadingModule { }
