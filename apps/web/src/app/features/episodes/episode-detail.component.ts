import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EpisodeService } from '../../core/services/episode.service';
import { Episode, InjuryCertificate, Consultation, CareSegment } from '../../core/models/service-member.model';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { ConsultationFormComponent } from '../clinical/consultation-form.component';
import { SegmentFormComponent } from '../clinical/segment-form.component';
import { ClinicalService } from '../../core/services/clinical.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { formatUnitLabel } from '../../core/utils/format-unit';
import {
  careSegmentLabel,
  consultationKindLabel,
  consultationStatusColor,
  consultationStatusLabel,
  looksLikeConsultationTitle,
  segmentTypeFromTitle,
} from '../../core/utils/clinical-labels';

@Component({
  selector: 'app-episode-detail',
  templateUrl: './episode-detail.component.html',
  styleUrls: ['./episode-detail.component.scss'],
})
export class EpisodeDetailComponent implements OnInit {
  episode?: Episode;
  loading = false;
  uploadLoading = false;
  statusModalVisible = false;
  selectedStatus: 'VERIFIED' | 'REJECTED' = 'VERIFIED';
  rejectionReason = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private episodeService: EpisodeService,
    private clinical: ClinicalService,
    private message: NzMessageService,
    private modal: NzModalService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEpisode(id);
    }
  }

  loadEpisode(id: string): void {
    this.loading = true;
    this.episodeService.findOne(id).subscribe({
      next: (data) => {
        this.episode = data;
        this.loading = false;
      },
      error: () => {
        this.message.error('Помилка завантаження епізоду');
        this.loading = false;
        this.router.navigate(['/members']);
      },
    });
  }

  goBack(): void {
    if (this.episode?.serviceMemberId) {
      this.router.navigate(['/members', this.episode.serviceMemberId]);
    } else {
      this.router.navigate(['/members']);
    }
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return format(new Date(date), 'dd.MM.yyyy', { locale: uk });
  }

  formatUnit(): string {
    return formatUnitLabel(
      this.episode?.serviceMember?.unit,
      this.episode?.serviceMember?.unitShortName,
    );
  }

  get consultations(): Consultation[] {
    const nested = this.episode?.consultations || [];
    if (nested.length || !this.episode || !looksLikeConsultationTitle(this.episode.diagnosis)) {
      return nested;
    }
    return [
      {
        id: `from-episode-${this.episode.id}`,
        episodeId: this.episode.id,
        kind: 'VISIT',
        status: this.episode.isActive ? 'PLANNED' : 'DONE',
        facilityId: '',
        practitionerRoleId: '',
        completedDate: this.episode.endDate || this.episode.startDate,
        diagnosis: this.episode.diagnosis,
        notes: this.episode.diagnosis,
        createdAt: this.episode.createdAt,
        updatedAt: this.episode.updatedAt,
      },
    ];
  }

  get segments(): CareSegment[] {
    const nested = this.episode?.careSegments || [];
    if (nested.length || !this.episode) return nested;
    const type = segmentTypeFromTitle(this.episode.diagnosis);
    if (!type) return nested;
    return [
      {
        id: `from-episode-${this.episode.id}`,
        episodeId: this.episode.id,
        type: type as CareSegment['type'],
        dateFrom: this.episode.startDate,
        dateTo: this.episode.endDate,
        facilityId: '',
        diagnosis: this.episode.diagnosis,
        createdAt: this.episode.createdAt,
        updatedAt: this.episode.updatedAt,
      },
    ];
  }

  consultationKindLabel = consultationKindLabel;
  consultationStatusLabel = consultationStatusLabel;
  consultationStatusColor = consultationStatusColor;
  careSegmentLabel = careSegmentLabel;

  isReal(id?: string): boolean {
    return !!id && !id.startsWith('from-episode-');
  }

  get hasOpenSegment(): boolean {
    return this.openSegmentCount > 0;
  }

  get openSegmentCount(): number {
    return this.segments.filter((item) => this.isReal(item.id) && !item.dateTo).length;
  }

  openConsultationForm(consultation?: Consultation, complete = false): void {
    if (!this.episode) return;
    const ref = this.modal.create({
      nzTitle: consultation ? (complete ? 'Завершити консультацію' : 'Редагувати консультацію') : 'Нова консультація',
      nzContent: ConsultationFormComponent,
      nzData: { episodeId: this.episode.id, diagnosis: this.episode.diagnosis, consultation, complete },
      nzFooter: null,
      nzWidth: window.innerWidth < 768 ? '100%' : 640,
    });
    ref.afterClose.subscribe((ok) => ok && this.loadEpisode(this.episode!.id));
  }

  openSegmentForm(mode: 'open' | 'edit' | 'prolong' | 'transition' = 'open', segment?: CareSegment): void {
    if (!this.episode) return;
    const titles = {
      open: 'Відкрити сегмент',
      edit: 'Редагувати сегмент',
      prolong: 'Продовжити поліклініку',
      transition: 'Перехід на інший сегмент',
    };
    const ref = this.modal.create({
      nzTitle: titles[mode],
      nzContent: SegmentFormComponent,
      nzData: {
        episodeId: this.episode.id,
        diagnosis: this.episode.diagnosis,
        segment,
        mode,
      },
      nzFooter: null,
      nzWidth: window.innerWidth < 768 ? '100%' : 640,
    });
    ref.afterClose.subscribe((ok) => ok && this.loadEpisode(this.episode!.id));
  }

  cancelConsultation(item: Consultation): void {
    this.clinical.cancelConsultation(item.id).subscribe({
      next: () => {
        this.message.success('Консультацію скасовано');
        this.loadEpisode(this.episode!.id);
      },
      error: (err) => this.message.error(err.error?.message || 'Помилка'),
    });
  }

  dispatchConsultation(item: Consultation): void {
    this.clinical.dispatchConsultation(item.id).subscribe({
      next: (res) => this.message.success(res.text || 'Подано в чат 2'),
      error: (err) => this.message.error(err.error?.message || 'Помилка подачі'),
    });
  }

  closeSegment(item: CareSegment): void {
    this.clinical.closeSegment(item.id).subscribe({
      next: () => {
        this.message.success('Сегмент закрито');
        this.loadEpisode(this.episode!.id);
      },
      error: (err) => this.message.error(err.error?.message || 'Помилка'),
    });
  }

  dispatchSegment(item: CareSegment): void {
    this.clinical.dispatchSegment(item.id).subscribe({
      next: (res) => this.message.success(res.text || 'Подано в чати'),
      error: (err) => this.message.error(err.error?.message || 'Помилка подачі'),
    });
  }

  closeEpisode(): void {
    if (!this.episode) return;
    this.episodeService.close(this.episode.id).subscribe({
      next: () => {
        this.message.success('Епізод закрито');
        this.loadEpisode(this.episode!.id);
      },
      error: () => {
        this.message.error('Помилка закриття епізоду');
      },
    });
  }

  reopenEpisode(): void {
    if (!this.episode) return;
    this.episodeService.reopen(this.episode.id).subscribe({
      next: () => {
        this.message.success('Епізод відкрито повторно');
        this.loadEpisode(this.episode!.id);
      },
      error: () => {
        this.message.error('Помилка відкриття епізоду');
      },
    });
  }

  getNatureColor(nature: string): string {
    return nature === 'COMBAT' ? 'red' : 'blue';
  }

  getNatureLabel(nature: string): string {
    return nature === 'COMBAT' ? 'Бойова' : 'Небойова';
  }

  getActiveColor(isActive: boolean): string {
    return isActive ? 'green' : 'default';
  }

  getActiveLabel(isActive: boolean): string {
    return isActive ? 'Активний' : 'Завершений';
  }

  getCertStatusColor(status?: string): string {
    if (!status) return 'default';
    switch (status) {
      case 'VERIFIED':
        return 'green';
      case 'PENDING':
        return 'gold';
      case 'MISSING':
        return 'red';
      case 'REJECTED':
        return 'red';
      default:
        return 'default';
    }
  }

  getCertStatusLabel(status?: string): string {
    if (!status) return '—';
    switch (status) {
      case 'VERIFIED':
        return 'Підтверджено';
      case 'PENDING':
        return 'На перевірці';
      case 'MISSING':
        return 'Відсутня';
      case 'REJECTED':
        return 'Відхилено';
      default:
        return '—';
    }
  }

  getFileName(): string {
    if (!this.episode?.injuryCertificate?.filePath) return 'файл';
    const parts = this.episode.injuryCertificate.filePath.split('/');
    return parts[parts.length - 1] || 'файл';
  }

  // Certificate upload
  beforeUpload = (file: NzUploadFile): boolean => {
    if (!this.episode) return false;

    const isValidType =
      file.type === 'application/pdf' ||
      file.type === 'image/jpeg' ||
      file.type === 'image/jpg' ||
      file.type === 'image/png';

    if (!isValidType) {
      this.message.error('Можна завантажити тільки PDF або зображення (JPG, PNG)');
      return false;
    }

    const isLt10M = (file.size || 0) / 1024 / 1024 < 10;
    if (!isLt10M) {
      this.message.error('Файл повинен бути менше 10MB');
      return false;
    }

    this.uploadCertificate(file as any);
    return false;
  };

  uploadCertificate(file: File): void {
    if (!this.episode) return;

    this.uploadLoading = true;
    this.episodeService.uploadCertificate(this.episode.id, file).subscribe({
      next: () => {
        this.message.success('Довідку завантажено (статус: На перевірці)');
        this.uploadLoading = false;
        this.loadEpisode(this.episode!.id);
      },
      error: () => {
        this.message.error('Помилка завантаження довідки');
        this.uploadLoading = false;
      },
    });
  }

  openStatusModal(): void {
    this.selectedStatus = 'VERIFIED';
    this.rejectionReason = '';
    this.statusModalVisible = true;
  }

  closeStatusModal(): void {
    this.statusModalVisible = false;
  }

  updateCertStatus(): void {
    if (!this.episode) return;

    if (this.selectedStatus === 'REJECTED' && !this.rejectionReason) {
      this.message.warning('Вкажіть причину відхилення');
      return;
    }

    this.episodeService
      .updateCertStatus(this.episode.id, this.selectedStatus, this.rejectionReason)
      .subscribe({
        next: () => {
          this.message.success(
            `Статус довідки змінено на: ${this.getCertStatusLabel(this.selectedStatus)}`
          );
          this.statusModalVisible = false;
          this.loadEpisode(this.episode!.id);
        },
        error: () => {
          this.message.error('Помилка зміни статусу');
        },
      });
  }
}
