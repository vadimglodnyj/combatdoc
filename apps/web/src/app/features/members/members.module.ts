import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { MembersListComponent } from './members-list.component';

const routes: Routes = [{ path: '', component: MembersListComponent }];

@NgModule({
  declarations: [MembersListComponent],
  imports: [CommonModule, RouterModule.forChild(routes), NzTableModule, NzButtonModule],
})
export class MembersModule {}
