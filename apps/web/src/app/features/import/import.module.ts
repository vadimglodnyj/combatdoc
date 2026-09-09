import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzDividerModule } from 'ng-zorro-antd/divider';

import { ImportComponent } from './import.component';

const routes: Routes = [{ path: '', component: ImportComponent }];

@NgModule({
  declarations: [ImportComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    NzCardModule,
    NzUploadModule,
    NzButtonModule,
    NzIconModule,
    NzTableModule,
    NzTagModule,
    NzAlertModule,
    NzCheckboxModule,
    NzResultModule,
    NzSwitchModule,
    NzSpaceModule,
    NzDividerModule,
  ],
})
export class ImportModule {}
