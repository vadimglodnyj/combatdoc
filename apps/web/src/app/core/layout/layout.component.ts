import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  isCollapsed = false;

  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }
}
