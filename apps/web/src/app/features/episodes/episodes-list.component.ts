import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { EpisodeService } from '../../core/services/episode.service';
import { Episode } from '../../core/models/service-member.model';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

@Component({
  selector: 'app-episodes-list',
  templateUrl: './episodes-list.component.html',
})
export class EpisodesListComponent implements OnInit {
  episodes: Episode[] = [];
  loading = false;
  searchValue = '';
  page = 1;
  pageSize = 30;
  total = 0;

  constructor(
    private episodeService: EpisodeService,
    private router: Router,
    private message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.episodeService
      .findAll({
        search: this.searchValue.trim() || undefined,
        skip: (this.page - 1) * this.pageSize,
        take: this.pageSize,
      })
      .subscribe({
        next: (response) => {
          this.episodes = response.data;
          this.total = response.total;
          this.loading = false;
        },
        error: () => {
          this.message.error('Помилка завантаження епізодів');
          this.loading = false;
        },
      });
  }

  onSearch(): void {
    this.page = 1;
    this.load();
  }

  onPageIndexChange(page: number): void {
    this.page = page;
    this.load();
  }

  viewEpisode(episode: Episode): void {
    this.router.navigate(['/episodes', episode.id]);
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return format(new Date(date), 'dd.MM.yyyy', { locale: uk });
  }

  memberName(episode: Episode): string {
    const member = episode.serviceMember;
    if (!member) return '—';
    return `${member.lastName} ${member.firstName} ${member.middleName}`.trim();
  }
}
