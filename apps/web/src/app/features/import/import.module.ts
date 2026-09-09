import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ImportComponent } from './import.component';

const routes: Routes = [{ path: '', component: ImportComponent }];

@NgModule({
  declarations: [ImportComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class ImportModule {}
