import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceMemberService } from '../../core/services/service-member.service';
import { EpisodeService } from '../../core/services/episode.service';
import { ServiceMember, Episode, CreateEpisodeDto, Consultation, CareSegment } from '../../core/models/service-member.model';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { MemberFormComponent } from './member-form.component';
import { ConsultationFormComponent } from '../clinical/consultation-form.component';
import { SegmentFormComponent } from '../clinical/segment-form.component';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { formatUnitLabel } from '../../core/utils/format-unit';
import {
  careSegmentTitle,
  consultationDiagnosis,
  consultationKindLabel,
  consultationStatusColor,
  consultationStatusLabel,
  looksLikeConsultationTitle,
  segmentTypeFromTitle,
} from '../../core/utils/clinical-labels';

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.scss'],
})
export class MemberDetailComponent implements OnInit {
  member?: ServiceMember;
  loading = false;
  selectedTab = 0;
  episodes: Episode[] = [];
  episodesLoading = false;
  
  // Episode form
  episodeModalVisible = false;
  episodeForm = {
    nature: 'SOMATIC' as 'COMBAT' | 'SOMATIC',
    diagnosis: '',
    startDate: new Date(),
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private serviceMemberService: ServiceMemberService,
    private episodeService: EpisodeService,
    private message: NzMessageService,
    private modal: NzModalService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMember(id);
      this.loadEpisodes(id);
    }
  }

  loadMember(id: string): void {
    this.loading = true;
    this.serviceMemberService.getOne(id).subscribe({
      next: (data) => {
        this.member = data;
        this.loading = false;
      },
      error: (err) => {
        this.message.error('Помилка завантаження картки');
        this.loading = false;
        this.router.navigate(['/members']);
      },
    });
  }

  openEditModal(): void {
    const modal = this.modal.create({
      nzTitle: 'Редагувати картку',
      nzContent: MemberFormComponent,
      nzData: { member: this.member },
      nzWidth: window.innerWidth < 768 ? '100%' : 720,
      nzFooter: null,
    });

    modal.afterClose.subscribe((result) => {
      if (result && this.member) {
        this.loadMember(this.member.id);
      }
    });
  }

  deleteMember(): void {
    if (!this.member) return;

    this.serviceMemberService.delete(this.member.id).subscribe({
      next: () => {
        this.message.success('Картку видалено');
        this.router.navigate(['/members']);
      },
      error: (err) => {
        this.message.error(err.error?.message || 'Помилка видалення');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/members']);
  }

  getFullName(): string {
    if (!this.member) return '';
    return `${this.member.lastName} ${this.member.firstName} ${this.member.middleName}`;
  }

  formatUnit(): string {
    return formatUnitLabel(this.member?.unit, this.member?.unitShortName);
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    try {
      return format(new Date(date), 'dd MMMM yyyy', { locale: uk });
    } catch {
      return '—';
    }
  }

  getAge(): number | null {
    if (!this.member?.birthDate) return null;
    const today = new Date();
    const birthDate = new Date(this.member.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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

  getActiveEpisodesCount(): number {
    return this.episodes.filter((e) => e.isActive).length;
  }

  get memberConsultations(): Consultation[] {
    const nested = this.episodes.flatMap((episode) =>
      (episode.consultations || []).map((item) => ({ ...item, episode })),
    );
    const synthetic = this.episodes
      .filter(
        (episode) =>
          looksLikeConsultationTitle(episode.diagnosis) && !(episode.consultations || []).length,
      )
      .map((episode) => ({
        id: `from-episode-${episode.id}`,
        episodeId: episode.id,
        kind: 'VISIT' as const,
        status: episode.isActive ? ('PLANNED' as const) : ('DONE' as const),
        facilityId: '',
        practitionerRoleId: '',
        completedDate: episode.endDate || episode.startDate,
        diagnosis: episode.diagnosis,
        notes: episode.diagnosis,
        episode,
        createdAt: episode.createdAt,
        updatedAt: episode.updatedAt,
      }));
    return [...nested, ...synthetic];
  }

  get memberSegments(): CareSegment[] {
    const nested = this.episodes.flatMap((episode) =>
      (episode.careSegments || []).map((item) => ({ ...item, episode })),
    );
    const synthetic: CareSegment[] = [];
    for (const episode of this.episodes) {
      if ((episode.careSegments || []).length) continue;
      const type = segmentTypeFromTitle(episode.diagnosis) as CareSegment['type'] | null;
      if (!type) continue;
      synthetic.push({
        id: `from-episode-${episode.id}`,
        episodeId: episode.id,
        type,
        dateFrom: episode.startDate,
        dateTo: episode.endDate,
        facilityId: '',
        diagnosis: episode.diagnosis,
        episode,
        createdAt: episode.createdAt,
        updatedAt: episode.updatedAt,
      });
    }
    return [...nested, ...synthetic];
  }

  consultationKindLabel = consultationKindLabel;
  consultationStatusLabel = consultationStatusLabel;
  consultationStatusColor = consultationStatusColor;
  consultationDiagnosis = consultationDiagnosis;
  careSegmentTitle = careSegmentTitle;

  private targetEpisode(): Episode | undefined {
    return this.episodes.find((item) => item.isActive) || this.episodes[0];
  }

  openConsultationForm(): void {
    const episode = this.targetEpisode();
    if (!episode) {
      this.message.warning('Спочатку створіть епізод');
      return;
    }
    const ref = this.modal.create({
      nzTitle: 'Нова консультація',
      nzContent: ConsultationFormComponent,
      nzData: { episodeId: episode.id, diagnosis: episode.diagnosis },
      nzFooter: null,
      nzWidth: window.innerWidth < 768 ? '100%' : 640,
    });
    ref.afterClose.subscribe((ok) => {
      if (ok && this.member) this.loadEpisodes(this.member.id);
    });
  }

  openSegmentForm(): void {
    const episode = this.targetEpisode();
    if (!episode) {
      this.message.warning('Спочатку створіть епізод');
      return;
    }
    const ref = this.modal.create({
      nzTitle: 'Відкрити сегмент',
      nzContent: SegmentFormComponent,
      nzData: { episodeId: episode.id, diagnosis: episode.diagnosis, mode: 'open' },
      nzFooter: null,
      nzWidth: window.innerWidth < 768 ? '100%' : 640,
    });
    ref.afterClose.subscribe((ok) => {
      if (ok && this.member) this.loadEpisodes(this.member.id);
    });
  }

  loadEpisodes(serviceMemberId: string): void {
    this.episodesLoading = true;
    this.episodeService.findAll({ serviceMemberId, take: 200 }).subscribe({
      next: (response) => {
        this.episodes = response.data;
        this.episodesLoading = false;
      },
      error: () => {
        this.message.error('Помилка завантаження епізодів');
        this.episodesLoading = false;
      },
    });
  }

  openEpisodeModal(): void {
    this.episodeForm = {
      nature: 'SOMATIC',
      diagnosis: '',
      startDate: new Date(),
    };
    this.episodeModalVisible = true;
  }

  closeEpisodeModal(): void {
    this.episodeModalVisible = false;
  }

  saveEpisode(): void {
    if (!this.member || !this.episodeForm.diagnosis) {
      this.message.warning('Заповніть діагноз');
      return;
    }

    const dto: CreateEpisodeDto = {
      serviceMemberId: this.member.id,
      nature: this.episodeForm.nature,
      diagnosis: this.episodeForm.diagnosis,
      startDate: format(this.episodeForm.startDate, 'yyyy-MM-dd'),
    };

    this.episodeService.create(dto).subscribe({
      next: () => {
        this.message.success('Епізод створено');
        this.episodeModalVisible = false;
        if (this.member) {
          this.loadEpisodes(this.member.id);
        }
      },
      error: () => {
        this.message.error('Помилка створення епізоду');
      },
    });
  }

  viewEpisode(episode: Episode): void {
    this.router.navigate(['/episodes', episode.id]);
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
}
