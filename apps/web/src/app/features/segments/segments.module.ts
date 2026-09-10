import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SegmentsListComponent } from './segments-list.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSelectModule } from 'ng-zorro-antd/select';

const routes: Routes = [{ path: '', component: SegmentsListComponent }];

@NgModule({
  declarations: [SegmentsListComponent],
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
    NzSelectModule,
  ],
})
export class SegmentsModule {}
