import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { ControlComponent } from './control.component';

const routes: Routes = [{ path: '', component: ControlComponent }];

@NgModule({
  declarations: [ControlComponent],
  imports: [CommonModule, RouterModule.forChild(routes), NzTabsModule],
})
export class ControlModule {}
