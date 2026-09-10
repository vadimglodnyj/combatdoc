import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EpisodeService } from '../../core/services/episode.service';
import { Episode, InjuryCertificate } from '../../core/models/service-member.model';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { formatUnitLabel } from '../../core/utils/format-unit';

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
    private message: NzMessageService
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
