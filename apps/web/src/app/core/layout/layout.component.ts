import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

const PAGE_TITLES: Record<string, string> = {
  '/members': 'Особовий склад',
  '/episodes': 'Епізоди',
  '/consultations': 'Консультації',
  '/segments': 'Сегменти лікування',
  '/control': 'Контроль',
  '/tasks': 'Задачі',
  '/documents': 'Документи',
  '/payments': 'Оплата',
  '/import': 'Імпорт даних',
};

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  isCollapsed = false;
  pageTitle = '';

  constructor(private router: Router) {
    this.pageTitle = this.resolveTitle(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.pageTitle = this.resolveTitle(event.urlAfterRedirects);
      });
  }

  private resolveTitle(url: string): string {
    const match = Object.keys(PAGE_TITLES).find((path) => url.startsWith(path));
    return match ? PAGE_TITLES[match] : '';
  }

  logout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }
}
