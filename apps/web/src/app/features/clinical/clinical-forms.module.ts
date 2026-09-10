import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { ConsultationFormComponent } from './consultation-form.component';
import { SegmentFormComponent } from './segment-form.component';

@NgModule({
  declarations: [ConsultationFormComponent, SegmentFormComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzSelectModule,
    NzDatePickerModule,
    NzInputModule,
    NzButtonModule,
    NzSpaceModule,
  ],
  exports: [ConsultationFormComponent, SegmentFormComponent],
})
export class ClinicalFormsModule {}
