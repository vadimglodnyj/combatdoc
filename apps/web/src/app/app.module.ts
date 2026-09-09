import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';
import { registerLocaleData } from '@angular/common';
import uk from '@angular/common/locales/uk';

import { uk_UA, NZ_I18N } from 'ng-zorro-antd/i18n';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import {
  ArrowLeftOutline,
  CalendarOutline,
  CarryOutOutline,
  CheckOutline,
  DashboardOutline,
  DeleteOutline,
  DollarOutline,
  DragOutline,
  EditOutline,
  EyeOutline,
  FileTextOutline,
  FileWordOutline,
  ImportOutline,
  InboxOutline,
  LinkOutline,
  LogoutOutline,
  MedicineBoxOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  PlusOutline,
  RedoOutline,
  SearchOutline,
  TeamOutline,
  UploadOutline,
} from '@ant-design/icons-angular/icons';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './features/login/login.component';
import { LayoutComponent } from './core/layout/layout.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

registerLocaleData(uk);

// Registered statically so icons resolve offline; NG-ZORRO otherwise fetches
// each SVG over HTTP, which 404s here and breaks the PWA offline case.
// Add an entry here whenever a new nzType is used in a template.
const icons: IconDefinition[] = [
  ArrowLeftOutline,
  CalendarOutline,
  CarryOutOutline,
  CheckOutline,
  DashboardOutline,
  DeleteOutline,
  DollarOutline,
  DragOutline,
  EditOutline,
  EyeOutline,
  FileTextOutline,
  FileWordOutline,
  ImportOutline,
  InboxOutline,
  LinkOutline,
  LogoutOutline,
  MedicineBoxOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  PlusOutline,
  RedoOutline,
  SearchOutline,
  TeamOutline,
  UploadOutline,
];

@NgModule({
  declarations: [AppComponent, LoginComponent, LayoutComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: true,
      registrationStrategy: 'registerWhenStable:30000',
    }),
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCardModule,
    NzTableModule,
    NzTagModule,
    NzMessageModule,
    NzSpinModule,
  ],
  providers: [
    { provide: NZ_I18N, useValue: uk_UA },
    { provide: LOCALE_ID, useValue: 'uk-UA' },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: NZ_ICONS, useValue: icons },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
