import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { EpisodesListComponent } from './episodes-list.component';

const routes: Routes = [{ path: '', component: EpisodesListComponent }];

@NgModule({
  declarations: [EpisodesListComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class EpisodesModule {}
