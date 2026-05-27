import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css'],
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  constructor(private auth: AuthService) {}

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  isResponsable(): boolean {
    return this.auth.getRole() === 'RESPONSABLE';
  }
}
