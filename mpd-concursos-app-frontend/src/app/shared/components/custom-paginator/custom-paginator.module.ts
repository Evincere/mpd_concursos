import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomPaginatorComponent } from './custom-paginator.component';

@NgModule({
  declarations: [CustomPaginatorComponent],
  imports: [CommonModule],
  exports: [CustomPaginatorComponent]
})
export class CustomPaginatorModule {} 