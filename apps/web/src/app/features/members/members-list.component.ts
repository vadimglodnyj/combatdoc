import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServiceMemberService } from '../../core/services/service-member.service';
import { ServiceMember } from '../../core/models/service-member.model';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { MemberFormComponent } from './member-form.component';

@Component({
  selector: 'app-members-list',
  templateUrl: './members-list.component.html',
  styleUrls: ['./members-list.component.scss'],
})
export class MembersListComponent implements OnInit {
  members: ServiceMember[] = [];
  loading = false;
  searchValue = '';
  isDesktop = window.innerWidth >= 768;

  constructor(
    private serviceMemberService: ServiceMemberService,
    private router: Router,
    private modal: NzModalService,
    private message: NzMessageService,
  ) {
    window.addEventListener('resize', () => {
      this.isDesktop = window.innerWidth >= 768;
    });
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading = true;
    this.serviceMemberService.getAll(this.searchValue).subscribe({
      next: (data) => {
        this.members = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading members:', err);
        if (err?.status === 401) {
          this.message.warning('Потрібен вхід. Використовуйте admin@combatdoc.local / admin123');
        } else {
          this.message.error('Помилка завантаження даних');
        }
        this.loading = false;
      },
    });
  }

  onSearch(): void {
    this.loadMembers();
  }

  openCreateModal(): void {
    const modal = this.modal.create({
      nzTitle: 'Додати військовослужбовця',
      nzContent: MemberFormComponent,
      nzWidth: 800,
      nzFooter: null,
    });

    modal.afterClose.subscribe((result) => {
      if (result) {
        this.loadMembers();
      }
    });
  }

  openEditModal(member: ServiceMember): void {
    const modal = this.modal.create({
      nzTitle: 'Редагувати картку',
      nzContent: MemberFormComponent,
      nzData: { member },
      nzWidth: 800,
      nzFooter: null,
    });

    modal.afterClose.subscribe((result) => {
      if (result) {
        this.loadMembers();
      }
    });
  }

  deleteMember(member: ServiceMember): void {
    this.serviceMemberService.delete(member.id).subscribe({
      next: () => {
        this.message.success('Картку видалено');
        this.loadMembers();
      },
      error: (err) => {
        this.message.error(err.error?.message || 'Помилка видалення');
      },
    });
  }

  viewDetail(member: ServiceMember): void {
    this.router.navigate(['/members', member.id]);
  }

  getFullName(member: ServiceMember): string {
    return `${member.lastName} ${member.firstName} ${member.middleName}`;
  }

  getActiveEpisode(member: ServiceMember): string {
    const active = member.episodes?.find((e) => e.isActive);
    return active ? active.diagnosis : 'Немає активних епізодів';
  }

  getNatureColor(nature: string): string {
    return nature === 'COMBAT' ? 'red' : 'blue';
  }
}
