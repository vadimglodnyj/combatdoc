import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { LayoutComponent } from './core/layout/layout.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      { path: '', redirectTo: 'members', pathMatch: 'full' },
      {
        path: 'members',
        loadChildren: () =>
          import('./features/members/members.module').then((m) => m.MembersModule),
      },
      {
        path: 'episodes',
        loadChildren: () =>
          import('./features/episodes/episodes.module').then((m) => m.EpisodesModule),
      },
      {
        path: 'consultations',
        loadChildren: () =>
          import('./features/consultations/consultations.module').then(
            (m) => m.ConsultationsModule,
          ),
      },
      {
        path: 'segments',
        loadChildren: () =>
          import('./features/segments/segments.module').then((m) => m.SegmentsModule),
      },
      {
        path: 'control',
        loadChildren: () =>
          import('./features/control/control.module').then((m) => m.ControlModule),
      },
      {
        path: 'tasks',
        loadChildren: () =>
          import('./features/tasks/tasks.module').then((m) => m.TasksModule),
      },
      {
        path: 'import',
        loadChildren: () =>
          import('./features/import/import.module').then((m) => m.ImportModule),
      },
      {
        path: 'documents',
        loadChildren: () =>
          import('./features/documents/documents.module').then((m) => m.DocumentsModule),
      },
      {
        path: 'payments',
        loadChildren: () =>
          import('./features/payments/payments.module').then((m) => m.PaymentsModule),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
