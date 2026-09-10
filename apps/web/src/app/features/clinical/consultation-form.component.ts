import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { format } from 'date-fns';
import { ClinicalService, ConsultationWriteDto } from '../../core/services/clinical.service';
import { DictionaryService, Facility, PractitionerRole } from '../../core/services/dictionary.service';
import { Consultation } from '../../core/models/service-member.model';
import { CARE_SEGMENT_TYPES } from '../../core/utils/clinical-labels';

export interface ConsultationFormData {
  episodeId: string;
  diagnosis?: string;
  consultation?: Consultation;
  complete?: boolean;
}

@Component({
  selector: 'app-consultation-form',
  templateUrl: './consultation-form.component.html',
  styleUrls: ['../members/member-form.component.scss'],
})
export class ConsultationFormComponent implements OnInit {
  readonly nzModalData = inject(NZ_MODAL_DATA, { optional: true }) as ConsultationFormData | undefined;

  form!: FormGroup;
  loading = false;
  facilities: Facility[] = [];
  roles: PractitionerRole[] = [];
  segmentTypes = CARE_SEGMENT_TYPES;
  consultation?: Consultation;
  completeMode = false;

  constructor(
    private fb: FormBuilder,
    private modal: NzModalRef,
    private clinical: ClinicalService,
    private dictionaries: DictionaryService,
    private message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.consultation = this.nzModalData?.consultation;
    this.completeMode = !!this.nzModalData?.complete;
    this.form = this.fb.group({
      kind: [this.consultation?.kind || 'VISIT', Validators.required],
      status: [
        this.completeMode ? 'DONE' : this.consultation?.status || 'PLANNED',
        Validators.required,
      ],
      facilityId: [this.consultation?.facilityId || null, Validators.required],
      practitionerRoleId: [this.consultation?.practitionerRoleId || null, Validators.required],
      scheduledDate: [
        this.consultation?.scheduledDate ? new Date(this.consultation.scheduledDate) : null,
      ],
      completedDate: [
        this.consultation?.completedDate
          ? new Date(this.consultation.completedDate)
          : this.completeMode
            ? new Date()
            : null,
      ],
      notes: [this.consultation?.notes || ''],
      diagnosis: [
        this.consultation?.diagnosis || this.nzModalData?.diagnosis || '',
        Validators.required,
      ],
      outcomeKind: ['NONE'],
      outcomeType: ['HOSP'],
      outcomeScheduledDate: [null],
      outcomeNotes: [''],
    });

    this.dictionaries.getFacilities().subscribe((data) => (this.facilities = data));
    this.dictionaries.getPractitionerRoles().subscribe((data) => (this.roles = data));
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((control) => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    const value = this.form.value;
    const dto: ConsultationWriteDto = {
      kind: value.kind,
      status: value.status,
      facilityId: value.facilityId,
      practitionerRoleId: value.practitionerRoleId,
      scheduledDate: value.scheduledDate ? format(value.scheduledDate, 'yyyy-MM-dd') : undefined,
      completedDate: value.completedDate ? format(value.completedDate, 'yyyy-MM-dd') : undefined,
      diagnosis: value.diagnosis || undefined,
      notes: value.notes || undefined,
      outcome:
        value.outcomeKind && value.outcomeKind !== 'NONE'
          ? {
              kind: value.outcomeKind,
              type: value.outcomeType,
              scheduledDate: value.outcomeScheduledDate
                ? format(value.outcomeScheduledDate, 'yyyy-MM-dd')
                : undefined,
              notes: value.outcomeNotes || undefined,
            }
          : undefined,
    };
    if (!this.consultation) {
      dto.episodeId = this.nzModalData?.episodeId;
    }

    this.loading = true;
    const request = this.consultation
      ? this.completeMode
        ? this.clinical.completeConsultation(this.consultation.id, dto)
        : this.clinical.updateConsultation(this.consultation.id, dto)
      : this.clinical.createConsultation(dto);

    request.subscribe({
      next: () => {
        this.message.success(this.consultation ? 'Консультацію збережено' : 'Консультацію створено');
        this.modal.close(true);
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err.error?.message || 'Помилка збереження');
      },
    });
  }

  cancel(): void {
    this.modal.close(false);
  }
}
