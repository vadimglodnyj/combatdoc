import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SegmentsListComponent } from './segments-list.component';

const routes: Routes = [{ path: '', component: SegmentsListComponent }];

@NgModule({
  declarations: [SegmentsListComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class SegmentsModule {}
