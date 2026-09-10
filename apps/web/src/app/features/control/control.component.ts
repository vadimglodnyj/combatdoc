import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { EpisodeService } from '../../core/services/episode.service';
import { ClinicalService } from '../../core/services/clinical.service';
import { CareSegment, Consultation, Episode } from '../../core/models/service-member.model';
import { careSegmentTitle, consultationDiagnosis, consultationKindLabel } from '../../core/utils/clinical-labels';

@Component({
  selector: 'app-control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.scss'],
})
export class ControlComponent implements OnInit {
  missingCerts: Episode[] = [];
  hospital: CareSegment[] = [];
  wounded: Episode[] = [];
  planned: Consultation[] = [];
  plannedDate: Date | null = new Date();
  longTerm: Episode[] = [];
  loading = false;
  hospitalLoading = false;
  woundedLoading = false;
  plannedLoading = false;
  remindLoading = false;
  longTermLoading = false;

  constructor(
    private episodeService: EpisodeService,
    private clinical: ClinicalService,
    private router: Router,
    private message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.loadMissingCerts();
    this.loadHospital();
    this.loadWounded();
    this.loadPlanned();
    this.loadLongTerm();
  }

  loadMissingCerts(): void {
    this.loading = true;
    this.episodeService.listMissing().subscribe({
      next: (response) => {
        this.missingCerts = response.data;
        this.loading = false;
      },
      error: () => {
        this.message.error('Помилка завантаження списку');
        this.loading = false;
      },
    });
  }

  loadHospital(): void {
    this.hospitalLoading = true;
    this.clinical.listSegments({ type: 'HOSP', active: true, take: 100 }).subscribe({
      next: (res) => {
        this.hospital = res.items;
        this.hospitalLoading = false;
      },
      error: () => (this.hospitalLoading = false),
    });
  }

  loadWounded(): void {
    this.woundedLoading = true;
    this.episodeService.findAll({ nature: 'COMBAT', isActive: true, take: 100 }).subscribe({
      next: (res) => {
        this.wounded = res.data;
        this.woundedLoading = false;
      },
      error: () => (this.woundedLoading = false),
    });
  }

  loadPlanned(): void {
    this.plannedLoading = true;
    this.clinical
      .listConsultations({
        status: 'PLANNED',
        take: 100,
        onDate: this.plannedDate ? format(this.plannedDate, 'yyyy-MM-dd') : undefined,
        includeUnscheduled: true,
      })
      .subscribe({
        next: (res) => {
          this.planned = res.items;
          this.plannedLoading = false;
        },
        error: () => (this.plannedLoading = false),
      });
  }

  remindPlanned(): void {
    this.remindLoading = true;
    this.clinical
      .remindPlanned({
        onDate: this.plannedDate ? format(this.plannedDate, 'yyyy-MM-dd') : undefined,
        includeUnscheduled: true,
      })
      .subscribe({
        next: (res) => {
          this.message.success(`Надіслано в Discord: ${res.sent}`);
          this.remindLoading = false;
        },
        error: () => {
          this.message.error('Не вдалося надіслати нагадування');
          this.remindLoading = false;
        },
      });
  }

  loadLongTerm(): void {
    this.longTermLoading = true;
    this.episodeService.findAll({ isActive: true, take: 100 }).subscribe({
      next: (res) => {
        this.longTerm = res.data.filter((item) => (item.continuousDays120 || 0) >= 90);
        this.longTermLoading = false;
      },
      error: () => (this.longTermLoading = false),
    });
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return format(new Date(date), 'dd.MM.yyyy', { locale: uk });
  }

  viewEpisode(episodeId: string): void {
    this.router.navigate(['/episodes', episodeId]);
  }

  memberName(member?: Episode['serviceMember']): string {
    if (!member) return '—';
    return `${member.lastName} ${member.firstName} ${member.middleName}`.trim();
  }

  getCertStatusColor(status?: string): string {
    if (!status) return 'default';
    switch (status) {
      case 'VERIFIED':
        return 'green';
      case 'PENDING':
        return 'gold';
      case 'MISSING':
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

  getDaysSinceStart(episode: Episode): number {
    const start = new Date(episode.startDate);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  segmentTitle = careSegmentTitle;
  kindLabel = consultationKindLabel;
  diagnosisOf = consultationDiagnosis;
}
