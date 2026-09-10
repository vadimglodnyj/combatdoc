import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { format, addDays } from 'date-fns';
import { CareSegmentWriteDto, ClinicalService } from '../../core/services/clinical.service';
import { DictionaryService, Facility } from '../../core/services/dictionary.service';
import { CareSegment } from '../../core/models/service-member.model';
import { CARE_SEGMENT_TYPES } from '../../core/utils/clinical-labels';

export interface SegmentFormData {
  episodeId: string;
  diagnosis?: string;
  segment?: CareSegment;
  mode?: 'open' | 'edit' | 'prolong' | 'transition';
}

@Component({
  selector: 'app-segment-form',
  templateUrl: './segment-form.component.html',
  styleUrls: ['../members/member-form.component.scss'],
})
export class SegmentFormComponent implements OnInit {
  readonly nzModalData = inject(NZ_MODAL_DATA, { optional: true }) as SegmentFormData | undefined;

  form!: FormGroup;
  loading = false;
  facilities: Facility[] = [];
  types = CARE_SEGMENT_TYPES;
  mode: 'open' | 'edit' | 'prolong' | 'transition' = 'open';
  segment?: CareSegment;

  constructor(
    private fb: FormBuilder,
    private modal: NzModalRef,
    private clinical: ClinicalService,
    private dictionaries: DictionaryService,
    private message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.segment = this.nzModalData?.segment;
    this.mode = this.nzModalData?.mode || (this.segment ? 'edit' : 'open');
    const defaultFrom =
      this.mode === 'transition' && this.segment?.type === 'HOSP'
        ? addDays(new Date(), 1)
        : new Date();

    this.form = this.fb.group({
      type: [this.segment?.type || 'HOSP', Validators.required],
      facilityId: [this.segment?.facilityId || null, Validators.required],
      dateFrom: [
        this.segment?.dateFrom && this.mode !== 'transition'
          ? new Date(this.segment.dateFrom)
          : defaultFrom,
        Validators.required,
      ],
      dateTo: [this.segment?.dateTo ? new Date(this.segment.dateTo) : null],
      durationDays: [30],
      documentNumber: [this.segment?.documentNumber || ''],
      diagnosis: [this.segment?.diagnosis || this.nzModalData?.diagnosis || ''],
      notes: [this.segment?.notes || ''],
    });

    this.dictionaries.getFacilities().subscribe((data) => (this.facilities = data));
  }

  setVlkDays(days: number): void {
    this.form.patchValue({ durationDays: days });
    const from = this.form.get('dateFrom')?.value || new Date();
    this.form.patchValue({ dateTo: addDays(from, days - 1) });
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
    const dto: CareSegmentWriteDto = {
      type: value.type,
      facilityId: value.facilityId,
      dateFrom: format(value.dateFrom, 'yyyy-MM-dd'),
      dateTo: value.dateTo ? format(value.dateTo, 'yyyy-MM-dd') : undefined,
      documentNumber: value.documentNumber || undefined,
      diagnosis: value.diagnosis || undefined,
      notes: value.notes || undefined,
    };
    if (this.mode === 'open' && !this.segment) {
      dto.episodeId = this.nzModalData?.episodeId;
    }

    this.loading = true;
    let request;
    if (this.mode === 'prolong' && this.segment) {
      if (!value.dateTo) {
        this.loading = false;
        this.message.warning('Вкажіть нову дату до');
        return;
      }
      request = this.clinical.prolongSegment(this.segment.id, format(value.dateTo, 'yyyy-MM-dd'));
    } else if (this.mode === 'transition' && this.segment) {
      request = this.clinical.transitionSegment(this.segment.id, dto);
    } else if (this.segment && this.mode === 'edit') {
      request = this.clinical.updateSegment(this.segment.id, dto);
    } else {
      request = this.clinical.createSegment(dto);
    }

    request.subscribe({
      next: () => {
        this.message.success('Сегмент збережено');
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
