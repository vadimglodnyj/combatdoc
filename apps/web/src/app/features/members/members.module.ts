import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

import { MembersListComponent } from './members-list.component';
import { MemberDetailComponent } from './member-detail.component';
import { MemberFormComponent } from './member-form.component';

const routes: Routes = [
  { path: '', component: MembersListComponent },
  { path: ':id', component: MemberDetailComponent },
];

@NgModule({
  declarations: [MembersListComponent, MemberDetailComponent, MemberFormComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    NzButtonModule,
    NzInputModule,
    NzIconModule,
    NzTagModule,
    NzCardModule,
    NzSpaceModule,
    NzModalModule,
    NzFormModule,
    NzSelectModule,
    NzDatePickerModule,
    NzPopconfirmModule,
    NzTabsModule,
    NzDividerModule,
    NzAlertModule,
    NzInputNumberModule,
    NzSpinModule,
    NzEmptyModule,
    NzRadioModule,
    NzPaginationModule,
  ],
})
export class MembersModule {}
