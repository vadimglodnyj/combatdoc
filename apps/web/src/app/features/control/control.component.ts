import { Component, OnInit } from '@angular/core';
import { EpisodeService } from '../../core/services/episode.service';
import { Episode } from '../../core/models/service-member.model';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

@Component({
  selector: 'app-control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.scss'],
})
export class ControlComponent implements OnInit {
  missingCerts: Episode[] = [];
  loading = false;

  constructor(
    private episodeService: EpisodeService,
    private router: Router,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadMissingCerts();
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

  formatDate(date?: string): string {
    if (!date) return '—';
    return format(new Date(date), 'dd.MM.yyyy', { locale: uk });
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

  getDaysSinceStart(episode: Episode): number {
    const start = new Date(episode.startDate);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
