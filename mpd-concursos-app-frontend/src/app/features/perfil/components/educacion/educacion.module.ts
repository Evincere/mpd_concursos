import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { EducacionContainerComponent } from './educacion-container/educacion-container.component';

@NgModule({
  declarations: [
    EducacionContainerComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  exports: [
    EducacionContainerComponent
  ]
})
export class EducacionModule { }
