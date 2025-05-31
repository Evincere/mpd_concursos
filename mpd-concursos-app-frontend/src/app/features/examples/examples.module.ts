import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FeedbackExamplesComponent } from './feedback-examples/feedback-examples.component';

const routes: Routes = [
  {
    path: 'feedback',
    component: FeedbackExamplesComponent
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class ExamplesModule { }
