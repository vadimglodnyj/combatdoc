import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceMemberService } from '../../core/services/service-member.service';
import { ServiceMember } from '../../core/models/service-member.model';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { MemberFormComponent } from './member-form.component';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.scss'],
})
export class MemberDetailComponent implements OnInit {
  member?: ServiceMember;
  loading = false;
  selectedTab = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private serviceMemberService: ServiceMemberService,
    private message: NzMessageService,
    private modal: NzModalService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMember(id);
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
      nzWidth: 800,
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
    if (!this.member?.episodes) return 0;
    return this.member.episodes.filter((e) => e.isActive).length;
  }
}
