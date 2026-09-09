import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ConsultationsListComponent } from './consultations-list.component';

const routes: Routes = [{ path: '', component: ConsultationsListComponent }];

@NgModule({
  declarations: [ConsultationsListComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class ConsultationsModule {}
