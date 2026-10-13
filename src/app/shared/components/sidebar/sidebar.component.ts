import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="app-sidebar">
      <div class="sidebar-section-title">PHÂN HỆ NGHIỆP VỤ</div>
      <nav class="nav-menu">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <i class="bi bi-grid-1x2-fill"></i>
          <span>Tổng quan (Dashboard)</span>
        </a>

        <a routerLink="/projects" routerLinkActive="active" class="nav-item">
          <i class="bi bi-folder2-open"></i>
          <span>Quản lý Dự án (1. Quản lý)</span>
          <span class="badge badge-primary">{{ projectService.projects().length }}</span>
        </a>

        <a routerLink="/master-map" routerLinkActive="active" class="nav-item">
          <i class="bi bi-map-fill"></i>
          <span>Bản đồ Master GIS (3. Tài sản)</span>
        </a>

        <a routerLink="/acceptance-center" routerLinkActive="active" class="nav-item">
          <i class="bi bi-clipboard2-check-fill"></i>
          <span>Nghiệm thu & Khối lượng (5. Thanh toán)</span>
          <span class="badge badge-warning" *ngIf="pendingReportsCount > 0">{{ pendingReportsCount }}</span>
        </a>

        <a routerLink="/mobile-contractor" routerLinkActive="active" class="nav-item mobile-item">
          <i class="bi bi-phone-fill"></i>
          <span>Hiện trường Thợ (4. Mobile App)</span>
          <span class="badge badge-success">Mô phỏng</span>
        </a>
      </nav>

      <div class="sidebar-section-title">LỚP DỮ LIỆU TÀI SẢN (LAYERS)</div>
      <div class="layers-summary-list">
        <div *ngFor="let layer of projectService.layers()" class="layer-summary-pill">
          <div class="layer-indicator" [style.background-color]="layer.color"></div>
          <span class="layer-name">{{ layer.name }}</span>
          <span class="layer-count">{{ layer.totalCount }}</span>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="system-status">
          <span class="status-dot"></span>
          <span>Hệ thống trực tuyến (VN-2000)</span>
        </div>
        <div class="version-label">v2.4.0 • Enterprise GIS</div>
      </div>
    </aside>
  `,
  styles: [`
    .app-sidebar {
      width: 260px;
      background: #ffffff;
      border-right: 1px solid var(--gray-200);
      display: flex;
      flex-direction: column;
      height: calc(100vh - 64px);
      position: sticky;
      top: 64px;
      padding: 20px 16px;
      overflow-y: auto;
    }

    .sidebar-section-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--gray-400);
      letter-spacing: 0.06em;
      margin-bottom: 12px;
      padding-left: 12px;
    }

    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 28px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      color: var(--gray-600);
      font-weight: 500;
      font-size: 13.5px;
      text-decoration: none;
      transition: all 0.15s ease;

      i {
        font-size: 17px;
        color: var(--gray-400);
        transition: color 0.15s ease;
      }

      .badge {
        margin-left: auto;
        font-size: 11px;
        padding: 2px 7px;
      }

      &:hover {
        background: var(--gray-100);
        color: var(--gray-900);
        i { color: var(--primary-600); }
      }

      &.active {
        background: #eff6ff;
        color: var(--primary-700);
        font-weight: 600;

        i {
          color: var(--primary-600);
        }
      }

      &.mobile-item {
        margin-top: 8px;
        background: #f0fdf4;
        color: #166534;
        border: 1px dashed #86efac;

        i {
          color: #16a34a;
        }

        &.active {
          background: #dcfce7;
          border-style: solid;
        }
      }
    }

    .layers-summary-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 24px;
      padding: 4px;
    }

    .layer-summary-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: var(--gray-50);
      border-radius: 6px;
      border: 1px solid var(--gray-200);
      font-size: 12.5px;

      .layer-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }

      .layer-name {
        flex: 1;
        font-weight: 500;
        color: var(--gray-700);
      }

      .layer-count {
        font-size: 11.5px;
        color: var(--gray-500);
        font-weight: 600;
      }
    }

    .sidebar-footer {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid var(--gray-200);

      .system-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--gray-600);
        font-weight: 500;

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }
      }

      .version-label {
        margin-top: 4px;
        font-size: 11px;
        color: var(--gray-400);
      }
    }
  `]
})
export class SidebarComponent {
  projectService = inject(ProjectService);

  get pendingReportsCount(): number {
    return this.projectService.reports().filter(r => r.status === 'PENDING_INSPECTION').length;
  }
}
