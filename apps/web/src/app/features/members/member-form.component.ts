import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ServiceMemberService } from '../../core/services/service-member.service';
import { DictionaryService } from '../../core/services/dictionary.service';
import { ServiceMember, Rank, Unit } from '../../core/models/service-member.model';
import { formatUnitLabel } from '../../core/utils/format-unit';

@Component({
  selector: 'app-member-form',
  templateUrl: './member-form.component.html',
  styleUrls: ['./member-form.component.scss'],
})
export class MemberFormComponent implements OnInit {
  readonly nzModalData = inject(NZ_MODAL_DATA, { optional: true });
  
  form!: FormGroup;
  loading = false;
  ranks: Rank[] = [];
  units: Unit[] = [];
  member?: ServiceMember;

  constructor(
    private fb: FormBuilder,
    private modal: NzModalRef,
    private serviceMemberService: ServiceMemberService,
    private dictionaryService: DictionaryService,
    private message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.member = this.nzModalData?.member;
    this.loadDictionaries();
    this.buildForm();
  }

  buildForm(): void {
    this.form = this.fb.group({
      lastName: [this.member?.lastName || '', [Validators.required]],
      firstName: [this.member?.firstName || '', [Validators.required]],
      middleName: [this.member?.middleName || '', [Validators.required]],
      rankId: [this.member?.rankId || null, [Validators.required]],
      unitId: [this.member?.unitId || null, [Validators.required]],
      serviceType: [this.member?.serviceType || 'Контракт', [Validators.required]],
      fullPosition: [this.member?.fullPosition || '', [Validators.required]],
      unitShortName: [this.member?.unitShortName || ''],
      birthDate: [this.member?.birthDate ? new Date(this.member.birthDate) : null],
      phone: [this.member?.phone || ''],
      taxId: [this.member?.taxId || ''],
      recruitmentOffice: [this.member?.recruitmentOffice || ''],
      recruitmentDate: [
        this.member?.recruitmentDate ? new Date(this.member.recruitmentDate) : null,
      ],
      educationLevel: [this.member?.educationLevel || ''],
      educationInstitution: [this.member?.educationInstitution || ''],
      educationPlace: [this.member?.educationPlace || ''],
      educationYear: [this.member?.educationYear || null],
    });
  }

  loadDictionaries(): void {
    this.dictionaryService.getRanks().subscribe((data) => {
      this.ranks = data;
    });

    this.dictionaryService.getUnits().subscribe((data) => {
      this.units = data;
    });
  }

  formatUnitOption(unit: Unit): string {
    return formatUnitLabel(unit);
  }

  onUnitChange(unitId: string): void {
    const unit = this.units.find((u) => u.id === unitId);
    if (unit && !this.form.get('unitShortName')?.value) {
      this.form.patchValue({ unitShortName: unit.shortName || unit.name });
    }
  }

  submitForm(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((control) => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    this.loading = true;
    const formValue = { ...this.form.value };
    
    if (formValue.birthDate) {
      formValue.birthDate = formValue.birthDate.toISOString();
    }
    if (formValue.recruitmentDate) {
      formValue.recruitmentDate = formValue.recruitmentDate.toISOString();
    }

    const operation = this.member
      ? this.serviceMemberService.update(this.member.id, formValue)
      : this.serviceMemberService.create(formValue);

    operation.subscribe({
      next: () => {
        this.message.success(this.member ? 'Картку оновлено' : 'Картку створено');
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
