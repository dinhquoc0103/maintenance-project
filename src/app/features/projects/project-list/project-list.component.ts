import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import { MaintenanceType, ProjectStatus, Project } from '../../../core/models/maintenance.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Breadcrumb & Header -->
      <div class="page-header">
        <div>
          <div class="breadcrumb">
            <span>Hệ thống</span>
            <i class="bi bi-chevron-right"></i>
            <span class="active">Quản lý Dự án Duy tu & Bảo trì</span>
          </div>
          <h1 class="page-title">Danh sách Dự án Duy tu, Bảo trì Hạ tầng</h1>
          <p class="page-subtitle">Theo dõi vòng đời toàn bộ dự án từ Khởi tạo, Đang thi công tới Nghiệm thu quyết toán</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="exportReport()">
            <i class="bi bi-file-earmark-excel"></i>
            <span>Xuất Excel</span>
          </button>
          <button class="btn btn-primary" (click)="openCreateModal()">
            <i class="bi bi-plus-lg"></i>
            <span>Tạo dự án mới</span>
          </button>
        </div>
      </div>

      <!-- KPI Overview Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon icon-blue">
            <i class="bi bi-folder-check"></i>
          </div>
          <div class="kpi-info">
            <div class="kpi-value">{{ totalProjects }}</div>
            <div class="kpi-label">Tổng số dự án</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-amber">
            <i class="bi bi-gear-wide-connected"></i>
          </div>
          <div class="kpi-info">
            <div class="kpi-value">{{ inProgressProjects }}</div>
            <div class="kpi-label">Đang thi công</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-emerald">
            <i class="bi bi-patch-check"></i>
          </div>
          <div class="kpi-info">
            <div class="kpi-value">{{ completedProjects }}</div>
            <div class="kpi-label">Đã hoàn thành</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-indigo">
            <i class="bi bi-cash-stack"></i>
          </div>
          <div class="kpi-info">
            <div class="kpi-value">{{ totalBudgetFormatted }}</div>
            <div class="kpi-label">Tổng kinh phí dự toán</div>
          </div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-card">
        <div class="filter-row">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input
              type="text"
              class="form-control"
              placeholder="Tìm theo mã dự án, tên dự án, tuyến đường, nhà thầu..."
              [(ngModel)]="searchKeyword"
            />
            <button *ngIf="searchKeyword" class="clear-btn" (click)="searchKeyword = ''">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="filter-group">
            <label class="filter-label">Loại bảo trì:</label>
            <select class="form-select" [(ngModel)]="selectedType">
              <option value="ALL">Tất cả loại bảo trì</option>
              <option value="Đột xuất">Đột xuất</option>
              <option value="Định kỳ">Định kỳ</option>
              <option value="Khẩn cấp">Khẩn cấp</option>
              <option value="Sửa chữa thường xuyên">Sửa chữa thường xuyên</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Trạng thái:</label>
            <select class="form-select" [(ngModel)]="selectedStatus">
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Khởi tạo">Khởi tạo</option>
              <option value="Chuẩn bị">Chuẩn bị</option>
              <option value="Đang thi công">Đang thi công</option>
              <option value="Nghiệm thu">Nghiệm thu</option>
              <option value="Hoàn thành">Hoàn thành</option>
              <option value="Hủy">Hủy</option>
            </select>
          </div>

          <button class="btn btn-ghost" (click)="resetFilters()" title="Đặt lại bộ lọc">
            <i class="bi bi-arrow-counterclockwise"></i>
            <span>Đặt lại</span>
          </button>
        </div>
      </div>

      <!-- Projects Data Table (Master-Detail Entry) -->
      <div class="custom-table-container">
        <div class="table-meta-bar">
          <div class="result-count">
            Tìm thấy <strong>{{ filteredProjects().length }}</strong> dự án phù hợp
          </div>
          <div class="table-legend">
            <span class="legend-tip"><i class="bi bi-info-circle"></i> Nhấp vào hàng dự án để mở <strong>Trang Chi Tiết (5 Tab nghiệp vụ)</strong></span>
          </div>
        </div>

        <table class="custom-table">
          <thead>
            <tr>
              <th style="width: 120px;">Mã DA</th>
              <th>Tên Dự Án & Tuyến Đường</th>
              <th style="width: 140px;">Loại Bảo Trì</th>
              <th style="width: 170px;">Tiến Độ Khối Lượng</th>
              <th style="width: 140px;">Trạng Thái</th>
              <th style="width: 150px;">Dự Toán (VNĐ)</th>
              <th style="width: 140px;">Thời Gian</th>
              <th style="width: 100px; text-align: center;">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            <tr
              *ngFor="let p of filteredProjects()"
              class="clickable-row"
              (click)="goToDetail(p.id)"
            >
              <td>
                <span class="project-code-badge">{{ p.code }}</span>
              </td>
              <td>
                <div class="project-info-cell">
                  <span class="project-name">{{ p.name }}</span>
                  <div class="project-sub">
                    <span class="route-tag"><i class="bi bi-geo-alt"></i> {{ p.routeName }}</span>
                    <span class="contractor-tag"><i class="bi bi-building"></i> {{ p.contractor }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge" [ngClass]="getTypeBadgeClass(p.type)">
                  {{ p.type }}
                </span>
              </td>
              <td>
                <div class="progress-cell">
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill"
                      [style.width.%]="p.progressPercent"
                      [ngClass]="p.progressPercent === 100 ? 'fill-done' : 'fill-active'"
                    ></div>
                  </div>
                  <div class="progress-meta">
                    <span class="percent-text">{{ p.progressPercent }}%</span>
                    <span class="assets-count">({{ p.completedAssetsCount }}/{{ p.totalAssetsCount }} tài sản)</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge" [ngClass]="getStatusBadgeClass(p.status)">
                  <i class="bi bi-dot"></i> {{ p.status }}
                </span>
              </td>
              <td>
                <div class="budget-text">{{ formatMoney(p.budget) }} đ</div>
              </td>
              <td>
                <div class="date-range">
                  <div>{{ p.startDate | date:'dd/MM/yyyy' }}</div>
                  <div class="text-muted">đến {{ p.endDate | date:'dd/MM/yyyy' }}</div>
                </div>
              </td>
              <td style="text-align: center;" (click)="$event.stopPropagation()">
                <div class="table-action-btns">
                  <button
                    class="action-icon-btn"
                    title="Mở chi tiết dự án"
                    (click)="goToDetail(p.id)"
                  >
                    <i class="bi bi-arrow-right-circle-fill"></i>
                  </button>
                </div>
              </td>
            </tr>

            <tr *ngIf="filteredProjects().length === 0">
              <td colspan="8" class="empty-state">
                <i class="bi bi-inbox"></i>
                <p>Không tìm thấy dự án nào phù hợp với bộ lọc</p>
                <button class="btn btn-sm btn-secondary" (click)="resetFilters()">Xóa bộ lọc</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal: Tạo dự án mới -->
      <div class="modal-backdrop" *ngIf="isCreateModalOpen" (click)="closeCreateModal()">
        <div class="modal-content modal-md" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="bi bi-plus-circle text-primary"></i> Khởi Tạo Dự Án Duy Tu, Bảo Trì Mới</h3>
            <button class="close-btn" (click)="closeCreateModal()">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="submitCreateProject()">
              <div class="form-group mb-3">
                <label class="form-label required">Tên dự án duy tu, bảo trì:</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="VD: Duy tu hệ thống chiếu sáng và cắt tỉa cây xanh trục Hàm Nghi"
                  [(ngModel)]="newProject.name"
                  name="name"
                  required
                />
              </div>

              <div class="form-row mb-3">
                <div class="form-group flex-1">
                  <label class="form-label required">Loại bảo trì (Cấu hình danh mục):</label>
                  <select class="form-select" [(ngModel)]="newProject.type" name="type">
                    <option value="Đột xuất">Đột xuất</option>
                    <option value="Định kỳ">Định kỳ</option>
                    <option value="Khẩn cấp">Khẩn cấp</option>
                    <option value="Sửa chữa thường xuyên">Sửa chữa thường xuyên</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label required">Trạng thái vòng đời:</label>
                  <select class="form-select" [(ngModel)]="newProject.status" name="status">
                    <option value="Khởi tạo">Khởi tạo</option>
                    <option value="Chuẩn bị">Chuẩn bị</option>
                    <option value="Đang thi công">Đang thi công</option>
                  </select>
                </div>
              </div>

              <div class="form-group mb-3">
                <label class="form-label required">Tuyến đường / Khu vực thực hiện:</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="VD: Tuyến đường Hàm Nghi - Pasteur (Quận 1)"
                  [(ngModel)]="newProject.routeName"
                  name="routeName"
                  required
                />
              </div>

              <div class="form-row mb-3">
                <div class="form-group flex-1">
                  <label class="form-label required">Kinh phí dự toán (VNĐ):</label>
                  <input
                    type="number"
                    class="form-control"
                    placeholder="VD: 850000000"
                    [(ngModel)]="newProject.budget"
                    name="budget"
                    required
                  />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Đơn vị quản lý dự án:</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="newProject.managementUnit"
                    name="managementUnit"
                  />
                </div>
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Đơn vị nhà thầu thi công:</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="VD: Công ty CP Chiếu sáng & Cây xanh Sài Gòn"
                  [(ngModel)]="newProject.contractor"
                  name="contractor"
                />
              </div>

              <div class="form-row mb-3">
                <div class="form-group flex-1">
                  <label class="form-label required">Ngày bắt đầu:</label>
                  <input
                    type="date"
                    class="form-control"
                    [(ngModel)]="newProject.startDate"
                    name="startDate"
                    required
                  />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label required">Ngày kết thúc dự kiến:</label>
                  <input
                    type="date"
                    class="form-control"
                    [(ngModel)]="newProject.endDate"
                    name="endDate"
                    required
                  />
                </div>
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Mô tả mục tiêu dự án:</label>
                <textarea
                  class="form-control"
                  rows="3"
                  placeholder="Nhập thông tin mục tiêu, phạm vi duy tu..."
                  [(ngModel)]="newProject.description"
                  name="description"
                ></textarea>
              </div>

              <div class="modal-footer px-0 pb-0">
                <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Hủy</button>
                <button type="submit" class="btn btn-primary" [disabled]="!newProject.name || !newProject.budget">
                  <i class="bi bi-check-lg"></i>
                  <span>Lưu & Tạo dự án</span>
                </button>
              </div>
            </form>
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
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
      gap: 16px;

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12.5px;
        color: var(--gray-500);
        margin-bottom: 6px;

        .active {
          color: var(--primary-600);
          font-weight: 500;
        }

        i {
          font-size: 10px;
        }
      }

      .page-title {
        font-size: 22px;
        font-weight: 700;
        color: var(--gray-900);
      }

      .page-subtitle {
        font-size: 13.5px;
        color: var(--gray-500);
        margin-top: 4px;
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: #fff;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow-sm);

      .kpi-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;

        &.icon-blue {
          background: #eff6ff;
          color: #2563eb;
        }
        &.icon-amber {
          background: #fef3c7;
          color: #d97706;
        }
        &.icon-emerald {
          background: #ecfdf5;
          color: #059669;
        }
        &.icon-indigo {
          background: #ede9fe;
          color: #7c3aed;
        }
      }

      .kpi-info {
        .kpi-value {
          font-size: 20px;
          font-weight: 700;
          color: var(--gray-900);
          line-height: 1.2;
        }
        .kpi-label {
          font-size: 12.5px;
          color: var(--gray-500);
          margin-top: 4px;
        }
      }
    }

    /* Filter Bar */
    .filter-card {
      background: #fff;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      margin-bottom: 16px;
      box-shadow: var(--shadow-sm);

      .filter-row {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .search-box {
        position: relative;
        flex: 1;
        min-width: 280px;

        i {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-400);
        }

        input {
          padding-left: 36px;
          padding-right: 32px;
        }

        .clear-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: var(--gray-400);
          cursor: pointer;
        }
      }

      .filter-group {
        display: flex;
        align-items: center;
        gap: 8px;

        .filter-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--gray-600);
          white-space: nowrap;
        }

        select {
          min-width: 170px;
        }
      }
    }

    /* Data Table */
    .table-meta-bar {
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid var(--gray-200);
      display: flex;
      align-items: center;
      justify-content: space-between;

      .result-count {
        font-size: 13px;
        color: var(--gray-600);
      }

      .legend-tip {
        font-size: 12px;
        color: var(--primary-700);
        background: #eff6ff;
        padding: 4px 10px;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
    }

    .clickable-row {
      cursor: pointer;
      transition: background-color 0.15s ease;
      &:hover {
        background-color: #f1f5f9;
        .project-code-badge {
          background-color: var(--primary-600);
          color: white;
        }
      }
    }

    .project-code-badge {
      display: inline-block;
      font-weight: 700;
      font-size: 12px;
      color: var(--primary-700);
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 3px 8px;
      border-radius: 6px;
      transition: all 0.15s ease;
    }

    .project-info-cell {
      .project-name {
        font-weight: 600;
        color: var(--gray-900);
        font-size: 13.5px;
        display: block;
        margin-bottom: 4px;
      }

      .project-sub {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 12px;
        color: var(--gray-500);

        span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .progress-cell {
      .progress-bar-bg {
        width: 100%;
        height: 6px;
        background: var(--gray-200);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 4px;
      }

      .progress-bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;

        &.fill-active {
          background: linear-gradient(90deg, #3b82f6, #2563eb);
        }
        &.fill-done {
          background: #10b981;
        }
      }

      .progress-meta {
        display: flex;
        justify-content: space-between;
        font-size: 11.5px;

        .percent-text {
          font-weight: 600;
          color: var(--gray-800);
        }

        .assets-count {
          color: var(--gray-400);
        }
      }
    }

    .budget-text {
      font-weight: 600;
      color: #0f172a;
      font-size: 13.5px;
    }

    .date-range {
      font-size: 12px;
      line-height: 1.3;

      .text-muted {
        color: var(--gray-400);
      }
    }

    .table-action-btns {
      .action-icon-btn {
        background: transparent;
        border: none;
        color: var(--primary-600);
        font-size: 20px;
        cursor: pointer;
        transition: transform 0.15s ease;

        &:hover {
          transform: scale(1.15);
          color: var(--primary-700);
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 48px !important;
      color: var(--gray-400);

      i {
        font-size: 40px;
        display: block;
        margin-bottom: 8px;
      }
    }

    /* Modal Form Styles */
    .form-group {
      margin-bottom: 12px;
    }

    .form-row {
      display: flex;
      gap: 12px;
    }

    .flex-1 {
      flex: 1;
    }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--gray-700);
      margin-bottom: 6px;

      &.required::after {
        content: ' *';
        color: var(--danger-600);
      }
    }
  `]
})
export class ProjectListComponent {
  projectService = inject(ProjectService);
  toastService = inject(ToastService);
  router = inject(Router);

  searchKeyword = '';
  selectedType = 'ALL';
  selectedStatus = 'ALL';
  isCreateModalOpen = false;

  newProject: Partial<Project> = {
    name: '',
    type: 'Định kỳ',
    status: 'Khởi tạo',
    routeName: '',
    budget: 850000000,
    managementUnit: 'Ban QLDA Hạ tầng Kỹ thuật số 1',
    contractor: 'Công ty CP Chiếu sáng & Cây xanh Sài Gòn',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-08-31',
    description: ''
  };

  get totalProjects(): number {
    return this.projectService.projects().length;
  }

  get inProgressProjects(): number {
    return this.projectService.projects().filter(p => p.status === 'Đang thi công').length;
  }

  get completedProjects(): number {
    return this.projectService.projects().filter(p => p.status === 'Hoàn thành').length;
  }

  get totalBudgetFormatted(): string {
    const total = this.projectService.projects().reduce((sum, p) => sum + p.budget, 0);
    return (total / 1000000000).toFixed(1) + ' tỷ';
  }

  filteredProjects = computed(() => {
    let list = this.projectService.projects();

    if (this.searchKeyword.trim()) {
      const q = this.searchKeyword.toLowerCase().trim();
      list = list.filter(p =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.routeName.toLowerCase().includes(q) ||
        p.contractor.toLowerCase().includes(q)
      );
    }

    if (this.selectedType !== 'ALL') {
      list = list.filter(p => p.type === this.selectedType);
    }

    if (this.selectedStatus !== 'ALL') {
      list = list.filter(p => p.status === this.selectedStatus);
    }

    return list;
  });

  goToDetail(id: string) {
    this.router.navigate(['/projects', id]);
  }

  resetFilters() {
    this.searchKeyword = '';
    this.selectedType = 'ALL';
    this.selectedStatus = 'ALL';
  }

  openCreateModal() {
    this.isCreateModalOpen = true;
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
  }

  submitCreateProject() {
    if (!this.newProject.name || !this.newProject.budget) return;

    const created = this.projectService.createProject(this.newProject);
    this.toastService.success(
      'Khởi tạo thành công',
      `Dự án ${created.code} đã được đưa vào danh sách quản lý`
    );
    this.closeCreateModal();
    this.goToDetail(created.id);
  }

  exportReport() {
    this.toastService.info('Xuất báo cáo', 'Đang trích xuất danh sách dự án ra file Excel...');
  }

  getTypeBadgeClass(type: MaintenanceType): string {
    switch (type) {
      case 'Khẩn cấp': return 'badge-danger';
      case 'Định kỳ': return 'badge-primary';
      case 'Đột xuất': return 'badge-warning';
      case 'Sửa chữa thường xuyên': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  getStatusBadgeClass(status: ProjectStatus): string {
    switch (status) {
      case 'Đang thi công': return 'badge-warning';
      case 'Hoàn thành': return 'badge-success';
      case 'Nghiệm thu': return 'badge-primary';
      case 'Chuẩn bị': return 'badge-secondary';
      case 'Khởi tạo': return 'badge-secondary';
      case 'Hủy': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount);
  }
}
