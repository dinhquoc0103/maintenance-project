import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';
import { ReportPayment, ReportItem } from '../../core/models/maintenance.model';

@Component({
  selector: 'app-acceptance-center',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <div class="breadcrumb">
            <span>Hệ thống</span>
            <i class="bi bi-chevron-right"></i>
            <span class="active">Nghiệm thu & Thanh toán</span>
          </div>
          <h1 class="page-title">Trung Tâm Nghiệm Thu & Khối Lượng Hoàn Thành</h1>
          <p class="page-subtitle">Kiểm tra hiện trường đối chiếu hình ảnh thực tế (Split-view) và phê duyệt đề nghị thanh toán từ nhà thầu</p>
        </div>
      </div>

      <!-- KPI Summary -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon icon-amber"><i class="bi bi-clock-history"></i></div>
          <div class="kpi-info">
            <div class="kpi-value">{{ pendingReports.length }}</div>
            <div class="kpi-label">Hồ sơ chờ kiểm tra</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon icon-emerald"><i class="bi bi-check-circle-fill"></i></div>
          <div class="kpi-info">
            <div class="kpi-value">{{ approvedReports.length }}</div>
            <div class="kpi-label">Đã phê duyệt nghiệm thu</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon icon-blue"><i class="bi bi-cash-stack"></i></div>
          <div class="kpi-info">
            <div class="kpi-value">{{ totalRequestedAmountFormatted }} đ</div>
            <div class="kpi-label">Tổng kinh phí đề nghị</div>
          </div>
        </div>
      </div>

      <!-- Reports List -->
      <div class="app-card">
        <h3 class="card-title mb-3"><i class="bi bi-receipt"></i> Tất Cả Đợt Đề Nghị Thanh Toán</h3>
        <div class="custom-table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th style="width: 130px;">Mã Đợt NT</th>
                <th>Dự Án Duy Tu & Tiêu Đề</th>
                <th style="width: 170px;">Đơn Vị Đề Nghị</th>
                <th style="width: 140px;">Khối Lượng</th>
                <th style="width: 160px;">Số Tiền Đề Nghị</th>
                <th style="width: 150px;">Trạng Thái</th>
                <th style="width: 110px;">Ngày Tạo</th>
                <th style="width: 140px; text-align: center;">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let rep of allReports">
                <td><span class="report-code-badge">{{ rep.code }}</span></td>
                <td>
                  <div class="font-semibold">{{ rep.periodTitle }}</div>
                  <div class="fs-xs text-primary"><i class="bi bi-folder2"></i> {{ rep.projectName }} ({{ rep.projectCode }})</div>
                </td>
                <td>{{ rep.contractor }}</td>
                <td><span class="badge badge-primary">{{ rep.totalCompletedAssets }} tài sản</span></td>
                <td><div class="text-danger font-bold">{{ formatMoney(rep.amountRequested) }} đ</div></td>
                <td>
                  <span
                    class="badge"
                    [class.badge-warning]="rep.status === 'PENDING_INSPECTION'"
                    [class.badge-success]="rep.status === 'APPROVED' || rep.status === 'PAID'"
                    [class.badge-danger]="rep.status === 'REJECTED'"
                  >
                    {{ rep.status === 'PENDING_INSPECTION' ? 'Chờ kiểm tra' : (rep.status === 'APPROVED' ? 'Đã duyệt' : (rep.status === 'PAID' ? 'Đã thanh toán' : 'Từ chối')) }}
                  </span>
                </td>
                <td>{{ rep.createdDate | date:'dd/MM/yyyy' }}</td>
                <td style="text-align: center;">
                  <button class="btn btn-sm btn-primary" (click)="openSplitView(rep)">
                    <i class="bi bi-layout-split"></i> Xem Split-view
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SPLIT-VIEW MODAL FOR ACCEPTANCE -->
      <div class="modal-backdrop" *ngIf="isSplitViewOpen && activeReport" (click)="closeSplitView()">
        <div class="modal-content modal-lg split-modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3><i class="bi bi-layout-split text-primary"></i> Nghiệm Thu Đối Chiếu Hiện Trường (Split-View)</h3>
              <div class="fs-xs text-muted">{{ activeReport.code }} • {{ activeReport.periodTitle }}</div>
            </div>
            <button class="close-btn" (click)="closeSplitView()"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="split-view-body">
            <!-- Left Pane: Assets List -->
            <div class="split-left-pane">
              <div class="pane-header">
                <strong>Danh sách tài sản hoàn thành ({{ activeReport.items.length }})</strong>
              </div>
              <div class="split-items-list">
                <div
                  *ngFor="let item of activeReport.items"
                  class="split-asset-item"
                  [class.active]="activeItem?.assetId === item.assetId"
                  (click)="activeItem = item"
                >
                  <div class="d-flex justify-content-between">
                    <span class="code font-mono font-bold">{{ item.assetCode }}</span>
                    <span class="badge" [class.badge-success]="item.inspectorApproved" [class.badge-warning]="!item.inspectorApproved">
                      {{ item.inspectorApproved ? '✓ Đạt' : 'Chờ duyệt' }}
                    </span>
                  </div>
                  <div class="font-semibold fs-sm">{{ item.assetName }}</div>
                  <div class="d-flex justify-content-between mt-1 fs-xs">
                    <span class="text-danger font-bold">{{ formatMoney(item.cost) }} đ</span>
                    <span class="text-muted">{{ item.completedDate }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Pane: Photo & GPS Inspection -->
            <div class="split-right-pane" *ngIf="activeItem">
              <div class="pane-header d-flex justify-content-between">
                <strong>Ảnh Hiện Trường & Tọa Độ GPS</strong>
                <span class="badge badge-primary">{{ activeItem.layerName }}</span>
              </div>
              <div class="photo-preview-wrap">
                <img [src]="activeItem.photoUrl" alt="Ảnh minh chứng" class="inspection-img" />
                <div class="photo-watermark">
                  <div><i class="bi bi-geo-alt-fill"></i> GPS: {{ activeItem.lat }}, {{ activeItem.lng }}</div>
                  <div><i class="bi bi-clock-fill"></i> Thời gian: {{ activeItem.completedDate }}</div>
                  <div><i class="bi bi-tag-fill"></i> Đối tượng: {{ activeItem.assetCode }} - {{ activeItem.assetName }}</div>
                </div>
              </div>

              <div class="meta-block mt-3">
                <div><strong>Hạng mục:</strong> {{ activeItem.taskTitle }}</div>
                <div><strong>Kinh phí đề nghị:</strong> <span class="text-danger font-bold">{{ formatMoney(activeItem.cost) }} đ</span></div>
                <div class="mt-2">
                  <label class="fs-xs font-semibold">Ghi chú kiểm tra cán bộ:</label>
                  <input type="text" class="form-control form-control-sm" [(ngModel)]="activeItem.inspectorNotes" placeholder="Nhận xét thực tế..." />
                </div>
                <div class="mt-3 d-flex gap-2">
                  <button class="btn btn-sm btn-success" (click)="toggleApproval(true)">
                    <i class="bi bi-check-circle"></i> Đạt Yêu Cầu
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="toggleApproval(false)">
                    <i class="bi bi-x-circle"></i> Chưa Đạt
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer d-flex justify-content-between">
            <button class="btn btn-secondary" (click)="closeSplitView()">Đóng</button>
            <button class="btn btn-success btn-lg" (click)="approveReport()">
              <i class="bi bi-check-circle-fill"></i> Phê Duyệt Toàn Bộ Đợt Thanh Toán
            </button>
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
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
        &.icon-amber { background: #fef3c7; color: #d97706; }
        &.icon-emerald { background: #ecfdf5; color: #059669; }
        &.icon-blue { background: #eff6ff; color: #2563eb; }
      }
      .kpi-value { font-size: 20px; font-weight: 700; }
      .kpi-label { font-size: 12.5px; color: var(--gray-500); }
    }
    .split-modal-dialog {
      max-width: 1200px !important;
      height: 85vh;
    }
    .split-view-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .split-left-pane {
      width: 440px;
      border-right: 1px solid var(--gray-200);
      display: flex;
      flex-direction: column;
      background: #fafafa;
      .pane-header { padding: 12px 16px; border-bottom: 1px solid var(--gray-200); background: #f1f5f9; }
      .split-items-list { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
    }
    .split-asset-item {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 6px;
      padding: 10px;
      cursor: pointer;
      &.active { border-color: var(--primary-600); background: #eff6ff; }
    }
    .split-right-pane {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      .pane-header { margin-bottom: 12px; }
    }
    .photo-preview-wrap {
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      background: #000;
      .inspection-img { width: 100%; height: 320px; object-fit: cover; }
      .photo-watermark {
        position: absolute;
        bottom: 0; left: 0; right: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.85));
        color: white;
        padding: 10px 14px;
        font-size: 11.5px;
        font-family: monospace;
      }
    }
    .report-code-badge { font-family: monospace; font-weight: 700; color: var(--primary-700); }
  `]
})
export class AcceptanceCenterComponent {
  projectService = inject(ProjectService);
  toastService = inject(ToastService);

  isSplitViewOpen = false;
  activeReport: ReportPayment | null = null;
  activeItem: ReportItem | null = null;

  get allReports(): ReportPayment[] {
    return this.projectService.reports();
  }

  get pendingReports(): ReportPayment[] {
    return this.allReports.filter(r => r.status === 'PENDING_INSPECTION');
  }

  get approvedReports(): ReportPayment[] {
    return this.allReports.filter(r => r.status === 'APPROVED' || r.status === 'PAID');
  }

  get totalRequestedAmountFormatted(): string {
    const total = this.allReports.reduce((s, r) => s + r.amountRequested, 0);
    return new Intl.NumberFormat('vi-VN').format(total);
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount);
  }

  openSplitView(report: ReportPayment) {
    this.activeReport = report;
    this.activeItem = report.items[0] || null;
    this.isSplitViewOpen = true;
  }

  closeSplitView() {
    this.isSplitViewOpen = false;
    this.activeReport = null;
    this.activeItem = null;
  }

  toggleApproval(approved: boolean) {
    if (!this.activeReport || !this.activeItem) return;
    this.projectService.approveReportItem(this.activeReport.id, this.activeItem.assetId, approved);
    this.activeItem.inspectorApproved = approved;
    this.toastService.info('Kiểm tra tài sản', `${this.activeItem.assetCode}: ${approved ? 'Đã duyệt đạt' : 'Yêu cầu sửa lại'}`);
  }

  approveReport() {
    if (!this.activeReport) return;
    this.projectService.finalizeReportApproval(this.activeReport.id, 'KS. Hoàng Đình Hải (Cán bộ Ban QLDA)');
    this.toastService.success('Phê duyệt thành công', `Đã duyệt thanh toán hồ sơ ${this.activeReport.code}`);
    this.closeSplitView();
  }
}
