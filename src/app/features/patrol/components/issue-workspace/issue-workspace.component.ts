import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import * as L from 'leaflet';
import { PatrolService } from '../../../../core/services/patrol.service';
import { ProjectService } from '../../../../core/services/project.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PatrolIssue, IssuePriority, IssueStatus } from '../../../../core/models/patrol.model';

@Component({
  selector: 'app-issue-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="workspace-container">
      <!-- CỘT TRÁI: DANH SÁCH SỰ CỐ TỪ MOBILE (42%) -->
      <div class="issues-list-pane">
        <!-- Filter Toolbar -->
        <div class="pane-header">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input
              type="text"
              class="form-control form-control-sm"
              placeholder="Tìm kiếm mã, tên sự cố, tuyến đường..."
              [(ngModel)]="searchKeyword"
            />
          </div>

          <div class="filters-row mt-2">
            <select class="form-select form-select-sm" [(ngModel)]="statusFilter">
              <option value="ALL">Tất cả trạng thái ({{ patrolService.issues().length }})</option>
              <option value="NEW">Mới báo về ({{ countByStatus('NEW') }})</option>
              <option value="REJECTED">Bị từ chối tiếp nhận ({{ countByStatus('REJECTED') }})</option>
              <option value="QUICK_FIXING">Đang khắc phục nhanh ({{ countByStatus('QUICK_FIXING') }})</option>
              <option value="RESOLVED">Đã hoàn thành / Nghiệm thu ({{ countByStatus('RESOLVED') }})</option>
              <option value="MOVED_TO_PROJECT">Đã gom vào Dự án Duy tu ({{ countByStatus('MOVED_TO_PROJECT') }})</option>
            </select>

            <select class="form-select form-select-sm" [(ngModel)]="priorityFilter">
              <option value="ALL">Mọi mức độ</option>
              <option value="URGENT">Khẩn cấp</option>
              <option value="HIGH">Cao</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="LOW">Thấp</option>
            </select>
          </div>

          <!-- Batch Action Bar khi có chọn nhiều -->
          <div class="batch-bar mt-2" *ngIf="selectedIssueIds.size > 0">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-primary">{{ selectedIssueIds.size }} đã chọn</span>
              <button class="btn btn-xs btn-primary d-flex align-items-center gap-1" (click)="openBatchProjectModal()">
                <i class="bi bi-folder-symlink-fill"></i>
                <span>Gom {{ selectedIssueIds.size }} sự cố thành Dự Án Duy Tu</span>
              </button>
            </div>
            <button class="btn btn-xs btn-link text-danger p-0" (click)="selectedIssueIds.clear()">Bỏ chọn</button>
          </div>

          <div class="d-flex justify-content-between align-items-center mt-2 px-1 text-muted fs-xs">
            <div class="form-check m-0">
              <input
                type="checkbox"
                class="form-check-input"
                id="selectAllIssues"
                [checked]="isAllSelected"
                (change)="toggleSelectAll()"
              />
              <label class="form-check-label" for="selectAllIssues">Chọn tất cả</label>
            </div>
            <span>Hiển thị {{ filteredIssues.length }} sự cố</span>
          </div>
        </div>

        <!-- Issue Cards Scroll List -->
        <div class="cards-scroll-container">
          <div
            *ngFor="let iss of filteredIssues"
            class="issue-card"
            [class.active]="iss.id === patrolService.selectedIssueId()"
            [class.urgent]="iss.priority === 'URGENT'"
            (click)="selectIssue(iss)"
          >
            <div class="card-top-row">
              <div class="d-flex align-items-center gap-2">
                <input
                  type="checkbox"
                  class="form-check-input m-0"
                  [disabled]="iss.status === 'REJECTED' || iss.status === 'MOVED_TO_PROJECT'"
                  [checked]="selectedIssueIds.has(iss.id)"
                  (click)="$event.stopPropagation()"
                  (change)="toggleSelectIssue(iss.id)"
                  [title]="iss.status === 'REJECTED' ? 'Sự cố bị từ chối không thể gom dự án' : ''"
                />
                <span class="issue-code">{{ iss.code }}</span>
                <span class="priority-pill" [ngClass]="'priority-' + iss.priority.toLowerCase()">
                  {{ getPriorityLabel(iss.priority) }}
                </span>
              </div>
              <span class="status-badge" [ngClass]="'status-' + iss.status.toLowerCase()">
                {{ getStatusLabel(iss.status) }}
              </span>
            </div>

            <div class="card-main-content">
              <img [src]="iss.photoBeforeUrl" alt="Hiện trường" class="thumb-photo" />
              <div class="info-content">
                <h4 class="issue-title">{{ iss.title }}</h4>
                <div class="meta-row text-muted fs-xs">
                  <i class="bi bi-geo-alt-fill text-danger"></i>
                  <span class="route-name">{{ iss.routeName }}</span>
                </div>
                <div class="meta-row text-muted fs-xs">
                  <i class="bi bi-clock-history"></i>
                  <span>{{ iss.reportedAt }}</span>
                  <span class="dot">•</span>
                  <span>{{ iss.reportedBy.name }}</span>
                </div>
              </div>
            </div>

            <!-- Mini linked tag if moved to project -->
            <div class="card-footer-pill" *ngIf="iss.projectLinkDetails">
              <i class="bi bi-link-45deg"></i>
              <span>Dự án: [{{ iss.projectLinkDetails.projectCode }}] {{ iss.projectLinkDetails.projectName }}</span>
            </div>
          </div>

          <div *ngIf="filteredIssues.length === 0" class="empty-state text-center p-4 text-muted">
            <i class="bi bi-inbox fs-2"></i>
            <p class="mt-2">Không tìm thấy sự cố tuần kiểm nào phù hợp với bộ lọc.</p>
          </div>
        </div>
      </div>

      <!-- CỘT PHẢI: CHI TIẾT SỰ CỐ & CỤM ACTION BUTTONS (58%) -->
      <div class="issue-detail-pane" *ngIf="currentIssue; else noSelection">
        <!-- Detail Header -->
        <div class="detail-header">
          <div class="d-flex justify-content-between align-items-start gap-3">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <span class="detail-code">{{ currentIssue.code }}</span>
                <span class="priority-pill" [ngClass]="'priority-' + currentIssue.priority.toLowerCase()">
                  {{ getPriorityLabel(currentIssue.priority) }}
                </span>
                <span class="status-badge" [ngClass]="'status-' + currentIssue.status.toLowerCase()">
                  {{ getStatusLabel(currentIssue.status) }}
                </span>
                <span class="layer-pill" [style.background-color]="getLayerColor(currentIssue.layerId) + '20'" [style.color]="getLayerColor(currentIssue.layerId)">
                  <i class="bi" [ngClass]="getLayerIcon(currentIssue.layerId)"></i>
                  {{ currentIssue.categoryName }}
                </span>
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle fs-xs" *ngIf="currentIssue.scheduleId" title="Sự cố phát hiện trong ca tuần tra">
                  <i class="bi bi-calendar-event me-1"></i>
                  Ca tuần: <strong>{{ currentIssue.scheduleId }}</strong>
                  <span *ngIf="currentIssue.routeName"> ({{ currentIssue.routeName }})</span>
                </span>
              </div>
              <h2 class="detail-title">{{ currentIssue.title }}</h2>
            </div>

            <!-- Action buttons header -->
            <div class="actions-header-group">
              <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" (click)="exportIssueExcel()">
                <i class="bi bi-file-earmark-excel-fill text-success"></i>
                <span>Xuất Excel</span>
              </button>
            </div>
          </div>

          <!-- PRIMARY ACTION BUTTONS (2 NÚT CHÍNH THEO NGHIỆP VỤ) -->
          <div class="primary-actions-box mt-3">
            <div class="actions-title">
              <i class="bi bi-lightning-charge-fill text-warning"></i>
              <span>QUYẾT ĐỊNH LUỒNG XỬ LÝ CỦA CÁN BỘ (ACTION BUTTONS):</span>
            </div>
            <div class="actions-buttons-grid">
              <!-- Nút 1: Khắc phục nhanh -->
              <button
                class="btn-action-flow btn-quick-fix"
                [disabled]="currentIssue.status === 'MOVED_TO_PROJECT' || currentIssue.status === 'RESOLVED' || currentIssue.status === 'REJECTED'"
                (click)="openQuickFixModal()"
              >
                <div class="action-icon"><i class="bi bi-tools"></i></div>
                <div class="action-text">
                  <div class="main-label">1. &lt;Tạo Task Khắc Phục Nhanh&gt;</div>
                  <div class="sub-label">
                    {{ currentIssue.status === 'REJECTED' ? 'Sự cố đã bị từ chối tiếp nhận (Đang khóa)' : 'Sự cố nhỏ lẻ, chi phí thấp &rarr; Giao thợ sửa ngay trong ngày' }}
                  </div>
                </div>
              </button>

              <!-- Nút 2: Chuyển thành Dự Án Duy Tu -->
              <button
                class="btn-action-flow btn-move-project"
                [disabled]="currentIssue.status === 'MOVED_TO_PROJECT' || currentIssue.status === 'REJECTED'"
                (click)="openConvertProjectModal()"
              >
                <div class="action-icon"><i class="bi bi-folder-plus"></i></div>
                <div class="action-text">
                  <div class="main-label">2. &lt;Chuyển Thành Dự Án Duy Tu&gt;</div>
                  <div class="sub-label">
                    {{ currentIssue.status === 'REJECTED' ? 'Sự cố đã bị từ chối tiếp nhận (Đang khóa)' : 'Sự cố lớn/hệ thống &rarr; Tự động map Asset_ID sang Dự án Duy tu' }}
                  </div>
                </div>
              </button>

              <!-- Nút 3: Từ chối tiếp nhận sự cố -->
              <button
                class="btn-action-flow btn-reject"
                [disabled]="currentIssue.status === 'MOVED_TO_PROJECT' || currentIssue.status === 'RESOLVED' || currentIssue.status === 'REJECTED'"
                (click)="openRejectModal()"
              >
                <div class="action-icon"><i class="bi bi-x-circle-fill"></i></div>
                <div class="action-text">
                  <div class="main-label">3. &lt;Từ Chối Tiếp Nhận Sự Cố&gt;</div>
                  <div class="sub-label">
                    {{ currentIssue.status === 'REJECTED' ? 'Đã từ chối tiếp nhận sự cố này' : 'Ảnh sai/lậu/thiếu thông tin &rarr; Yêu cầu người đi tuần cập nhật lại' }}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- ALERT KHI SỰ CỐ BỊ TỪ CHỐI TIẾP NHẬN -->
          <div class="alert alert-danger d-flex gap-3 align-items-start mt-3 mb-0" *ngIf="currentIssue.status === 'REJECTED'">
            <i class="bi bi-exclamation-octagon-fill fs-3 text-danger flex-shrink-0"></i>
            <div class="flex-grow-1">
              <div class="fw-bold fs-6 text-danger">SỰ CỐ NÀY ĐÃ BỊ TỪ CHỐI TIẾP NHẬN</div>
              <div class="mt-1 fs-sm"><strong>Lý do từ chối:</strong> {{ currentIssue.rejectReason }}</div>
              <div class="fs-xs text-muted mt-1">
                Từ chối bởi: <strong>{{ currentIssue.rejectedBy }}</strong> • Lúc: <strong>{{ currentIssue.rejectedAt }}</strong>
              </div>
              <div class="fs-xs text-dark mt-2 p-2 bg-white rounded border">
                <i class="bi bi-info-circle-fill text-primary"></i> <em>Sự cố chưa bị đóng. Người đi tuần có thể xem lý do này trên Cổng Hiện Trường, cập nhật bổ sung hình ảnh/thông tin và bấm gửi lại để Quản lý thẩm tra lại.</em>
              </div>
            </div>
          </div>

          <!-- ALERT KHI SỰ CỐ VỪA ĐƯỢC NGƯỜI ĐI TUẦN GỬI LẠI (RESUBMITTED) -->
          <div class="alert alert-warning d-flex gap-2 align-items-center mt-3 mb-0 py-2" *ngIf="currentIssue.resubmittedAt && currentIssue.status === 'NEW'">
            <i class="bi bi-arrow-repeat fs-4 text-warning flex-shrink-0"></i>
            <div>
              <strong class="text-dark">Sự cố vừa được Người tuần kiểm cập nhật & gửi lại thẩm tra:</strong>
              <span class="fs-xs text-muted ms-1">({{ currentIssue.resubmittedAt }})</span>
              <div class="fs-xs text-dark" *ngIf="currentIssue.resubmitNotes">
                <strong>Ghi chú giải trình:</strong> {{ currentIssue.resubmitNotes }}
              </div>
            </div>
          </div>
        </div>

        <!-- Detail Body with Tabs -->
        <div class="detail-body">
          <div class="nav-tabs-wrapper">
            <button
              class="tab-btn"
              [class.active]="activeTab === 'FIELD_INFO'"
              (click)="activeTab = 'FIELD_INFO'"
            >
              <i class="bi bi-camera-fill"></i> Hiện trường & Bản đồ GIS
            </button>
            <button
              class="tab-btn"
              [class.active]="activeTab === 'FIX_PROGRESS'"
              (click)="activeTab = 'FIX_PROGRESS'"
            >
              <i class="bi bi-wrench-adjustable-circle-fill"></i> Tiến độ khắc phục / Dự án
            </button>
            <button
              class="tab-btn"
              [class.active]="activeTab === 'LOGS'"
              (click)="activeTab = 'LOGS'"
            >
              <i class="bi bi-journal-text"></i> Nhật ký tuần kiểm (UC 9)
            </button>
          </div>

          <div class="tab-content-area">
            <!-- TAB 1: HIỆN TRƯỜNG & BẢN ĐỒ MINI -->
            <div *ngIf="activeTab === 'FIELD_INFO'" class="tab-pane">
              <div class="row-2-cols">
                <!-- Cột hình ảnh trước & sau -->
                <div class="col-box">
                  <h4 class="section-heading"><i class="bi bi-images"></i> Ảnh chụp hiện trường App Mobile:</h4>
                  <div class="photos-grid">
                    <div class="photo-wrapper">
                      <span class="photo-tag tag-before">ẢNH TRƯỚC SỰ CỐ</span>
                      <img [src]="currentIssue.photoBeforeUrl" alt="Hiện trạng sự cố" class="detail-photo" />
                      <div class="photo-caption text-muted fs-xs mt-1">
                        Chụp lúc {{ currentIssue.reportedAt }} bởi {{ currentIssue.reportedBy.name }}
                      </div>
                    </div>

                    <div class="photo-wrapper" *ngIf="currentIssue.photoAfterUrl">
                      <span class="photo-tag tag-after">ẢNH SAU HOÀN TẤT</span>
                      <img [src]="currentIssue.photoAfterUrl" alt="Sau khi sửa" class="detail-photo" />
                      <div class="photo-caption text-success fs-xs mt-1">
                        <i class="bi bi-check-circle-fill"></i> Đã nghiệm thu hoàn thành
                      </div>
                    </div>
                  </div>

                  <div class="description-box mt-3">
                    <label class="form-label-desc">Mô tả chi tiết sự cố:</label>
                    <p class="desc-text">{{ currentIssue.description }}</p>
                  </div>
                </div>

                <!-- Cột thông tin tài sản & Mini Map -->
                <div class="col-box">
                  <h4 class="section-heading"><i class="bi bi-geo-alt-fill text-danger"></i> Vị trí GPS & Tài sản GIS:</h4>
                  
                  <!-- Nhiều tài sản đính kèm theo Nguyên tắc 2 -->
                  <div class="attached-assets-box mb-3" *ngIf="currentIssue.attachedAssets && currentIssue.attachedAssets.length > 0">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="badge bg-primary text-white">
                        <i class="bi bi-diagram-3-fill me-1"></i> {{ currentIssue.attachedAssets.length }} tài sản cùng loại gắn vào sự cố (Nguyên tắc 2)
                      </span>
                      <span class="badge bg-light text-dark">Lớp: {{ currentIssue.categoryName }}</span>
                    </div>
                    <div class="attached-list">
                      <div class="attached-item" *ngFor="let ast of currentIssue.attachedAssets">
                        <div class="d-flex justify-content-between align-items-center">
                          <span class="asset-code font-monospace fw-bold text-primary">{{ ast.assetCode }}</span>
                          <span class="badge bg-danger text-white fs-xxs">Hư hỏng</span>
                        </div>
                        <div class="asset-name text-dark fw-semibold mt-1">{{ ast.assetName }}</div>
                        <div class="asset-meta text-muted fs-xs mt-1">
                          <i class="bi bi-geo-alt"></i> {{ ast.address || currentIssue.address }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 1 Tài sản đơn lẻ -->
                  <div class="asset-gis-card mb-3" *ngIf="(!currentIssue.attachedAssets || currentIssue.attachedAssets.length === 0) && currentIssue.assetId">
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="asset-tag">{{ currentIssue.assetCode }}</span>
                      <span class="badge bg-light text-dark">Lớp: {{ currentIssue.categoryName }}</span>
                    </div>
                    <div class="asset-title mt-1">{{ currentIssue.assetName }}</div>
                    <div class="asset-address text-muted fs-xs">
                      <i class="bi bi-pin-map"></i> {{ currentIssue.address }}
                    </div>
                    <div class="asset-coords text-muted fs-xs font-monospace mt-1">
                      GPS: {{ currentIssue.lat.toFixed(5) }}, {{ currentIssue.lng.toFixed(5) }}
                    </div>
                  </div>

                  <!-- Leaflet Mini Map Container -->
                  <div class="mini-map-box">
                    <div #miniMapContainer class="mini-leaflet-map"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB 2: TIẾN ĐỘ KHẮC PHỤC / DỰ ÁN DUY TU -->
            <div *ngIf="activeTab === 'FIX_PROGRESS'" class="tab-pane">
              <!-- Trường hợp 1: Đang hoặc Đã khắc phục nhanh -->
              <div *ngIf="currentIssue.quickFixDetails" class="progress-card quick-fix-card">
                <div class="card-status-banner banner-quick">
                  <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-tools fs-5"></i>
                    <div>
                      <h4 class="m-0 fw-bold">LỆNH KHẮC PHỤC SỰ CỐ NHANH</h4>
                      <p class="m-0 fs-xs text-muted">Phương án xử lý sự cố cấp bách tại hiện trường</p>
                    </div>
                  </div>
                  <span class="badge" [ngClass]="currentIssue.status === 'RESOLVED' ? 'bg-success' : 'bg-warning text-dark'">
                    {{ currentIssue.status === 'RESOLVED' ? 'ĐÃ NGHIỆM THU XONG' : 'ĐANG SỬA CHỮA' }}
                  </span>
                </div>

                <div class="details-table-grid mt-3">
                  <div class="grid-item">
                    <span class="label">Đơn vị / Đội thợ:</span>
                    <span class="val fw-semibold">{{ currentIssue.quickFixDetails.contractorOrTeam }}</span>
                  </div>
                  <div class="grid-item">
                    <span class="label">Thợ phụ trách:</span>
                    <span class="val">{{ currentIssue.quickFixDetails.assignedWorker }}</span>
                  </div>
                  <div class="grid-item">
                    <span class="label">Chi phí dự toán:</span>
                    <span class="val text-primary fw-bold">{{ currentIssue.quickFixDetails.estimatedCost | number }} VNĐ</span>
                  </div>
                  <div class="grid-item">
                    <span class="label">Hạn chót hoàn thành:</span>
                    <span class="val text-danger fw-semibold">{{ currentIssue.quickFixDetails.deadline }}</span>
                  </div>
                  <div class="grid-item full-width" *ngIf="currentIssue.quickFixDetails.resolutionNote">
                    <span class="label">Ghi chú xử lý kỹ thuật:</span>
                    <span class="val">{{ currentIssue.quickFixDetails.resolutionNote }}</span>
                  </div>
                </div>

                <!-- Nút nghiệm thu nếu đang trong trạng thái sửa -->
                <div class="mt-3 p-3 bg-light rounded" *ngIf="currentIssue.status === 'QUICK_FIXING'">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 class="m-0 fw-bold text-success"><i class="bi bi-clipboard2-check-fill"></i> Nghiệm thu hoàn thành</h5>
                      <p class="m-0 fs-xs text-muted">Đơn vị thợ đã xử lý xong ngoài hiện trường? Bấm để hoàn tất và đóng sự cố.</p>
                    </div>
                    <button class="btn btn-sm btn-success" (click)="openCompleteModal()">
                      <i class="bi bi-check-lg"></i> Nghiệm thu & Khép lại sự cố
                    </button>
                  </div>
                </div>
              </div>

              <!-- Trường hợp 2: Đã chuyển thành Dự án Duy tu -->
              <div *ngIf="currentIssue.projectLinkDetails" class="progress-card project-linked-card">
                <div class="card-status-banner banner-project">
                  <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-folder-check fs-5 text-primary"></i>
                    <div>
                      <h4 class="m-0 fw-bold text-primary">ĐÃ CHUYỂN THÀNH DỰ ÁN DUY TU</h4>
                      <p class="m-0 fs-xs text-muted">Sự cố đã được liên kết sang Phân hệ Dự Án Duy Tu</p>
                    </div>
                  </div>
                  <span class="badge bg-primary">PHÂN HỆ DỰ ÁN</span>
                </div>

                <div class="project-info-box mt-3">
                  <div class="row align-items-center">
                    <div class="col-md-8">
                      <div class="project-code font-monospace fw-bold text-primary fs-6">
                        [{{ currentIssue.projectLinkDetails.projectCode }}]
                      </div>
                      <h4 class="project-name mt-1">{{ currentIssue.projectLinkDetails.projectName }}</h4>
                      <div class="project-meta text-muted fs-xs mt-2">
                        <span>Chuyển lúc: {{ currentIssue.projectLinkDetails.linkedAt }}</span>
                        <span class="dot">•</span>
                        <span>Người thực hiện: {{ currentIssue.projectLinkDetails.linkedBy }}</span>
                      </div>
                    </div>
                    <div class="col-md-4 text-end">
                      <a [routerLink]="['/projects', currentIssue.projectLinkDetails.projectId]" class="btn btn-primary btn-sm">
                        <i class="bi bi-box-arrow-up-right"></i> Mở Trang Chi Tiết Dự Án
                      </a>
                    </div>
                  </div>

                  <div class="alert alert-info mt-3 fs-xs mb-0">
                    <i class="bi bi-info-circle-fill"></i>
                    Hệ thống đã tự động gán mã tài sản <strong>{{ currentIssue.assetCode }}</strong> vào tab <strong>"Tài sản"</strong> của Dự án Duy tu trên để quản lý khối lượng thi công.
                  </div>
                </div>
              </div>

              <!-- Trường hợp chưa có xử lý gì -->
              <div *ngIf="!currentIssue.quickFixDetails && !currentIssue.projectLinkDetails" class="p-4 text-center text-muted">
                <i class="bi bi-hourglass-split fs-2"></i>
                <h4 class="mt-2">Sự cố đang ở trạng thái MỚI TIẾP NHẬN</h4>
                <p class="fs-xs">Vui lòng sử dụng 2 nút hành động ở phía trên để lựa chọn: <strong>&lt;Tạo Task Khắc Phục Nhanh&gt;</strong> hoặc <strong>&lt;Chuyển Thành Dự Án Duy Tu&gt;</strong>.</p>
              </div>
            </div>

            <!-- TAB 3: NHẬT KÝ TUẦN KIỂM (UC 9) -->
            <div *ngIf="activeTab === 'LOGS'" class="tab-pane">
              <h4 class="section-heading mb-3"><i class="bi bi-clock-history"></i> Dòng thời gian ghi nhận & xử lý:</h4>
              <div class="timeline-container">
                <div *ngFor="let log of issueLogs" class="timeline-item">
                  <div class="timeline-badge" [ngClass]="'badge-' + log.status.toLowerCase()">
                    <i class="bi" [ngClass]="getLogIcon(log.action)"></i>
                  </div>
                  <div class="timeline-content">
                    <div class="d-flex justify-content-between align-items-center">
                      <h5 class="log-title m-0">{{ log.title }}</h5>
                      <span class="log-time text-muted fs-xs">{{ log.timestamp }}</span>
                    </div>
                    <p class="log-details text-muted fs-xs mt-1">{{ log.details }}</p>
                    <div class="log-user fs-xs">
                      <i class="bi bi-person-fill"></i> {{ log.personnelName }}
                    </div>
                  </div>
                </div>

                <div *ngIf="issueLogs.length === 0" class="text-center p-3 text-muted fs-xs">
                  Chưa có nhật ký ghi nhận riêng cho sự cố này.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ng-template #noSelection>
        <div class="issue-detail-pane empty-selection text-center p-5 text-muted">
          <i class="bi bi-hand-index-thumb fs-1"></i>
          <h3 class="mt-3">Vui lòng chọn một sự cố bên trái</h3>
          <p class="fs-xs">Chọn sự cố để xem chi tiết ảnh hiện trường, bản đồ tọa độ GPS và kích hoạt luồng xử lý nghiệp vụ.</p>
        </div>
      </ng-template>
    </div>

    <!-- MODAL 1: TẠO TASK KHẮC PHỤC NHANH (UC 10) -->
    <div class="custom-modal-backdrop" *ngIf="showQuickFixModal">
      <div class="custom-modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title"><i class="bi bi-tools"></i> Khởi Tạo Task Khắc Phục Nhanh (Trường hợp 1)</h5>
            <button class="btn-close btn-close-white" (click)="showQuickFixModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-success fs-xs mb-3">
              Áp dụng cho sự cố nhỏ lẻ, chi phí thấp. Cán bộ phê duyệt và giao trực tiếp cho đơn vị sửa chữa nhỏ để hoàn thành tức thì.
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Sự cố cần khắc phục:</label>
              <div class="p-2 bg-light rounded text-dark fs-xs">
                <strong>[{{ currentIssue?.code }}]</strong> {{ currentIssue?.title }}
              </div>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label">Đơn vị / Đội thợ tiếp nhận:</label>
                <select class="form-select form-select-sm" [(ngModel)]="quickFixForm.contractorOrTeam">
                  <option value="Đội Phản ứng nhanh Duy tu Quận 1">Đội Phản ứng nhanh Duy tu Quận 1</option>
                  <option value="Tổ Kỹ thuật Điện Chiếu sáng 1">Tổ Kỹ thuật Điện Chiếu sáng 1</option>
                  <option value="Tổ Cắt tỉa & Công viên Cây xanh 2">Tổ Cắt tỉa & Công viên Cây xanh 2</option>
                  <option value="Công ty TNHH Thoát nước Đô thị">Công ty TNHH Thoát nước Đô thị</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Thợ phụ trách chính:</label>
                <input type="text" class="form-control form-control-sm" [(ngModel)]="quickFixForm.assignedWorker" placeholder="Ví dụ: Nguyễn Văn Hải" />
              </div>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label">Dự toán chi phí khắc phục (VNĐ):</label>
                <input type="number" class="form-control form-control-sm" [(ngModel)]="quickFixForm.estimatedCost" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Hạn chót hoàn thành:</label>
                <input type="text" class="form-control form-control-sm" [(ngModel)]="quickFixForm.deadline" placeholder="13/10/2026 18:00" />
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Yêu cầu kỹ thuật & Chỉ đạo xử lý:</label>
              <textarea class="form-control form-control-sm" rows="3" [(ngModel)]="quickFixForm.note" placeholder="Nhập chỉ dẫn cho đội thợ hiện trường..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="showQuickFixModal = false">Hủy bỏ</button>
            <button class="btn btn-success btn-sm" (click)="submitQuickFix()">
              <i class="bi bi-check-circle-fill"></i> Phê Duyệt & Giao Task Ngay
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 2: CHUYỂN THÀNH DỰ ÁN DUY TU (TRƯỜNG HỢP 2 - GOM SỰ CỐ) -->
    <div class="custom-modal-backdrop" *ngIf="showConvertProjectModal">
      <div class="custom-modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title"><i class="bi bi-folder-plus"></i> Khởi Tạo Dự Án Duy Tu Từ Sự Cố Tuần Kiểm (Trường hợp 2)</h5>
            <button class="btn-close btn-close-white" (click)="showConvertProjectModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-primary fs-xs mb-3">
              <i class="bi bi-info-circle-fill"></i>
              <strong>Cơ chế kết nối dữ liệu:</strong> Hệ thống sẽ tự động tạo một Dự Án Duy Tu mới trong Phân hệ Quản Lý Dự Án và <strong>tự động ánh xạ (map) toàn bộ Asset_ID</strong> từ các sự cố được chọn sang tab <strong>Tài Sản</strong> của Dự án Duy tu đó!
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Danh sách sự cố & Tài sản được gom vào dự án ({{ issuesToConvert.length }} sự cố):</label>
              <div class="table-responsive bg-light p-2 rounded max-h-180">
                <table class="table table-sm table-bordered m-0 fs-xs">
                  <thead class="table-secondary">
                    <tr>
                      <th>Mã SC</th>
                      <th>Tên sự cố</th>
                      <th>Tuyến đường</th>
                      <th>Mã Tài Sản (Asset_ID)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let iss of issuesToConvert">
                      <td class="font-monospace fw-bold text-primary">{{ iss.code }}</td>
                      <td>{{ iss.title }}</td>
                      <td>{{ iss.routeName }}</td>
                      <td><span class="badge bg-info text-dark">{{ iss.assetCode || 'Chưa liên kết' }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Tên Dự Án Duy Tu mới (*):</label>
              <input type="text" class="form-control" [(ngModel)]="convertProjectForm.projectName" placeholder="Nhập tên dự án duy tu..." />
            </div>

            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label">Loại hình duy tu:</label>
                <select class="form-select form-select-sm" [(ngModel)]="convertProjectForm.projectType">
                  <option value="Đột xuất">Đột xuất</option>
                  <option value="Định kỳ">Định kỳ</option>
                  <option value="Khẩn cấp">Khẩn cấp</option>
                  <option value="Sửa chữa thường xuyên">Sửa chữa thường xuyên</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Tổng mức đầu tư / Dự toán (VNĐ):</label>
                <input type="number" class="form-control form-control-sm" [(ngModel)]="convertProjectForm.budget" />
              </div>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label">Nhà thầu / Đơn vị thi công dự kiến:</label>
                <input type="text" class="form-control form-control-sm" [(ngModel)]="convertProjectForm.contractor" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Tuyến đường dự án:</label>
                <input type="text" class="form-control form-control-sm" [(ngModel)]="convertProjectForm.routeName" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="showConvertProjectModal = false">Hủy bỏ</button>
            <button class="btn btn-primary btn-sm" (click)="submitConvertProject()">
              <i class="bi bi-box-arrow-right"></i> Khởi Tạo & Chuyển Dữ Liệu Sang Phân Hệ Duy Tu
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 3: NGHIỆM THU KHÉP LẠI SỰ CỐ -->
    <div class="custom-modal-backdrop" *ngIf="showCompleteModal">
      <div class="custom-modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title"><i class="bi bi-check2-circle"></i> Nghiệm Thu Hoàn Thành Sự Cố</h5>
            <button class="btn-close btn-close-white" (click)="showCompleteModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Link ảnh sau khi khắc phục xong:</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="completeForm.afterPhotoUrl" />
            </div>
            <div class="mb-3">
              <label class="form-label">Cán bộ kiểm tra & Nghiệm thu:</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="completeForm.acceptedBy" />
            </div>
            <div class="mb-3">
              <label class="form-label">Biên bản nghiệm thu / Nhận xét:</label>
              <textarea class="form-control form-control-sm" rows="3" [(ngModel)]="completeForm.note"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="showCompleteModal = false">Hủy</button>
            <button class="btn btn-success btn-sm" (click)="submitCompleteQuickFix()">Xác nhận nghiệm thu</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 4: TỪ CHỐI TIẾP NHẬN SỰ CỐ -->
    <div class="custom-modal-backdrop" *ngIf="showRejectModal">
      <div class="custom-modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <i class="bi bi-x-circle-fill"></i>
              <span>Từ Chối Tiếp Nhận Sự Cố [{{ currentIssue?.code }}]</span>
            </h5>
            <button class="btn-close btn-close-white" (click)="showRejectModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning fs-xs mb-3">
              <i class="bi bi-info-circle-fill"></i> Khi từ chối, sự cố <strong>không bị đóng hoàn toàn</strong>. Người đi tuần có thể xem lý do từ chối này trên Cổng Hiện Trường, cập nhật bổ sung hình ảnh/thông tin và gửi lại để thẩm tra.
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Chọn lý do nhanh:</label>
              <div class="d-flex flex-wrap gap-1 mb-2">
                <button
                  type="button"
                  class="btn btn-xs btn-outline-secondary"
                  *ngFor="let sample of quickRejectReasons"
                  (click)="rejectReasonText = sample"
                >
                  {{ sample }}
                </button>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Nội dung giải thích lý do từ chối (*):</label>
              <textarea
                class="form-control"
                rows="3"
                [(ngModel)]="rejectReasonText"
                placeholder="Nhập chi tiết: Vd: Ảnh chụp bị mờ / góc sai; Sai vị trí tài sản trên bản đồ; Báo cáo trùng lặp..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="showRejectModal = false">Hủy</button>
            <button
              class="btn btn-danger btn-sm"
              [disabled]="!rejectReasonText.trim()"
              (click)="submitRejectIssue()"
            >
              <i class="bi bi-x-circle"></i> Xác Nhận Từ Chối Tiếp Nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workspace-container {
      display: flex;
      height: calc(100vh - 160px);
      background: #f8fafc;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    /* PANE TRÁI */
    .issues-list-pane {
      width: 42%;
      border-right: 1px solid var(--gray-200);
      background: white;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .pane-header {
      padding: 14px 16px;
      border-bottom: 1px solid var(--gray-200);
      background: white;

      .search-box {
        position: relative;
        i {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-400);
        }
        input {
          padding-left: 32px;
        }
      }

      .filters-row {
        display: flex;
        gap: 8px;
      }
    }

    .batch-bar {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 6px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cards-scroll-container {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .issue-card {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--primary-300);
        box-shadow: var(--shadow-sm);
      }

      &.active {
        border-color: var(--primary-600);
        background: #f0f7ff;
        box-shadow: 0 0 0 1px var(--primary-600);
      }

      &.urgent {
        border-left: 4px solid var(--danger-600);
      }

      .card-top-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .issue-code {
        font-family: monospace;
        font-weight: 700;
        font-size: 12px;
        color: var(--gray-800);
      }

      .card-main-content {
        display: flex;
        gap: 10px;

        .thumb-photo {
          width: 64px;
          height: 64px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid var(--gray-200);
        }

        .info-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;

          .issue-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--gray-900);
            line-height: 1.3;
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .meta-row {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }

      .card-footer-pill {
        margin-top: 8px;
        padding-top: 6px;
        border-top: 1px dashed var(--gray-200);
        font-size: 11px;
        color: var(--primary-700);
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 500;
      }
    }

    /* PANE PHẢI */
    .issue-detail-pane {
      width: 58%;
      background: white;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-y: auto;
    }

    .detail-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--gray-200);
      background: white;

      .detail-code {
        font-family: monospace;
        font-weight: 700;
        font-size: 14px;
        color: var(--primary-700);
      }

      .detail-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--gray-900);
        margin: 0;
      }
    }

    .primary-actions-box {
      background: #f8fafc;
      border: 1.5px dashed var(--primary-300);
      border-radius: 8px;
      padding: 12px 14px;

      .actions-title {
        font-size: 11.5px;
        font-weight: 700;
        color: var(--gray-700);
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .actions-buttons-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 10px;
      }

      .btn-action-flow {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border-radius: 8px;
        border: 1px solid transparent;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s ease;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-icon {
          font-size: 20px;
        }

        .main-label {
          font-weight: 700;
          font-size: 12.5px;
        }

        .sub-label {
          font-size: 10.5px;
          opacity: 0.85;
          margin-top: 1px;
        }

        &.btn-quick-fix {
          background: #ecfdf5;
          color: #047857;
          border-color: #a7f3d0;
          &:hover:not(:disabled) {
            background: #d1fae5;
            box-shadow: 0 2px 4px rgba(4,120,87,0.15);
          }
        }

        &.btn-move-project {
          background: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
          &:hover:not(:disabled) {
            background: #dbeafe;
            box-shadow: 0 2px 4px rgba(29,78,216,0.15);
          }
        }

        &.btn-reject {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
          &:hover:not(:disabled) {
            background: #fee2e2;
            box-shadow: 0 2px 4px rgba(220,38,38,0.15);
          }
        }
      }
    }

    .attached-assets-box {
      background: #f8fafc;
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 10px 12px;

      .attached-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .attached-item {
        background: white;
        border: 1px solid var(--gray-200);
        border-radius: 6px;
        padding: 6px 10px;
        .asset-code { font-size: 11px; }
        .asset-name { font-size: 12px; }
      }
    }

    .nav-tabs-wrapper {
      display: flex;
      border-bottom: 1px solid var(--gray-200);
      padding: 0 20px;
      background: white;

      .tab-btn {
        padding: 10px 16px;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--gray-600);
        font-weight: 500;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;

        &.active {
          color: var(--primary-600);
          border-bottom-color: var(--primary-600);
          font-weight: 600;
        }
      }
    }

    .tab-content-area {
      padding: 16px 20px;
    }

    .row-2-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .col-box {
      .section-heading {
        font-size: 12.5px;
        font-weight: 700;
        color: var(--gray-700);
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .photos-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .photo-wrapper {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--gray-200);

        .photo-tag {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          color: white;

          &.tag-before { background: rgba(220, 38, 38, 0.85); }
          &.tag-after { background: rgba(16, 185, 129, 0.85); }
        }

        .detail-photo {
          width: 100%;
          height: 180px;
          object-fit: cover;
          display: block;
        }
      }
    }

    .description-box {
      background: var(--gray-50);
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid var(--gray-200);

      .form-label-desc {
        font-size: 11px;
        font-weight: 700;
        color: var(--gray-600);
        margin-bottom: 4px;
        display: block;
      }

      .desc-text {
        font-size: 13px;
        color: var(--gray-800);
        margin: 0;
        line-height: 1.4;
      }
    }

    .asset-gis-card {
      background: #f8fafc;
      border: 1px solid var(--gray-200);
      border-radius: 6px;
      padding: 10px 12px;

      .asset-tag {
        font-family: monospace;
        font-weight: 700;
        color: var(--primary-700);
        font-size: 12px;
      }

      .asset-title {
        font-weight: 600;
        font-size: 13px;
      }
    }

    .mini-map-box {
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      overflow: hidden;
      height: 200px;

      .mini-leaflet-map {
        width: 100%;
        height: 100%;
      }
    }

    .progress-card {
      border-radius: 8px;
      border: 1px solid var(--gray-200);
      overflow: hidden;
      background: white;

      .card-status-banner {
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        &.banner-quick { background: #ecfdf5; border-bottom: 1px solid #a7f3d0; }
        &.banner-project { background: #eff6ff; border-bottom: 1px solid #bfdbfe; }
      }
    }

    .details-table-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      padding: 14px 16px;

      .grid-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 12.5px;

        &.full-width { grid-column: span 2; }
        .label { color: var(--gray-500); font-size: 11px; }
      }
    }

    .project-info-box {
      padding: 16px;
      background: #f8fafc;
      border-radius: 6px;
    }

    /* TIMELINE */
    .timeline-container {
      position: relative;
      padding-left: 24px;

      &::before {
        content: '';
        position: absolute;
        left: 9px;
        top: 6px;
        bottom: 6px;
        width: 2px;
        background: var(--gray-200);
      }

      .timeline-item {
        position: relative;
        margin-bottom: 16px;

        .timeline-badge {
          position: absolute;
          left: -24px;
          top: 0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;

          &.badge-success { background: var(--success-500); }
          &.badge-warning { background: var(--warning-500); }
          &.badge-danger { background: var(--danger-500); }
          &.badge-info { background: var(--primary-500); }
        }

        .timeline-content {
          background: #f8fafc;
          border: 1px solid var(--gray-200);
          border-radius: 6px;
          padding: 10px 12px;

          .log-title { font-size: 13px; font-weight: 600; }
        }
      }
    }

    /* BADGES & PILLS */
    .priority-pill {
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;

      &.priority-urgent { background: #fee2e2; color: #dc2626; }
      &.priority-high { background: #ffedd5; color: #ea580c; }
      &.priority-medium { background: #fef3c7; color: #d97706; }
      &.priority-low { background: #f1f5f9; color: #475569; }
    }

    .status-badge {
      font-size: 10.5px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;

      &.status-new { background: #eff6ff; color: #1d4ed8; }
      &.status-quick_fixing { background: #fef3c7; color: #b45309; }
      &.status-resolved { background: #ecfdf5; color: #047857; }
      &.status-moved_to_project { background: #f3e8ff; color: #7e22ce; }
      &.status-rejected { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; font-weight: 700; }
    }

    .layer-pill {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .fs-xs { font-size: 11.5px; }
    .btn-xs { padding: 2px 8px; font-size: 11px; border-radius: 4px; }
    .dot { margin: 0 4px; }
    .max-h-180 { max-height: 180px; overflow-y: auto; }

    /* MODAL */
    .custom-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(2px);
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .custom-modal-dialog {
      width: 100%;
      max-width: 580px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--shadow-xl);

      &.modal-lg { max-width: 760px; }

      .modal-header {
        padding: 12px 18px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-body { padding: 18px; }
      .modal-footer {
        padding: 12px 18px;
        background: #f8fafc;
        border-top: 1px solid var(--gray-200);
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    }
  `]
})
export class IssueWorkspaceComponent implements OnInit, AfterViewInit, OnDestroy {
  patrolService = inject(PatrolService);
  projectService = inject(ProjectService);
  toast = inject(ToastService);
  router = inject(Router);

  searchKeyword = '';
  statusFilter = 'ALL';
  priorityFilter = 'ALL';
  selectedIssueIds = new Set<string>();

  activeTab: 'FIELD_INFO' | 'FIX_PROGRESS' | 'LOGS' = 'FIELD_INFO';

  // Modals state
  showQuickFixModal = false;
  quickFixForm = {
    contractorOrTeam: 'Đội Phản ứng nhanh Duy tu Quận 1',
    assignedWorker: 'Nguyễn Văn Hải',
    estimatedCost: 2500000,
    deadline: '13/10/2026 18:00',
    note: 'Yêu cầu thay bu lông neo mới và siết lực đạt chuẩn an toàn giao thông.'
  };

  showConvertProjectModal = false;
  convertProjectForm = {
    projectName: 'Dự án Duy tu & Xử lý sự cố hạ tầng kỹ thuật trung tâm',
    projectType: 'Khẩn cấp' as any,
    budget: 850000000,
    contractor: 'Công ty CP Xây dựng & Bảo trì Đô thị Sài Gòn',
    routeName: 'Tuyến trung tâm (Nguyễn Huệ - Lê Lợi - Tôn Đức Thắng)'
  };
  issuesToConvert: PatrolIssue[] = [];

  showCompleteModal = false;
  completeForm = {
    afterPhotoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=700&q=80',
    acceptedBy: 'Cán bộ Điều Hành QLDA',
    note: 'Đã kiểm tra hiện trường, thiết bị vận hành tốt, đạt tiêu chuẩn kỹ thuật.'
  };

  // Modal Từ chối tiếp nhận sự cố
  showRejectModal = false;
  rejectReasonText = '';
  quickRejectReasons = [
    'Ảnh chụp hiện trường bị mờ / không đúng góc chụp',
    'Sai vị trí tọa độ GPS hoặc sai địa bàn quản lý',
    'Báo cáo trùng lặp với sự cố đã tiếp nhận',
    'Mô tả quá sơ sài, thiếu kích thước hư hỏng cụ thể',
    'Tài sản GIS đính kèm không đúng với hiện trường'
  ];

  // Mini Leaflet Map
  @ViewChild('miniMapContainer') miniMapContainer?: ElementRef;
  private miniMap?: L.Map;
  private miniMarker?: L.Marker;

  ngOnInit() {
    // Tự động chọn issue đầu tiên nếu có
    if (!this.patrolService.selectedIssueId() && this.patrolService.issues().length > 0) {
      this.patrolService.selectIssue(this.patrolService.issues()[0].id);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMiniMap(), 300);
  }

  ngOnDestroy() {
    if (this.miniMap) {
      this.miniMap.remove();
    }
  }

  get currentIssue(): PatrolIssue | undefined {
    return this.patrolService.getSelectedIssue();
  }

  get filteredIssues(): PatrolIssue[] {
    return this.patrolService.issues().filter(i => {
      if (this.statusFilter !== 'ALL' && i.status !== this.statusFilter) return false;
      if (this.priorityFilter !== 'ALL' && i.priority !== this.priorityFilter) return false;
      if (this.searchKeyword.trim()) {
        const q = this.searchKeyword.toLowerCase().trim();
        const match =
          i.code.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.routeName.toLowerCase().includes(q) ||
          i.address.toLowerCase().includes(q) ||
          (i.assetCode && i.assetCode.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }

  get isAllSelected(): boolean {
    const list = this.filteredIssues.filter(i => i.status !== 'REJECTED' && i.status !== 'MOVED_TO_PROJECT');
    return list.length > 0 && list.every(i => this.selectedIssueIds.has(i.id));
  }

  toggleSelectAll() {
    if (this.isAllSelected) {
      this.selectedIssueIds.clear();
    } else {
      this.filteredIssues
        .filter(i => i.status !== 'REJECTED' && i.status !== 'MOVED_TO_PROJECT')
        .forEach(i => this.selectedIssueIds.add(i.id));
    }
  }

  toggleSelectIssue(id: string) {
    if (this.selectedIssueIds.has(id)) {
      this.selectedIssueIds.delete(id);
    } else {
      this.selectedIssueIds.add(id);
    }
  }

  selectIssue(iss: PatrolIssue) {
    this.patrolService.selectIssue(iss.id);
    this.updateMiniMap(iss);
  }

  countByStatus(status: IssueStatus): number {
    return this.patrolService.issues().filter(i => i.status === status).length;
  }

  getPriorityLabel(p: IssuePriority): string {
    switch (p) {
      case 'URGENT': return 'Khẩn cấp';
      case 'HIGH': return 'Cao';
      case 'MEDIUM': return 'Trung bình';
      case 'LOW': return 'Thấp';
    }
  }

  getStatusLabel(s: IssueStatus): string {
    switch (s) {
      case 'NEW': return 'Mới tiếp nhận';
      case 'QUICK_FIXING': return 'Đang khắc phục';
      case 'RESOLVED': return 'Đã hoàn thành';
      case 'MOVED_TO_PROJECT': return 'Chuyển Dự án Duy tu';
      case 'REJECTED': return 'Bị từ chối tiếp nhận';
    }
  }

  getLayerColor(layerId: string): string {
    switch (layerId) {
      case 'LIGHTING': return '#f59e0b';
      case 'GREENERY': return '#10b981';
      case 'DRAINAGE': return '#06b6d4';
      default: return '#8b5cf6';
    }
  }

  getLayerIcon(layerId: string): string {
    switch (layerId) {
      case 'LIGHTING': return 'bi-lightbulb-fill';
      case 'GREENERY': return 'bi-tree-fill';
      case 'DRAINAGE': return 'bi-droplet-half';
      default: return 'bi-signpost-split-fill';
    }
  }

  getLogIcon(action: string): string {
    switch (action) {
      case 'CHECK_IN': return 'bi-person-check-fill';
      case 'START_ROUTE': return 'bi-flag-fill';
      case 'REPORT_ISSUE': return 'bi-exclamation-triangle-fill';
      case 'QUICK_FIX': return 'bi-tools';
      default: return 'bi-info-circle-fill';
    }
  }

  get issueLogs() {
    const cur = this.currentIssue;
    if (!cur) return [];
    return this.patrolService.logs().filter(l => l.issueId === cur.id || l.title.includes(cur.code));
  }

  // Mini Leaflet Map Logic
  private miniMarkersGroup?: L.FeatureGroup;

  private initMiniMap() {
    if (!this.miniMapContainer || this.miniMap) return;

    const lat = this.currentIssue?.lat || 10.7745;
    const lng = this.currentIssue?.lng || 106.7025;

    this.miniMap = L.map(this.miniMapContainer.nativeElement, {
      zoomControl: false,
      attributionControl: false
    }).setView([lat, lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.miniMap);

    this.miniMarkersGroup = L.featureGroup().addTo(this.miniMap);

    this.updateMiniMap(this.currentIssue);
  }

  private updateMiniMap(iss?: PatrolIssue) {
    if (!this.miniMap || !iss) return;

    if (!this.miniMarkersGroup) {
      this.miniMarkersGroup = L.featureGroup().addTo(this.miniMap);
    }
    this.miniMarkersGroup.clearLayers();

    const layerColor = this.getLayerColor(iss.layerId);

    // Nếu sự cố có nhiều tài sản đính kèm (Nguyên tắc 2)
    if (iss.attachedAssets && iss.attachedAssets.length > 0) {
      const boundsCoords: [number, number][] = [];

      iss.attachedAssets.forEach((ast, idx) => {
        const aLat = ast.lat || iss.lat;
        const aLng = ast.lng || iss.lng;
        boundsCoords.push([aLat, aLng]);

        const multiIcon = L.divIcon({
          className: 'pulse-marker',
          html: `
            <div style="background-color: ${layerColor}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.45);">
              ${idx + 1}
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const m = L.marker([aLat, aLng], { icon: multiIcon })
          .bindPopup(`<b>[${ast.assetCode}]</b><br>${ast.assetName}<br><i>${ast.address || iss.address}</i>`);
        this.miniMarkersGroup!.addLayer(m);
      });

      // Nếu có từ 2 tài sản trở lên, vẽ polyline nối chúng lại
      if (boundsCoords.length > 1) {
        const line = L.polyline(boundsCoords, { color: layerColor, weight: 3, dashArray: '5, 5' });
        this.miniMarkersGroup.addLayer(line);
      }

      this.miniMap.fitBounds(L.latLngBounds(boundsCoords), { padding: [30, 30], maxZoom: 17 });
    } else {
      // 1 Tài sản đơn lẻ
      this.miniMap.setView([iss.lat, iss.lng], 16);

      const pinIcon = L.divIcon({
        className: 'pulse-marker',
        html: `
          <div style="background-color: ${layerColor}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
            !
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const m = L.marker([iss.lat, iss.lng], { icon: pinIcon })
        .bindPopup(`<b>[${iss.code}]</b><br>${iss.title}<br><i>${iss.address}</i>`)
        .openPopup();
      this.miniMarkersGroup.addLayer(m);
    }
  }

  // Modal Handlers
  openRejectModal() {
    if (!this.currentIssue) return;
    this.rejectReasonText = '';
    this.showRejectModal = true;
  }

  submitRejectIssue() {
    if (!this.currentIssue || !this.rejectReasonText.trim()) return;
    this.patrolService.rejectIssue(this.currentIssue.id, this.rejectReasonText.trim(), 'Lê Hoàng Long (Cán bộ QLDA)');
    this.showRejectModal = false;
  }

  openQuickFixModal() {
    if (!this.currentIssue || this.currentIssue.status === 'REJECTED' || this.currentIssue.status === 'MOVED_TO_PROJECT' || this.currentIssue.status === 'RESOLVED') return;
    this.quickFixForm.note = `Xử lý sự cố: ${this.currentIssue.title} tại ${this.currentIssue.address}`;
    this.showQuickFixModal = true;
  }

  submitQuickFix() {
    if (!this.currentIssue || this.currentIssue.status === 'REJECTED') return;
    this.patrolService.createQuickFixTask(
      this.currentIssue.id,
      this.quickFixForm.contractorOrTeam,
      this.quickFixForm.assignedWorker,
      this.quickFixForm.estimatedCost,
      this.quickFixForm.deadline,
      this.quickFixForm.note
    );
    this.showQuickFixModal = false;
    this.activeTab = 'FIX_PROGRESS';
  }

  openConvertProjectModal() {
    if (!this.currentIssue || this.currentIssue.status === 'REJECTED' || this.currentIssue.status === 'MOVED_TO_PROJECT') return;
    this.issuesToConvert = [this.currentIssue];
    this.convertProjectForm.projectName = `Dự án Duy tu khẩn cấp xử lý sự cố ${this.currentIssue.code} (${this.currentIssue.routeName})`;
    this.convertProjectForm.routeName = this.currentIssue.routeName;
    this.showConvertProjectModal = true;
  }

  openBatchProjectModal() {
    const list = this.patrolService.issues().filter(i => this.selectedIssueIds.has(i.id) && i.status !== 'REJECTED' && i.status !== 'MOVED_TO_PROJECT');
    if (list.length === 0) {
      alert('Không có sự cố hợp lệ nào để gom dự án! Các sự cố bị từ chối tiếp nhận không thể chuyển sang dự án duy tu.');
      return;
    }
    this.issuesToConvert = list;
    const route = list[0].routeName;
    this.convertProjectForm.projectName = `Dự án Duy tu tổng thể xử lý ${list.length} sự cố hạ tầng ${route}`;
    this.convertProjectForm.routeName = route;
    this.convertProjectForm.budget = list.length * 400000000;
    this.showConvertProjectModal = true;
  }

  submitConvertProject() {
    const ids = this.issuesToConvert.map(i => i.id);
    const result = this.patrolService.convertIssuesToMaintenanceProject(
      ids,
      this.convertProjectForm.projectName,
      this.convertProjectForm.projectType,
      this.convertProjectForm.budget,
      this.convertProjectForm.contractor,
      this.convertProjectForm.routeName
    );

    this.showConvertProjectModal = false;
    this.selectedIssueIds.clear();
    this.activeTab = 'FIX_PROGRESS';
  }

  openCompleteModal() {
    this.showCompleteModal = true;
  }

  submitCompleteQuickFix() {
    if (!this.currentIssue) return;
    this.patrolService.completeQuickFix(
      this.currentIssue.id,
      this.completeForm.afterPhotoUrl,
      this.completeForm.acceptedBy,
      this.completeForm.note
    );
    this.showCompleteModal = false;
  }

  exportIssueExcel() {
    const rows = this.filteredIssues.map(i => [
      i.code,
      i.title,
      this.getPriorityLabel(i.priority),
      this.getStatusLabel(i.status),
      i.categoryName,
      i.routeName,
      i.address,
      i.assetCode || 'N/A',
      i.reportedAt,
      i.reportedBy.name
    ]);

    this.patrolService.exportToCsv(
      'Danh_Sach_Su_Co_Tuan_Kiem',
      ['Mã SC', 'Tên sự cố', 'Độ ưu tiên', 'Trạng thái', 'Loại vấn đề', 'Tuyến đường', 'Địa chỉ', 'Mã tài sản', 'Thời gian báo', 'Người báo'],
      rows
    );
  }
}
