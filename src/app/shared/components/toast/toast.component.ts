import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="toastService.toasts().length > 0">
      <div
        *ngFor="let toast of toastService.toasts()"
        class="toast-item"
        [ngClass]="'toast-' + toast.type"
      >
        <div class="toast-icon">
          <i *ngIf="toast.type === 'success'" class="bi bi-check-circle-fill"></i>
          <i *ngIf="toast.type === 'warning'" class="bi bi-exclamation-triangle-fill"></i>
          <i *ngIf="toast.type === 'danger'" class="bi bi-x-circle-fill"></i>
          <i *ngIf="toast.type === 'info'" class="bi bi-info-circle-fill"></i>
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" (click)="toastService.remove(toast.id)">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
