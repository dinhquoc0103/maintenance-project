import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatrolService } from '../../core/services/patrol.service';
import { IssueWorkspaceComponent } from './components/issue-workspace/issue-workspace.component';
import { ScheduleCoordinatorComponent } from './components/schedule-coordinator/schedule-coordinator.component';
import { ConfigCatalogComponent } from './components/config-catalog/config-catalog.component';
import { MobilePatrolSimulatorComponent } from './components/mobile-patrol-simulator/mobile-patrol-simulator.component';
import { FlowGuideModalComponent } from './components/flow-guide-modal/flow-guide-modal.component';
import { PatrolJournalComponent } from './components/patrol-journal/patrol-journal.component';

@Component({
  selector: 'app-patrol',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IssueWorkspaceComponent,
    ScheduleCoordinatorComponent,
    PatrolJournalComponent,
    ConfigCatalogComponent,
    MobilePatrolSimulatorComponent,
    FlowGuideModalComponent
  ],
  template: `
    <div class="patrol-page-wrapper">
      <!-- HEADER PHÂN HỆ TUẦN KIỂM -->
      <header class="patrol-header">
        <div class="header-main-row">
          <div class="title-group">
            <div class="module-code-pill">
              <i class="bi bi-shield-check"></i>
              <span>PHÂN HỆ VII.2</span>
            </div>
            <h1 class="page-title">Tuần Kiểm Hạ Tầng Kỹ Thuật Đô Thị</h1>
            <p class="page-subtitle">
              Giám sát sự cố hiện trường thời gian thực, điều phối lịch trình tuần tra và kết nối Phân hệ Dự Án Duy Tu
            </p>
          </div>

          <!-- Top Action Buttons -->
          <div class="header-actions">
            <a routerLink="/field-portal" class="btn btn-warning d-flex align-items-center gap-2 text-dark fw-semibold">
              <i class="bi bi-person-workspace"></i>
              <span>Cổng Hiện Trường (Web Thợ)</span>
            </a>
            <button class="btn btn-outline-primary d-flex align-items-center gap-2" (click)="showGuideModal = true">
              <i class="bi bi-question-circle-fill text-primary"></i>
              <span>Hướng Dẫn Nghiệp Vụ Demo</span>
            </button>
            <button
              class="btn btn-success d-flex align-items-center gap-2"
              [class.active]="activeTab === 'MOBILE'"
              (click)="activeTab = 'MOBILE'"
            >
              <i class="bi bi-phone-fill"></i>
              <span>Mô Phỏng App Mobile</span>
            </button>
          </div>
        </div>

        <!-- KPI / STATS BAR -->
        <div class="patrol-stats-bar">
          <div class="stat-item" (click)="activeTab = 'WORKSPACE'">
            <div class="stat-icon icon-danger"><i class="bi bi-exclamation-triangle-fill"></i></div>
            <div class="stat-info">
              <span class="stat-label">Sự cố mới tiếp nhận</span>
              <strong class="stat-value text-danger">{{ newIssuesCount }} vụ</strong>
            </div>
          </div>

          <div class="stat-item" (click)="activeTab = 'WORKSPACE'">
            <div class="stat-icon icon-warning"><i class="bi bi-tools"></i></div>
            <div class="stat-info">
              <span class="stat-label">Đang khắc phục nhanh</span>
              <strong class="stat-value text-warning">{{ fixingIssuesCount }} vụ</strong>
            </div>
          </div>

          <div class="stat-item" (click)="activeTab = 'WORKSPACE'">
            <div class="stat-icon icon-purple"><i class="bi bi-folder-symlink-fill"></i></div>
            <div class="stat-info">
              <span class="stat-label">Đã gom sang Dự Án Duy Tu</span>
              <strong class="stat-value text-purple">{{ movedToProjectCount }} vụ</strong>
            </div>
          </div>

          <div class="stat-item" (click)="activeTab = 'SCHEDULE'">
            <div class="stat-icon icon-blue"><i class="bi bi-calendar3-check-fill"></i></div>
            <div class="stat-info">
              <span class="stat-label">Ca tuần tra hôm nay</span>
              <strong class="stat-value text-primary">{{ todaySchedulesCount }} ca trực</strong>
            </div>
          </div>

          <div class="stat-item" (click)="activeTab = 'JOURNAL'">
            <div class="stat-icon icon-emerald"><i class="bi bi-journal-bookmark-fill"></i></div>
            <div class="stat-info">
              <span class="stat-label">Sổ nhật ký tuần kiểm</span>
              <strong class="stat-value text-success">{{ inspectionCount }} ca hoàn tất</strong>
            </div>
          </div>
        </div>

        <!-- QUICK FLOW SUMMARY ALERT BANNER -->
        <div class="flow-summary-banner" *ngIf="showBanner">
          <div class="banner-left">
            <span class="banner-tag">Quy trình kết nối:</span>
            <span class="banner-step">1. Tiếp nhận sự cố từ App Mobile (GPS & ảnh)</span>
            <i class="bi bi-arrow-right text-muted"></i>
            <span class="banner-step">2. Cán bộ đánh giá trên Split View</span>
            <i class="bi bi-arrow-right text-muted"></i>
            <span class="banner-step highlight-step">
              <i class="bi bi-link-45deg"></i> &lt;Tạo Task Khắc Phục Nhanh&gt; HOẶC &lt;Chuyển Thành Dự Án Duy Tu (Map Asset_ID)&gt;
            </span>
          </div>
          <button class="btn btn-sm btn-ghost text-muted p-0" (click)="showBanner = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- MAIN NAVIGATION TABS -->
        <nav class="patrol-tabs-nav">
          <button
            class="tab-link"
            [class.active]="activeTab === 'WORKSPACE'"
            (click)="activeTab = 'WORKSPACE'"
          >
            <i class="bi bi-layout-split"></i>
            <span>Bàn Làm Việc Xử Lý Sự Cố (Split View)</span>
            <span class="tab-badge bg-danger" *ngIf="newIssuesCount > 0">{{ newIssuesCount }} mới</span>
          </button>

          <button
            class="tab-link"
            [class.active]="activeTab === 'SCHEDULE'"
            (click)="activeTab = 'SCHEDULE'"
          >
            <i class="bi bi-calendar-week-fill"></i>
            <span>Điều Phối & Lịch Trình (Calendar + Map)</span>
            <span class="tab-badge bg-primary">{{ todaySchedulesCount }} ca</span>
          </button>

          <!-- TAB MỚI: NHẬT KÝ TUẦN KIỂM (KẾT QUẢ ĐI TUẦN - 6 USE CASES) -->
          <button
            class="tab-link"
            [class.active]="activeTab === 'JOURNAL'"
            (click)="activeTab = 'JOURNAL'"
          >
            <i class="bi bi-journal-bookmark-fill text-primary"></i>
            <span>Nhật Ký Tuần Kiểm (Kết Quả Đi Tuần)</span>
            <span class="tab-badge bg-info text-dark">{{ inspectionCount }} ca</span>
          </button>

          <button
            class="tab-link"
            [class.active]="activeTab === 'CONFIG'"
            (click)="activeTab = 'CONFIG'"
          >
            <i class="bi bi-sliders2-vertical"></i>
            <span>Danh Mục Cấu Hình (Data Tables)</span>
          </button>

          <button
            class="tab-link"
            [class.active]="activeTab === 'MOBILE'"
            (click)="activeTab = 'MOBILE'"
          >
            <i class="bi bi-phone-fill"></i>
            <span>Mô Phỏng App Mobile Thực Địa</span>
            <span class="tab-badge bg-success">GPS Test</span>
          </button>
        </nav>
      </header>

      <!-- MAIN TAB CONTENT AREA -->
      <main class="patrol-content">
        <!-- TAB 1: BÀN LÀM VIỆC XỬ LÝ SỰ CỐ (SPLIT VIEW) -->
        <app-issue-workspace *ngIf="activeTab === 'WORKSPACE'"></app-issue-workspace>

        <!-- TAB 2: ĐIỀU PHỐI & LỊCH TRÌNH (CALENDAR + MAP) -->
        <app-schedule-coordinator *ngIf="activeTab === 'SCHEDULE'"></app-schedule-coordinator>

        <!-- TAB 3: NHẬT KÝ TUẦN KIỂM (UC 1 -> UC 6) -->
        <app-patrol-journal *ngIf="activeTab === 'JOURNAL'"></app-patrol-journal>

        <!-- TAB 4: DANH MỤC CẤU HÌNH (CRUD TABLES) -->
        <app-config-catalog *ngIf="activeTab === 'CONFIG'"></app-config-catalog>

        <!-- TAB 5: MÔ PHỎNG APP MOBILE -->
        <app-mobile-patrol-simulator
          *ngIf="activeTab === 'MOBILE'"
          (issueReported)="onIssueReportedFromMobile()"
        ></app-mobile-patrol-simulator>
      </main>

      <!-- MODAL HƯỚNG DẪN NGHIỆP VỤ & KỊCH BẢN DEMO -->
      <app-flow-guide-modal
        *ngIf="showGuideModal"
        (close)="showGuideModal = false"
      ></app-flow-guide-modal>
    </div>
  `,
  styles: [`
    .patrol-page-wrapper {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: calc(100vh - 64px);
    }

    .patrol-header {
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-lg);
      padding: 16px 20px 0 20px;
      box-shadow: var(--shadow-sm);
    }

    .header-main-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;

      .title-group {
        .module-code-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 700;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 4px;
          margin-bottom: 4px;
        }

        .page-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--gray-900);
          margin: 0;
        }

        .page-subtitle {
          font-size: 12.5px;
          color: var(--gray-500);
          margin: 2px 0 0 0;
        }
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }
    }

    /* STATS BAR */
    .patrol-stats-bar {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      padding-top: 8px;

      @media (max-width: 1200px) {
        grid-template-columns: repeat(3, 1fr);
      }
      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      .stat-item {
        background: #f8fafc;
        border: 1px solid var(--gray-200);
        border-radius: 8px;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          border-color: var(--primary-300);
          box-shadow: var(--shadow-sm);
          background: white;
        }

        .stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;

          &.icon-danger { background: #fee2e2; color: #dc2626; }
          &.icon-warning { background: #fef3c7; color: #d97706; }
          &.icon-purple { background: #f3e8ff; color: #7e22ce; }
          &.icon-blue { background: #dbeafe; color: #1e40af; }
        }

        .stat-info {
          display: flex;
          flex-direction: column;

          .stat-label {
            font-size: 11px;
            color: var(--gray-500);
            font-weight: 500;
          }

          .stat-value {
            font-size: 15px;
            font-weight: 700;
          }
        }
      }
    }

    /* FLOW SUMMARY ALERT BANNER */
    .flow-summary-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 8px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;

      .banner-left {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;

        .banner-tag {
          font-weight: 700;
          color: #166534;
        }

        .banner-step {
          color: var(--gray-700);
          font-weight: 500;

          &.highlight-step {
            color: #1d4ed8;
            font-weight: 700;
            background: #dbeafe;
            padding: 2px 8px;
            border-radius: 4px;
          }
        }
      }
    }

    /* NAVIGATION TABS */
    .patrol-tabs-nav {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--gray-200);

      .tab-link {
        padding: 10px 16px;
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        color: var(--gray-600);
        font-weight: 600;
        font-size: 13.5px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.15s ease;

        &:hover {
          color: var(--gray-900);
        }

        &.active {
          color: var(--primary-600);
          border-bottom-color: var(--primary-600);
        }

        .tab-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          color: white;
          font-weight: 700;
        }
      }
    }

    .patrol-content {
      flex: 1;
    }

    .text-purple { color: #7e22ce !important; }
  `]
})
export class PatrolComponent {
  patrolService = inject(PatrolService);

  activeTab: 'WORKSPACE' | 'SCHEDULE' | 'JOURNAL' | 'CONFIG' | 'MOBILE' = 'WORKSPACE';
  showGuideModal = false;
  showBanner = true;

  get inspectionCount(): number {
    return this.patrolService.inspectionRecords().length;
  }

  get newIssuesCount(): number {
    return this.patrolService.issues().filter(i => i.status === 'NEW').length;
  }

  get fixingIssuesCount(): number {
    return this.patrolService.issues().filter(i => i.status === 'QUICK_FIXING').length;
  }

  get movedToProjectCount(): number {
    return this.patrolService.issues().filter(i => i.status === 'MOVED_TO_PROJECT').length;
  }

  get todaySchedulesCount(): number {
    return this.patrolService.schedules().filter(s => s.date === '2026-10-13').length;
  }

  onIssueReportedFromMobile() {
    // Chuyển sang Tab Bàn Làm Việc để xem ngay sự cố mới xuất hiện
    this.activeTab = 'WORKSPACE';
  }
}
