import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';

import { EpisodesListComponent } from './episodes-list.component';
import { EpisodeDetailComponent } from './episode-detail.component';

const routes: Routes = [
  { path: '', component: EpisodesListComponent },
  { path: ':id', component: EpisodeDetailComponent },
];

@NgModule({
  declarations: [EpisodesListComponent, EpisodeDetailComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzSpaceModule,
    NzDescriptionsModule,
    NzAlertModule,
    NzUploadModule,
    NzModalModule,
    NzFormModule,
    NzRadioModule,
    NzInputModule,
    NzSpinModule,
    NzEmptyModule,
    NzDividerModule,
    NzPopconfirmModule,
  ],
})
export class EpisodesModule {}
