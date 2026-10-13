import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <div class="breadcrumb">
            <span>Hệ thống</span>
            <i class="bi bi-chevron-right"></i>
            <span class="active">Tổng quan (Executive Dashboard)</span>
          </div>
          <h1 class="page-title">Hệ Thống Quản Lý Dự Án Duy Tu & Bảo Trì Hạ Tầng Đô Thị</h1>
          <p class="page-subtitle">Theo dõi tổng thể các dự án, tiến độ không gian GIS, phân công công việc và giải ngân quyết toán</p>
        </div>
        <div class="header-actions">
          <a routerLink="/projects" class="btn btn-primary">
            <i class="bi bi-folder2-open"></i>
            <span>Vào Quản lý Dự án</span>
          </a>
        </div>
      </div>

      <!-- Overview KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon icon-blue"><i class="bi bi-buildings"></i></div>
          <div class="kpi-info">
            <div class="kpi-value">{{ projectService.projects().length }}</div>
            <div class="kpi-label">Tổng dự án duy tu</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-amber"><i class="bi bi-geo-alt-fill"></i></div>
          <div class="kpi-info">
            <div class="kpi-value">{{ totalAssetsCount }}</div>
            <div class="kpi-label">Tài sản trong Master Map</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-emerald"><i class="bi bi-check2-circle"></i></div>
          <div class="kpi-info">
            <div class="kpi-value">{{ completedAssetsCount }}</div>
            <div class="kpi-label">Tài sản đã hoàn tất bảo trì</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-indigo"><i class="bi bi-cash-stack"></i></div>
          <div class="kpi-info">
            <div class="kpi-value">{{ totalBudgetFormatted }}</div>
            <div class="kpi-label">Tổng ngân sách duy tu</div>
          </div>
        </div>
      </div>

      <!-- 5 Key Business Modules Quick Access Grid -->
      <h3 class="section-heading mb-3"><i class="bi bi-diagram-3-fill text-primary"></i> 5 Khối Nghiệp Vụ Chính Trong Phân Hệ</h3>
      <div class="modules-grid mb-4">
        <a routerLink="/projects" class="module-card">
          <div class="module-num">1</div>
          <div class="module-content">
            <h4 class="title"><i class="bi bi-folder2"></i> Quản lý Dự án (Project Management)</h4>
            <p class="desc">Vòng đời Khởi tạo ➔ Đang thi công ➔ Hoàn thành. Cấu hình danh mục loại bảo trì, tiến độ. Giao diện Master-Detail.</p>
          </div>
        </a>

        <a [routerLink]="['/projects', 'p-1']" [queryParams]="{tab: 'docs'}" class="module-card">
          <div class="module-num">2</div>
          <div class="module-content">
            <h4 class="title"><i class="bi bi-files"></i> Quản lý Hồ sơ (Document Management)</h4>
            <p class="desc">Phân loại rõ 3 nhóm: Quyết định, Kế hoạch vốn, Giấy tờ liên quan. Upload, xem trực tiếp preview, tải file.</p>
          </div>
        </a>

        <a [routerLink]="['/projects', 'p-1']" [queryParams]="{tab: 'assets'}" class="module-card">
          <div class="module-num">3</div>
          <div class="module-content">
            <h4 class="title"><i class="bi bi-pin-map-fill"></i> Quản lý Tài sản (Asset Mapping)</h4>
            <p class="desc">Nhặt/Map từ Master Map (Quan hệ Many-to-Many). Inline status dropdown. Chọn theo tuyến, vẽ vùng polygon & tick chọn.</p>
          </div>
        </a>

        <a [routerLink]="['/projects', 'p-1']" [queryParams]="{tab: 'tasks'}" class="module-card">
          <div class="module-num">4</div>
          <div class="module-content">
            <h4 class="title"><i class="bi bi-list-task"></i> Quản lý Công việc & App Hiện trường</h4>
            <p class="desc">Chẻ nhỏ task đính kèm tài sản & lọc Layer. Inline dropdown trạng thái. Mobile Simulator highlight điểm task cho thợ chụp ảnh.</p>
          </div>
        </a>

        <a routerLink="/acceptance-center" class="module-card">
          <div class="module-num">5</div>
          <div class="module-content">
            <h4 class="title"><i class="bi bi-layout-split"></i> Tổng hợp Nghiệm thu & Thanh toán</h4>
            <p class="desc">Auto-fill báo cáo quét task đã xong & gom ảnh. Màn hình Nghiệm thu Split-view đối chiếu ảnh minh chứng & duyệt chi.</p>
          </div>
        </a>
      </div>

      <!-- Active Projects & Recent Field Photos -->
      <div class="dashboard-split-row">
        <!-- Active Projects List -->
        <div class="app-card flex-2">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="card-title"><i class="bi bi-hourglass-split text-primary"></i> Dự Án Đang Triển Khai Thi Công</h3>
            <a routerLink="/projects" class="fs-xs font-semibold">Xem tất cả <i class="bi bi-arrow-right"></i></a>
          </div>

          <div class="active-projects-list">
            <div *ngFor="let p of projectService.projects()" class="active-p-card" [routerLink]="['/projects', p.id]">
              <div class="p-header">
                <span class="p-code">{{ p.code }}</span>
                <span class="badge badge-primary">{{ p.type }}</span>
                <span class="badge" [class.badge-warning]="p.status === 'Đang thi công'" [class.badge-success]="p.status === 'Hoàn thành'" [class.badge-secondary]="p.status !== 'Đang thi công' && p.status !== 'Hoàn thành'">{{ p.status }}</span>
              </div>
              <div class="p-title">{{ p.name }}</div>
              <div class="p-route text-muted fs-xs"><i class="bi bi-geo-alt"></i> {{ p.routeName }}</div>
              <div class="p-progress mt-2">
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" [style.width.%]="p.progressPercent"></div>
                </div>
                <div class="d-flex justify-content-between fs-xs mt-1">
                  <span>Tiến độ: <strong>{{ p.progressPercent }}%</strong></span>
                  <span class="text-muted">{{ p.completedAssetsCount }}/{{ p.totalAssetsCount }} tài sản</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Layers & Field Activities -->
        <div class="app-card flex-1">
          <h3 class="card-title mb-3"><i class="bi bi-layers text-primary"></i> Thống Kê Theo Lớp Dữ Liệu</h3>
          <div class="layers-box">
            <div *ngFor="let layer of projectService.layers()" class="layer-kpi-row">
              <div class="layer-pill" [style.background-color]="layer.color">
                <i [class]="'bi ' + layer.icon"></i>
              </div>
              <div class="layer-name-wrap">
                <span class="name">{{ layer.name }}</span>
                <span class="code fs-xxs text-muted">{{ layer.code }}</span>
              </div>
              <div class="layer-count font-bold">{{ layer.totalCount }}</div>
            </div>
          </div>

          <div class="mt-4">
            <a routerLink="/mobile-contractor" class="btn btn-outline-primary w-100 mb-2">
              <i class="bi bi-phone"></i> Thử Nghiệm App Thợ Hiện Trường
            </a>
            <a routerLink="/master-map" class="btn btn-secondary w-100">
              <i class="bi bi-map"></i> Mở Master GIS Toàn Thành Phố
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12.5px;
        color: var(--gray-500);
        margin-bottom: 6px;
        .active { color: var(--primary-600); }
      }
      .page-title { font-size: 22px; font-weight: 700; }
      .page-subtitle { font-size: 13.5px; color: var(--gray-500); }
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      .kpi-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        &.icon-blue { background: #eff6ff; color: #2563eb; }
        &.icon-amber { background: #fef3c7; color: #d97706; }
        &.icon-emerald { background: #ecfdf5; color: #059669; }
        &.icon-indigo { background: #ede9fe; color: #7c3aed; }
      }
      .kpi-value { font-size: 20px; font-weight: 700; }
      .kpi-label { font-size: 12.5px; color: var(--gray-500); }
    }
    .section-heading { font-size: 16px; font-weight: 700; }
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }
    .module-card {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-md);
      padding: 16px;
      display: flex;
      gap: 14px;
      text-decoration: none;
      transition: all 0.2s ease;
      color: inherit;
      &:hover {
        border-color: var(--primary-500);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }
      .module-num {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #eff6ff;
        color: var(--primary-700);
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
      }
      .module-content {
        .title { font-size: 13.5px; font-weight: 600; color: var(--gray-900); margin-bottom: 4px; }
        .desc { font-size: 12px; color: var(--gray-500); line-height: 1.35; }
      }
    }
    .dashboard-split-row {
      display: flex;
      gap: 20px;
      .flex-2 { flex: 2; }
      .flex-1 { flex: 1; }
    }
    .active-projects-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .active-p-card {
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid var(--gray-200);
      background: #fafafa;
      cursor: pointer;
      transition: all 0.15s ease;
      &:hover {
        background: white;
        border-color: var(--primary-400);
        box-shadow: var(--shadow-sm);
      }
      .p-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
      .p-code { font-family: monospace; font-weight: 700; font-size: 12px; color: var(--primary-700); }
      .p-title { font-weight: 600; font-size: 13.5px; color: var(--gray-900); }
      .progress-bar-bg {
        height: 6px;
        background: var(--gray-200);
        border-radius: 3px;
        overflow: hidden;
        .progress-bar-fill { height: 100%; background: #2563eb; border-radius: 3px; }
      }
    }
    .layers-box {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .layer-kpi-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: var(--gray-50);
      border-radius: 6px;
      border: 1px solid var(--gray-200);
      .layer-pill {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }
      .layer-name-wrap {
        flex: 1;
        .name { font-size: 13px; font-weight: 600; display: block; }
      }
    }
  `]
})
export class DashboardComponent {
  projectService = inject(ProjectService);

  get totalAssetsCount(): number {
    return this.projectService.masterAssets().length;
  }

  get completedAssetsCount(): number {
    return this.projectService.masterAssets().filter(a => a.status === 'COMPLETED').length;
  }

  get totalBudgetFormatted(): string {
    const total = this.projectService.projects().reduce((s, p) => s + p.budget, 0);
    return (total / 1000000000).toFixed(1) + ' tỷ đ';
  }
}
