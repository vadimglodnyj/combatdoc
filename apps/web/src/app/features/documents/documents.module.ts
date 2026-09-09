import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DocumentsComponent } from './documents.component';

const routes: Routes = [{ path: '', component: DocumentsComponent }];

@NgModule({
  declarations: [DocumentsComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class DocumentsModule {}
