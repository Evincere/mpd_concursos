import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimateDirective } from './animate.directive';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AnimateDirective
  ],
  exports: [
    AnimateDirective
  ]
})
export class AnimationDirectivesModule { }
