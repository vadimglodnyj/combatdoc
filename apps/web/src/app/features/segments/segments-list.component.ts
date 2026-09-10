import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ClinicalService } from '../../core/services/clinical.service';
import { CareSegment } from '../../core/models/service-member.model';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { careSegmentLabel, CARE_SEGMENT_TYPES } from '../../core/utils/clinical-labels';

@Component({
  selector: 'app-segments-list',
  templateUrl: './segments-list.component.html',
})
export class SegmentsListComponent implements OnInit {
  items: CareSegment[] = [];
  loading = false;
  searchValue = '';
  typeFilter = '';
  activeFilter: '' | 'true' | 'false' = '';
  page = 1;
  pageSize = 30;
  total = 0;

  constructor(
    private clinicalService: ClinicalService,
    private router: Router,
    private message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.clinicalService
      .listSegments({
        search: this.searchValue.trim() || undefined,
        type: this.typeFilter || undefined,
        active: this.activeFilter === '' ? undefined : this.activeFilter === 'true',
        page: this.page,
        take: this.pageSize,
      })
      .subscribe({
        next: (response) => {
          this.items = response.items;
          this.total = response.total;
          this.page = response.page;
          this.loading = false;
        },
        error: () => {
          this.message.error('Помилка завантаження сегментів');
          this.loading = false;
        },
      });
  }

  onSearch(): void {
    this.page = 1;
    this.load();
  }

  onFilterChange(): void {
    this.page = 1;
    this.load();
  }

  onPageIndexChange(page: number): void {
    this.page = page;
    this.load();
  }

  open(item: CareSegment): void {
    this.router.navigate(['/episodes', item.episodeId]);
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return format(new Date(date), 'dd.MM.yyyy', { locale: uk });
  }

  memberName(item: CareSegment): string {
    const member = item.episode?.serviceMember;
    if (!member) return '—';
    return `${member.lastName} ${member.firstName} ${member.middleName}`.trim();
  }

  typeLabel = careSegmentLabel;
  types = CARE_SEGMENT_TYPES;
}
