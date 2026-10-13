import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="app-topbar">
      <div class="topbar-left">
        <div class="brand">
          <div class="brand-icon">
            <i class="bi bi-cone-striped"></i>
          </div>
          <div class="brand-text">
            <span class="brand-title">HẠ TẦNG ĐÔ THỊ GIS</span>
            <span class="brand-subtitle">Quản lý Dự án Duy tu & Bảo trì</span>
          </div>
        </div>
      </div>

      <div class="topbar-right">
        <!-- Role switcher toggle for demonstration -->
        <div class="role-switcher">
          <span class="role-label">Chế độ vai trò:</span>
          <button
            class="role-badge-btn"
            [ngClass]="projectService.activeRole() === 'OPERATOR' ? 'role-operator' : 'role-contractor'"
            (click)="toggleRole()"
            title="Bấm để chuyển đổi vai trò thử nghiệm"
          >
            <i [class]="projectService.activeRole() === 'OPERATOR' ? 'bi bi-shield-check' : 'bi bi-tools'"></i>
            <span>{{ projectService.activeRole() === 'OPERATOR' ? 'Cán bộ Ban QLDA (Duyệt/Quản lý)' : 'Nhà thầu Thi công (Báo cáo/Thợ)' }}</span>
            <i class="bi bi-arrow-repeat switch-icon"></i>
          </button>
        </div>

        <div class="topbar-actions">
          <a routerLink="/mobile-contractor" class="mobile-mode-pill" title="Mô phỏng Ứng dụng Di động Hiện trường">
            <i class="bi bi-phone"></i>
            <span>App Hiện trường</span>
          </a>

          <div class="user-profile">
            <img
              [src]="projectService.activeRole() === 'OPERATOR' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80'"
              alt="User"
              class="avatar"
            />
            <div class="user-info">
              <span class="name">{{ projectService.activeRole() === 'OPERATOR' ? 'KS. Hoàng Đình Hải' : 'Đội trưởng Nguyễn Văn Hùng' }}</span>
              <span class="role">{{ projectService.activeRole() === 'OPERATOR' ? 'Cán bộ giám sát QLDA 1' : 'Tổ thi công Sài Gòn' }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .app-topbar {
      height: 64px;
      background: #ffffff;
      border-bottom: 1px solid var(--gray-200);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;

      .brand-icon {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #1e40af, #3b82f6);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
      }

      .brand-text {
        display: flex;
        flex-direction: column;

        .brand-title {
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.04em;
          color: var(--gray-900);
        }

        .brand-subtitle {
          font-size: 11.5px;
          color: var(--gray-500);
          font-weight: 500;
        }
      }
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .role-switcher {
      display: flex;
      align-items: center;
      gap: 8px;

      .role-label {
        font-size: 12.5px;
        color: var(--gray-500);
      }

      .role-badge-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12.5px;
        font-weight: 600;
        border: 1px solid transparent;
        cursor: pointer;
        transition: all 0.2s ease;

        &.role-operator {
          background-color: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
          &:hover { background-color: #dbeafe; }
        }

        &.role-contractor {
          background-color: #fef3c7;
          color: #b45309;
          border-color: #fde68a;
          &:hover { background-color: #fde68a; }
        }

        .switch-icon {
          font-size: 11px;
          opacity: 0.7;
        }
      }
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .mobile-mode-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      border-radius: 20px;
      font-size: 12.5px;
      font-weight: 600;
      transition: all 0.15s ease;
      &:hover {
        background: #d1fae5;
        transform: translateY(-1px);
      }
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 10px;
      border-left: 1px solid var(--gray-200);
      padding-left: 16px;

      .avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #e2e8f0;
      }

      .user-info {
        display: flex;
        flex-direction: column;
        line-height: 1.25;

        .name {
          font-weight: 600;
          font-size: 13px;
          color: var(--gray-900);
        }

        .role {
          font-size: 11px;
          color: var(--gray-500);
        }
      }
    }
  `]
})
export class NavbarComponent {
  projectService = inject(ProjectService);
  toastService = inject(ToastService);

  toggleRole() {
    this.projectService.toggleRole();
    const newRole = this.projectService.activeRole();
    this.toastService.info(
      'Đã đổi vai trò thao tác',
      newRole === 'OPERATOR' ? 'Hiện tại: Cán bộ Ban QLDA (Quyền Duyệt/Nghiệm thu)' : 'Hiện tại: Nhà thầu thi công (Quyền Báo cáo/Hiện trường)'
    );
  }
}
