import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { CustomFormFieldComponent } from './custom-form-field/custom-form-field.component';
import { CustomButtonComponent } from './custom-button/custom-button.component';
import { CustomSelectComponent } from './custom-select/custom-select.component';
import { CustomCardComponent } from './custom-card/custom-card.component';
import { CustomTabsComponent } from './custom-tabs/custom-tabs.component';
import { CustomTabComponent } from './custom-tabs/custom-tab.component';
import { CustomTableComponent } from './custom-table/custom-table.component';
import { CustomTableColumnComponent } from './custom-table/custom-table-column.component';
import { CustomDialogComponent } from './custom-dialog/custom-dialog.component';
import { CustomDialogService } from './custom-dialog/custom-dialog.service';
import { CustomMenuComponent } from './custom-menu/custom-menu.component';
import { CustomMenuItemComponent } from './custom-menu/custom-menu-item.component';
import { CustomMenuTriggerDirective } from './custom-menu/custom-menu-trigger.directive';
import { CustomDividerComponent } from './custom-divider/custom-divider.component';
import { CustomSpinnerComponent } from './custom-spinner/custom-spinner.component';
import { TooltipDirective } from '../../directives/tooltip.directive';

const COMPONENTS = [
  CustomFormFieldComponent,
  CustomButtonComponent,
  CustomSelectComponent,
  CustomCardComponent,
  CustomTabsComponent,
  CustomTabComponent,
  CustomTableComponent,
  CustomTableColumnComponent,
  CustomDialogComponent,
  CustomMenuComponent,
  CustomMenuItemComponent,
  CustomMenuTriggerDirective,
  CustomDividerComponent,
  CustomSpinnerComponent,
  TooltipDirective
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ...COMPONENTS
  ],
  exports: [
    ...COMPONENTS
  ],
  providers: [
    CustomDialogService
  ]
})
export class CustomFormModule { }
