import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ClinicalService } from '../../core/services/clinical.service';
import { Consultation } from '../../core/models/service-member.model';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  consultationKindLabel,
  consultationStatusColor,
  consultationStatusLabel,
} from '../../core/utils/clinical-labels';

@Component({
  selector: 'app-consultations-list',
  templateUrl: './consultations-list.component.html',
})
export class ConsultationsListComponent implements OnInit {
  items: Consultation[] = [];
  loading = false;
  searchValue = '';
  statusFilter: '' | 'PLANNED' | 'DONE' | 'CANCELLED' = '';
  onDate: Date | null = null;
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
      .listConsultations({
        search: this.searchValue.trim() || undefined,
        status: this.statusFilter || undefined,
        onDate: this.onDate ? format(this.onDate, 'yyyy-MM-dd') : undefined,
        includeUnscheduled: this.onDate ? true : undefined,
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
          this.message.error('Помилка завантаження консультацій');
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

  open(item: Consultation): void {
    this.router.navigate(['/episodes', item.episodeId]);
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return format(new Date(date), 'dd.MM.yyyy', { locale: uk });
  }

  memberName(item: Consultation): string {
    const member = item.episode?.serviceMember;
    if (!member) return '—';
    return `${member.lastName} ${member.firstName} ${member.middleName}`.trim();
  }

  kindLabel = consultationKindLabel;
  statusLabel = consultationStatusLabel;
  statusColor = consultationStatusColor;
}
