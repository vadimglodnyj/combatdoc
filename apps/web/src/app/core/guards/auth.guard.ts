import { Injectable } from '@angular/core';
import { Router, CanActivate, CanActivateChild } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  canActivate(): boolean {
    return this.allowOrLogin();
  }

  canActivateChild(): boolean {
    return this.allowOrLogin();
  }

  private allowOrLogin(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    this.authService.logout();
    void this.router.navigate(['/login'], { replaceUrl: true });
    return false;
  }
}
