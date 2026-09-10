import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ConsultationsListComponent } from './consultations-list.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

const routes: Routes = [{ path: '', component: ConsultationsListComponent }];

@NgModule({
  declarations: [ConsultationsListComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    NzButtonModule,
    NzInputModule,
    NzTagModule,
    NzSpinModule,
    NzEmptyModule,
    NzPaginationModule,
  ],
})
export class ConsultationsModule {}
