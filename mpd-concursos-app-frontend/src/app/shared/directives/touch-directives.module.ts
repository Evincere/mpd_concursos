import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TouchFriendlyDirective } from './touch-friendly.directive';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    TouchFriendlyDirective
  ],
  exports: [
    TouchFriendlyDirective
  ]
})
export class TouchDirectivesModule { }
