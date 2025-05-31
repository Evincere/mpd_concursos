import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IndexedDBService } from './indexed-db.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    IndexedDBService
  ]
})
export class StorageModule { }
