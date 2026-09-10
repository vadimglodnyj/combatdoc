import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { ControlComponent } from './control.component';

const routes: Routes = [{ path: '', component: ControlComponent }];

@NgModule({
  declarations: [ControlComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NzTabsModule,
    NzTagModule,
    NzEmptyModule,
    NzSpinModule,
    NzAlertModule,
  ],
})
export class ControlModule {}
