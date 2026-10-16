import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatrolService } from '../../../../core/services/patrol.service';
import {
  PatrolInspectionRecord,
  ShiftType,
  AssetCondition
} from '../../../../core/models/patrol.model';

@Component({
  selector: 'app-patrol-journal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="journal-wrapper">
      <!-- 1. KPI STATS OVERVIEW CARDS -->
      <div class="journal-stats-grid">
        <div class="stat-card card-total">
          <div class="stat-meta">
            <span class="stat-label">TỔNG LƯỢT CA TUẦN KIỂM</span>
            <div class="stat-val-group">
              <span class="stat-val">{{ totalRecordsCount }}</span>
              <span class="stat-unit">ca tuần</span>
            </div>
            <span class="stat-sub">100% lộ trình có nhật ký số</span>
          </div>
          <div class="stat-icon-wrap icon-blue">
            <i class="bi bi-journal-bookmark-fill"></i>
          </div>
        </div>

        <div class="stat-card card-distance">
          <div class="stat-meta">
            <span class="stat-label">TỔNG QUÃNG ĐƯỜNG TUẦN TRA</span>
            <div class="stat-val-group">
              <span class="stat-val">{{ totalDistanceKm.toFixed(1) }}</span>
              <span class="stat-unit">km</span>
            </div>
            <span class="stat-sub">Tọa độ GPS đối soát tự động</span>
          </div>
          <div class="stat-icon-wrap icon-purple">
            <i class="bi bi-geo-alt-fill"></i>
          </div>
        </div>

        <div class="stat-card card-verified">
          <div class="stat-meta">
            <span class="stat-label">TỶ LỆ CA ĐÃ THẨM ĐỊNH</span>
            <div class="stat-val-group">
              <span class="stat-val text-emerald">{{ verifiedPercent }}%</span>
              <span class="stat-unit">đạt chuẩn</span>
            </div>
            <span class="stat-sub">{{ verifiedCount }}/{{ totalRecordsCount }} ca đã duyệt</span>
          </div>
          <div class="stat-icon-wrap icon-emerald">
            <i class="bi bi-patch-check-fill"></i>
          </div>
        </div>

        <div class="stat-card card-issues">
          <div class="stat-meta">
            <span class="stat-label">SỰ CỐ PHÁT HIỆN TỪ TUẦN TRA</span>
            <div class="stat-val-group">
              <span class="stat-val text-amber">{{ totalIssuesFound }}</span>
              <span class="stat-unit">vụ việc</span>
            </div>
            <span class="stat-sub">Đã chuyển sang khắc phục nhanh</span>
          </div>
          <div class="stat-icon-wrap icon-amber">
            <i class="bi bi-exclamation-triangle-fill"></i>
          </div>
        </div>
      </div>

      <!-- 2. TOOLBAR: TÌM KIẾM THEO TỪ KHÓA & BỘ LỌC (UC 3, UC 6) -->
      <div class="journal-filter-card">
        <div class="filter-top-row">
          <div class="search-input-wrap">
            <i class="bi bi-search search-icon"></i>
            <input
              type="text"
              class="form-control custom-search-input"
              placeholder="Tìm kiếm theo từ khóa (Mã sổ, Tuyến đường, Trưởng kíp, Đội tuần, Ghi chú)..."
              [(ngModel)]="searchKeyword"
            />
            <button
              class="btn-clear-search"
              *ngIf="searchKeyword"
              (click)="searchKeyword = ''"
              title="Xóa tìm kiếm"
            >
              <i class="bi bi-x"></i>
            </button>
          </div>

          <div class="toolbar-actions">
            <button
              type="button"
              class="btn btn-export-excel"
              (click)="onExportCsv()"
              title="Xuất file Excel / CSV (UC 6)"
            >
              <i class="bi bi-file-earmark-excel-fill text-success"></i>
              <span>Xuất Sổ Nhật Ký (Excel)</span>
            </button>

            <button
              type="button"
              class="btn btn-refresh"
              (click)="resetFilters()"
              title="Đặt lại bộ lọc"
            >
              <i class="bi bi-arrow-counterclockwise"></i>
              <span>Đặt lại</span>
            </button>
          </div>
        </div>

        <!-- Filter Dropdowns Row -->
        <div class="filter-dropdowns-row">
          <div class="filter-item">
            <label class="filter-label"><i class="bi bi-signpost-2"></i> Tuyến đường:</label>
            <select class="form-select custom-select" [(ngModel)]="selectedRoute">
              <option value="ALL">Tất cả các tuyến đường</option>
              <option value="Đại lộ Võ Văn Kiệt">Đại lộ Võ Văn Kiệt</option>
              <option value="Tuyến Phố đi bộ Nguyễn Huệ">Phố đi bộ Nguyễn Huệ</option>
              <option value="Tuyến Bến Bạch Đằng & Tôn Đức Thắng">Bến Bạch Đằng & Tôn Đức Thắng</option>
              <option value="Trục Nam Kỳ Khởi Nghĩa - Hàm Nghi - Pasteur">Trục NKKN - Hàm Nghi - Pasteur</option>
              <option value="Cầu Calmette - Bến Vân Đồn - Cầu Ông Lãnh">Cầu Calmette - Bến Vân Đồn</option>
            </select>
          </div>

          <div class="filter-item">
            <label class="filter-label"><i class="bi bi-people-fill"></i> Đội tuần kiểm:</label>
            <select class="form-select custom-select" [(ngModel)]="selectedTeam">
              <option value="ALL">Tất cả các đội tuần kiểm</option>
              <option value="team-1">Đội Tuần kiểm Trung tâm Quận 1</option>
              <option value="team-2">Đội Tuần kiểm Hạ tầng Ven Sông</option>
              <option value="team-3">Tổ Phản ứng nhanh Thoát nước & GT</option>
            </select>
          </div>

          <div class="filter-item">
            <label class="filter-label"><i class="bi bi-clock-history"></i> Ca trực:</label>
            <select class="form-select custom-select" [(ngModel)]="selectedShift">
              <option value="ALL">Tất cả ca trực</option>
              <option value="SANG">Ca Sáng (06:00 - 12:00)</option>
              <option value="CHIEU">Ca Chiều (12:00 - 18:00)</option>
              <option value="TOI">Ca Tối (18:00 - 24:00)</option>
            </select>
          </div>

          <div class="filter-item">
            <label class="filter-label"><i class="bi bi-shield-check"></i> Trạng thái thẩm định:</label>
            <select class="form-select custom-select" [(ngModel)]="selectedStatus">
              <option value="ALL">Tất cả trạng thái</option>
              <option value="VERIFIED">Đã thẩm định đạt chuẩn</option>
              <option value="NEEDS_REVIEW">Cần kiểm tra / Giải trình</option>
              <option value="COMPLETED">Chưa thẩm tra</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 3. BẢNG DANH SÁCH KẾT QUẢ TUẦN KIỂM (UC 1) -->
      <div class="journal-table-card">
        <div class="table-card-head">
          <div class="head-left">
            <h3 class="table-title">Sổ Nhật Ký Kết Quả Tuần Kiểm Hạ Tầng Đô Thị</h3>
            <span class="count-pill">Hiển thị {{ filteredRecords.length }} ca tuần</span>
          </div>
          <div class="head-right">
            <span class="live-status-tag">
              <span class="pulse-dot"></span>
              <span>Dữ liệu đồng bộ trực tiếp từ App Mobile Hiện trường</span>
            </span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="custom-journal-table">
            <thead>
              <tr>
                <th class="col-code">MÃ SỔ NHẬT KÝ</th>
                <th class="col-time">NGÀY & CA TRỰC</th>
                <th class="col-route">TUYẾN ĐƯỜNG & LỘ TRÌNH</th>
                <th class="col-team">ĐỘI & TRƯỞNG KÍP</th>
                <th class="col-assets">RÀ SOÁT TÀI SẢN</th>
                <th class="col-issues">SỰ CỐ PHÁT HIỆN</th>
                <th class="col-eval">THẨM ĐỊNH BAN QLDA</th>
                <th class="col-actions text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let record of filteredRecords" [class.row-alert]="record.status === 'NEEDS_REVIEW'">
                <!-- 1. Mã Sổ -->
                <td class="col-code">
                  <div class="code-badge-group">
                    <span class="record-code">{{ record.code }}</span>
                    <span
                      class="shift-badge"
                      [ngClass]="{
                        'shift-morning': record.shift === 'SANG',
                        'shift-afternoon': record.shift === 'CHIEU',
                        'shift-night': record.shift === 'TOI'
                      }"
                    >
                      {{ record.shift === 'SANG' ? 'Ca Sáng' : record.shift === 'CHIEU' ? 'Ca Chiều' : 'Ca Tối' }}
                    </span>
                  </div>
                </td>

                <!-- 2. Ngày & Thời gian -->
                <td class="col-time">
                  <div class="time-main">
                    <i class="bi bi-calendar3 me-1 text-primary"></i>
                    <strong>{{ record.date }}</strong>
                  </div>
                  <div class="time-range text-muted">
                    <i class="bi bi-clock me-1"></i>
                    <span>{{ record.startTime }} - {{ record.endTime }}</span>
                  </div>
                </td>

                <!-- 3. Tuyến đường & Lộ trình -->
                <td class="col-route">
                  <div class="route-name" [title]="record.routeName">{{ record.routeName }}</div>
                  <div class="route-meta">
                    <span class="distance-tag">
                      <i class="bi bi-speedometer2"></i> {{ record.distanceKm }} km
                    </span>
                    <span class="gps-status-tag" [class.gps-ok]="record.gpsTrackStatus === 'VALID'" [class.gps-warn]="record.gpsTrackStatus === 'PARTIAL'">
                      <i class="bi bi-broadcast-pin"></i>
                      {{ record.gpsTrackStatus === 'VALID' ? 'GPS Khớp 100%' : 'Mất GPS đoạn ngắn' }}
                    </span>
                  </div>
                </td>

                <!-- 4. Đội & Trưởng kíp -->
                <td class="col-team">
                  <div class="team-name">{{ record.teamName }}</div>
                  <div class="lead-inspector">
                    <i class="bi bi-person-badge text-purple me-1"></i>
                    <span>{{ record.leadInspector }}</span>
                    <span class="members-count text-muted">({{ record.members.length }} người)</span>
                  </div>
                </td>

                <!-- 5. Rà soát tài sản -->
                <td class="col-assets">
                  <div class="assets-metric-row">
                    <span class="assets-total">
                      <i class="bi bi-box-seam me-1 text-primary"></i>
                      <strong>{{ record.totalAssetsChecked }}</strong> tài sản
                    </span>
                  </div>
                  <div class="assets-breakdown">
                    <span class="breakdown-item text-success" title="Hoạt động tốt / bình thường">
                      <i class="bi bi-check2"></i> {{ record.normalAssetsCount }} đạt
                    </span>
                    <span class="sep">•</span>
                    <span class="breakdown-item text-danger" *ngIf="record.issueAssetsCount > 0" title="Phát hiện hư hỏng / cần bảo dưỡng">
                      <i class="bi bi-exclamation-circle"></i> {{ record.issueAssetsCount }} lỗi
                    </span>
                    <span class="breakdown-item text-muted" *ngIf="record.issueAssetsCount === 0">
                      0 lỗi
                    </span>
                  </div>
                </td>

                <!-- 6. Sự cố phát hiện -->
                <td class="col-issues">
                  <div *ngIf="record.issuesFoundCount > 0" class="issue-pill-container">
                    <span class="issue-count-pill">
                      <i class="bi bi-exclamation-triangle-fill"></i>
                      <strong>{{ record.issuesFoundCount }}</strong> sự cố
                    </span>
                    <div class="issue-codes-preview" *ngIf="record.issueCodes && record.issueCodes.length > 0">
                      <span class="sub-code" *ngFor="let code of record.issueCodes">{{ code }}</span>
                    </div>
                  </div>
                  <div *ngIf="record.issuesFoundCount === 0" class="no-issue-pill">
                    <i class="bi bi-shield-check me-1"></i> Bình thường
                  </div>
                </td>

                <!-- 7. Thẩm định Ban QLDA -->
                <td class="col-eval">
                  <div class="eval-status-box">
                    <span
                      class="eval-badge"
                      [ngClass]="{
                        'badge-verified': record.status === 'VERIFIED',
                        'badge-review': record.status === 'NEEDS_REVIEW',
                        'badge-pending': record.status === 'COMPLETED'
                      }"
                    >
                      <i
                        class="bi me-1"
                        [ngClass]="{
                          'bi-check-circle-fill': record.status === 'VERIFIED',
                          'bi-exclamation-circle-fill': record.status === 'NEEDS_REVIEW',
                          'bi-hourglass-split': record.status === 'COMPLETED'
                        }"
                      ></i>
                      {{
                        record.status === 'VERIFIED'
                          ? 'Đã thẩm định'
                          : record.status === 'NEEDS_REVIEW'
                          ? 'Cần giải trình'
                          : 'Chờ duyệt'
                      }}
                    </span>
                  </div>
                  <div class="eval-notes-snippet" [title]="record.operationalNotes">
                    {{ record.operationalNotes }}
                  </div>
                </td>

                <!-- 8. Thao tác -->
                <td class="col-actions text-center">
                  <div class="action-btn-group">
                    <!-- Xem chi tiết (UC 2) -->
                    <button
                      type="button"
                      class="action-btn btn-view"
                      (click)="openDetailModal(record)"
                      title="Xem chi tiết kết quả tuần kiểm (UC 2)"
                    >
                      <i class="bi bi-eye-fill"></i>
                    </button>

                    <!-- Cập nhật thẩm tra (UC 4) -->
                    <button
                      type="button"
                      class="action-btn btn-edit"
                      (click)="openUpdateModal(record)"
                      title="Cập nhật thông tin / Thẩm định ca (UC 4)"
                    >
                      <i class="bi bi-pencil-square"></i>
                    </button>

                    <!-- Xóa kết quả (UC 5) -->
                    <button
                      type="button"
                      class="action-btn btn-delete"
                      (click)="openDeleteConfirm(record)"
                      title="Xóa kết quả tuần kiểm (UC 5)"
                    >
                      <i class="bi bi-trash3-fill"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="filteredRecords.length === 0">
                <td colspan="8" class="text-center py-5 text-muted">
                  <i class="bi bi-search fs-1 d-block mb-2 text-secondary"></i>
                  <span>Không tìm thấy bản ghi nhật ký tuần kiểm nào phù hợp với bộ lọc.</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 1: XEM CHI TIẾT THÔNG TIN TUẦN KIỂM (UC 2) -->
      <!-- ============================================================== -->
      <div class="modal-backdrop" *ngIf="selectedDetailRecord" (click)="closeDetailModal()">
        <div class="modal-content modal-detail-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="detail-header-titles">
              <div class="d-flex align-items-center gap-2">
                <span class="header-code-pill">{{ selectedDetailRecord.code }}</span>
                <span class="header-shift-badge">
                  {{ selectedDetailRecord.shift === 'SANG' ? 'Ca Sáng' : selectedDetailRecord.shift === 'CHIEU' ? 'Ca Chiều' : 'Ca Tối' }}
                </span>
                <span
                  class="badge"
                  [ngClass]="selectedDetailRecord.status === 'VERIFIED' ? 'bg-success' : 'bg-warning text-dark'"
                >
                  {{ selectedDetailRecord.status === 'VERIFIED' ? 'ĐÃ THẨM ĐỊNH' : 'CHỜ DUYỆT' }}
                </span>
              </div>
              <h3 class="detail-main-title mt-1">{{ selectedDetailRecord.routeName }}</h3>
              <p class="detail-subtitle mb-0 text-muted">
                <span>Ngày đi: <strong>{{ selectedDetailRecord.date }}</strong></span>
                <span class="dot-sep">•</span>
                <span>Khung giờ: <strong>{{ selectedDetailRecord.startTime }} - {{ selectedDetailRecord.endTime }}</strong></span>
                <span class="dot-sep">•</span>
                <span>Đơn vị: <strong>{{ selectedDetailRecord.teamName }}</strong></span>
              </p>
            </div>
            <button class="close-btn" (click)="closeDetailModal()" title="Đóng modal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="modal-body detail-modal-body">
            <!-- Sub-tabs in detail modal -->
            <div class="detail-tabs-bar">
              <button
                class="detail-tab-btn"
                [class.active]="activeDetailTab === 'OVERVIEW'"
                (click)="activeDetailTab = 'OVERVIEW'"
              >
                <i class="bi bi-info-circle-fill"></i>
                <span>1. Tổng Quan & Lộ Trình</span>
              </button>

              <button
                class="detail-tab-btn"
                [class.active]="activeDetailTab === 'ASSETS'"
                (click)="activeDetailTab = 'ASSETS'"
              >
                <i class="bi bi-box-seam-fill"></i>
                <span>2. Tài Sản Rà Soát ({{ selectedDetailRecord.totalAssetsChecked }})</span>
              </button>

              <button
                class="detail-tab-btn"
                [class.active]="activeDetailTab === 'ISSUES'"
                (click)="activeDetailTab = 'ISSUES'"
              >
                <i class="bi bi-exclamation-triangle-fill text-amber"></i>
                <span>3. Sự Cố Phát Hiện ({{ selectedDetailRecord.issuesFoundCount }})</span>
              </button>

              <button
                class="detail-tab-btn"
                [class.active]="activeDetailTab === 'EVALUATION'"
                (click)="activeDetailTab = 'EVALUATION'"
              >
                <i class="bi bi-patch-check-fill text-primary"></i>
                <span>4. Thẩm Định Ban QLDA</span>
              </button>
            </div>

            <!-- TAB CONTENT 1: TỔNG QUAN & LỘ TRÌNH -->
            <div class="tab-pane-content" *ngIf="activeDetailTab === 'OVERVIEW'">
              <div class="overview-info-grid">
                <div class="info-card">
                  <div class="info-title"><i class="bi bi-geo-fill text-danger me-1"></i> Quãng đường & Tọa độ</div>
                  <div class="info-metric">
                    <span class="metric-num">{{ selectedDetailRecord.distanceKm }}</span>
                    <span class="metric-lbl">km lộ trình</span>
                  </div>
                  <div class="info-desc">
                    Trạng thái GPS: <strong>{{ selectedDetailRecord.gpsTrackStatus === 'VALID' ? 'Hợp lệ 100%' : 'Mất tín hiệu cục bộ' }}</strong>
                  </div>
                </div>

                <div class="info-card">
                  <div class="info-title"><i class="bi bi-people-fill text-primary me-1"></i> Kíp trực thực hiện</div>
                  <div class="info-lead">Trưởng kíp: <strong>{{ selectedDetailRecord.leadInspector }}</strong></div>
                  <div class="members-roster mt-1">
                    <span class="member-tag" *ngFor="let m of selectedDetailRecord.members">
                      <i class="bi bi-person-check"></i> {{ m }}
                    </span>
                  </div>
                </div>

                <div class="info-card">
                  <div class="info-title"><i class="bi bi-truck text-success me-1"></i> Phương tiện & Thời tiết</div>
                  <div class="info-desc">
                    Phương tiện: <strong>{{ selectedDetailRecord.vehiclePlate || 'Xe bán tải chuyên dùng' }}</strong>
                  </div>
                  <div class="info-desc mt-1">
                    Thời tiết: <span>{{ selectedDetailRecord.weatherCondition || 'Nắng ráo, tầm nhìn tốt' }}</span>
                  </div>
                </div>
              </div>

              <!-- Map Simulation Banner -->
              <div class="map-simulation-banner mt-3">
                <div class="map-banner-header">
                  <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-map-fill text-primary"></i>
                    <strong>Hành trình GPS ca tuần kiểm số</strong>
                  </div>
                  <span class="badge bg-light text-dark border">Đối soát tuyến GIS</span>
                </div>
                <div class="map-visual-box">
                  <div class="map-route-visual">
                    <div class="route-line-pulse"></div>
                    <div class="checkpoint-node start-point">
                      <i class="bi bi-geo-alt-fill"></i>
                      <span>Khởi hành ({{ selectedDetailRecord.startTime }})</span>
                    </div>
                    <div class="checkpoint-node mid-point" *ngIf="selectedDetailRecord.issuesFoundCount > 0">
                      <i class="bi bi-exclamation-diamond-fill text-danger"></i>
                      <span>Điểm phát hiện sự cố</span>
                    </div>
                    <div class="checkpoint-node end-point">
                      <i class="bi bi-flag-fill"></i>
                      <span>Hoàn tất ({{ selectedDetailRecord.endTime }})</span>
                    </div>
                  </div>
                  <p class="map-caption text-muted text-center mt-2 fs-xs mb-0">
                    Toàn bộ tọa độ GPS từng điểm chốt trên tuyến <strong>{{ selectedDetailRecord.routeName }}</strong> đã được lưu vết và đối chiếu khớp với quy chuẩn tuần tra.
                  </p>
                </div>
              </div>
            </div>

            <!-- TAB CONTENT 2: TÀI SẢN ĐÃ RÀ SOÁT -->
            <div class="tab-pane-content" *ngIf="activeDetailTab === 'ASSETS'">
              <div class="assets-detail-list" *ngIf="selectedDetailRecord.checkedAssets && selectedDetailRecord.checkedAssets.length > 0">
                <div class="asset-detail-card" *ngFor="let asset of selectedDetailRecord.checkedAssets">
                  <div class="asset-card-left">
                    <div class="asset-code-badge">{{ asset.assetCode }}</div>
                    <div class="asset-name-title">{{ asset.assetName }}</div>
                    <div class="asset-meta-text text-muted">
                      <i class="bi bi-clock me-1"></i> Rà soát lúc: {{ asset.checkedAt }}
                    </div>
                    <div class="asset-notes" *ngIf="asset.notes">
                      <strong>Ghi chú:</strong> {{ asset.notes }}
                    </div>
                  </div>

                  <div class="asset-card-right">
                    <span
                      class="condition-pill"
                      [ngClass]="{
                        'cond-good': asset.condition === 'GOOD',
                        'cond-normal': asset.condition === 'NORMAL',
                        'cond-damaged': asset.condition === 'DAMAGED',
                        'cond-replace': asset.condition === 'NEEDS_REPLACEMENT'
                      }"
                    >
                      {{ getConditionLabel(asset.condition) }}
                    </span>
                    <img *ngIf="asset.photoUrl" [src]="asset.photoUrl" class="asset-thumb-img" alt="Ảnh hiện trường" />
                  </div>
                </div>
              </div>

              <div *ngIf="!selectedDetailRecord.checkedAssets || selectedDetailRecord.checkedAssets.length === 0" class="text-center py-4 text-muted">
                <i class="bi bi-info-circle fs-3 d-block mb-1"></i>
                <span>Tất cả {{ selectedDetailRecord.totalAssetsChecked }} tài sản trên tuyến đều đạt hiện trạng bình thường.</span>
              </div>
            </div>

            <!-- TAB CONTENT 3: SỰ CỐ PHÁT HIỆN -->
            <div class="tab-pane-content" *ngIf="activeDetailTab === 'ISSUES'">
              <div class="issues-detail-list" *ngIf="selectedDetailRecord.issues && selectedDetailRecord.issues.length > 0">
                <div class="issue-item-card" *ngFor="let issue of selectedDetailRecord.issues">
                  <div class="issue-item-header">
                    <div class="d-flex align-items-center gap-2">
                      <span class="issue-code-pill">{{ issue.code }}</span>
                      <span class="badge bg-secondary">{{ issue.layerName }}</span>
                      <span class="badge bg-danger" *ngIf="issue.priority === 'URGENT'">KHẨN CẤP</span>
                      <span class="badge bg-warning text-dark" *ngIf="issue.priority === 'HIGH'">ƯU TIÊN CAO</span>
                    </div>
                    <span class="status-pill-issue">{{ issue.status }}</span>
                  </div>

                  <div class="issue-item-body">
                    <div class="issue-body-text">
                      <h4 class="issue-title">{{ issue.title }}</h4>
                      <p class="issue-location text-muted mb-0">
                        <i class="bi bi-geo-alt-fill text-danger me-1"></i>
                        <span>{{ issue.location }}</span>
                      </p>
                    </div>
                    <img *ngIf="issue.photoUrl" [src]="issue.photoUrl" class="issue-thumb" alt="Ảnh sự cố" />
                  </div>
                </div>
              </div>

              <div *ngIf="!selectedDetailRecord.issues || selectedDetailRecord.issues.length === 0" class="alert alert-success m-0">
                <i class="bi bi-shield-check fs-5 me-2"></i>
                <span>Ca tuần kiểm này hoàn thành tốt và không phát sinh bất kỳ sự cố hạ tầng nào trên toàn tuyến!</span>
              </div>
            </div>

            <!-- TAB CONTENT 4: THẨM ĐỊNH BAN QLDA -->
            <div class="tab-pane-content" *ngIf="activeDetailTab === 'EVALUATION'">
              <div class="eval-detail-box">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h4 class="m-0 fs-6 text-dark font-semibold">
                    <i class="bi bi-shield-check text-primary me-1"></i>
                    Biên bản Thẩm định & Kết luận của Cán bộ Vận hành
                  </h4>
                  <button class="btn btn-sm btn-outline-primary" (click)="openUpdateModal(selectedDetailRecord)">
                    <i class="bi bi-pencil-square me-1"></i> Chỉnh sửa kết luận
                  </button>
                </div>

                <div class="eval-detail-rows">
                  <div class="eval-row">
                    <span class="eval-label">Trạng thái thẩm tra:</span>
                    <span class="eval-val font-semibold text-success">{{ selectedDetailRecord.status === 'VERIFIED' ? 'Đã thẩm định đạt chuẩn' : 'Chờ thẩm tra' }}</span>
                  </div>
                  <div class="eval-row">
                    <span class="eval-label">Người thẩm định:</span>
                    <span class="eval-val font-semibold">{{ selectedDetailRecord.verifiedBy || 'Cán bộ Vận hành Ban QLDA' }}</span>
                  </div>
                  <div class="eval-row">
                    <span class="eval-label">Thời gian thẩm định:</span>
                    <span class="eval-val text-muted">{{ selectedDetailRecord.verifiedAt || 'Chưa ghi nhận' }}</span>
                  </div>
                  <div class="eval-row">
                    <span class="eval-label">Kết luận & Chỉ đạo:</span>
                    <div class="eval-val eval-notes-text">
                      {{ selectedDetailRecord.operationalNotes }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeDetailModal()">Đóng</button>
            <button type="button" class="btn btn-primary" (click)="openUpdateModal(selectedDetailRecord)">
              <i class="bi bi-pencil-square me-1"></i> Cập nhật thông tin ca này
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 2: CẬP NHẬT THÔNG TIN TUẦN KIỂM (UC 4) -->
      <!-- ============================================================== -->
      <div class="modal-backdrop" *ngIf="editingRecord" (click)="closeUpdateModal()">
        <div class="modal-content modal-edit-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="m-0 fs-6 font-bold d-flex align-items-center gap-2">
              <i class="bi bi-pencil-square text-primary"></i>
              <span>Cập Nhật Thông Tin & Thẩm Định: {{ editingRecord.code }}</span>
            </h3>
            <button class="close-btn" (click)="closeUpdateModal()">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group mb-3">
              <label class="form-label font-semibold">Tuyến đường & Ca trực:</label>
              <input type="text" class="form-control" [value]="editingRecord.routeName + ' (' + editingRecord.date + ')'" disabled />
            </div>

            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label font-semibold">Trạng thái thẩm tra:</label>
                <select class="form-select" [(ngModel)]="editStatus">
                  <option value="VERIFIED">Đã thẩm định đạt chuẩn</option>
                  <option value="NEEDS_REVIEW">Cần giải trình / Kiểm tra lại</option>
                  <option value="COMPLETED">Chưa thẩm tra (Chờ duyệt)</option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label font-semibold">Xếp loại ca trực:</label>
                <select class="form-select" [(ngModel)]="editGrade">
                  <option value="DAT_YEU_CAU">Đạt yêu cầu</option>
                  <option value="DAT_CO_SU_CO">Đạt (kèm xử lý sự cố)</option>
                  <option value="VI_PHAM_LO_TRINH">Vi phạm lộ trình GPS</option>
                  <option value="CHUA_THAM_DINH">Chưa thẩm định</option>
                </select>
              </div>
            </div>

            <div class="form-group mb-3">
              <label class="form-label font-semibold">Ý kiến chỉ đạo / Kết luận thẩm định của Ban QLDA:</label>
              <textarea
                class="form-control"
                rows="4"
                placeholder="Nhập ý kiến chỉ đạo, thẩm định chất lượng ca tuần, hoặc yêu cầu khắc phục sự cố phát hiện..."
                [(ngModel)]="editOperationalNotes"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label font-semibold">Cán bộ thực hiện thẩm định:</label>
              <input type="text" class="form-control" [(ngModel)]="editVerifiedBy" placeholder="Họ và tên cán bộ thẩm tra" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeUpdateModal()">Hủy bỏ</button>
            <button type="button" class="btn btn-primary" (click)="saveUpdateRecord()">
              <i class="bi bi-check-lg me-1"></i> Lưu thông tin thẩm định
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 3: XÁC NHẬN XÓA KẾT QUẢ TUẦN KIỂM (UC 5) -->
      <!-- ============================================================== -->
      <div class="modal-backdrop" *ngIf="deletingRecord" (click)="closeDeleteConfirm()">
        <div class="modal-content modal-sm modal-delete-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header border-0 pb-0">
            <div class="delete-icon-wrap">
              <i class="bi bi-exclamation-triangle-fill text-danger"></i>
            </div>
            <button class="close-btn" (click)="closeDeleteConfirm()">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="modal-body text-center pt-2">
            <h4 class="delete-heading">Xác nhận xóa bản ghi?</h4>
            <p class="delete-text text-muted">
              Bạn có chắc chắn muốn xóa bản ghi sổ nhật ký tuần kiểm 
              <strong class="text-danger">{{ deletingRecord.code }}</strong> 
              ({{ deletingRecord.routeName }}) khỏi hệ thống? Thao tác này không thể hoàn tác.
            </p>
          </div>

          <div class="modal-footer border-0 justify-content-center pt-0">
            <button type="button" class="btn btn-secondary px-3" (click)="closeDeleteConfirm()">Hủy</button>
            <button type="button" class="btn btn-danger px-3" (click)="confirmDeleteRecord()">
              <i class="bi bi-trash3-fill me-1"></i> Xóa vĩnh viễn
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .journal-wrapper {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* 1. KPI STATS */
    .journal-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
      }
      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .stat-card {
      background: white;
      border: 1px solid var(--gray-200, #e2e8f0);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      transition: transform 0.15s ease;

      &:hover {
        transform: translateY(-2px);
      }

      .stat-meta {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .stat-label {
        font-size: 11px;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .stat-val-group {
        display: flex;
        align-items: baseline;
        gap: 5px;
      }

      .stat-val {
        font-size: 24px;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.1;

        &.text-emerald { color: #059669; }
        &.text-amber { color: #d97706; }
      }

      .stat-unit {
        font-size: 12.5px;
        color: #64748b;
        font-weight: 500;
      }

      .stat-sub {
        font-size: 11.5px;
        color: #94a3b8;
      }

      .stat-icon-wrap {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;

        &.icon-blue { background: #eff6ff; color: #2563eb; }
        &.icon-purple { background: #f3e8ff; color: #7c3aed; }
        &.icon-emerald { background: #ecfdf5; color: #059669; }
        &.icon-amber { background: #fffbeb; color: #d97706; }
      }
    }

    /* 2. FILTER & TOOLBAR */
    .journal-filter-card {
      background: white;
      border: 1px solid var(--gray-200, #e2e8f0);
      border-radius: 10px;
      padding: 16px 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .filter-top-row {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: space-between;
      flex-wrap: wrap;
    }

    .search-input-wrap {
      flex: 1;
      min-width: 300px;
      position: relative;
      display: flex;
      align-items: center;

      .search-icon {
        position: absolute;
        left: 12px;
        color: #94a3b8;
        font-size: 14px;
      }

      .custom-search-input {
        padding-left: 36px;
        padding-right: 32px;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        font-size: 13.5px;
        height: 38px;

        &:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
      }

      .btn-clear-search {
        position: absolute;
        right: 8px;
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 18px;
        cursor: pointer;
        padding: 0 4px;
        &:hover { color: #475569; }
      }
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;

      .btn-export-excel {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #166534;
        font-weight: 600;
        padding: 7px 14px;
        border-radius: 8px;
        font-size: 13px;
        transition: all 0.15s ease;

        &:hover {
          background: #dcfce7;
          border-color: #86efac;
        }
      }

      .btn-refresh {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #475569;
        font-weight: 500;
        padding: 7px 12px;
        border-radius: 8px;
        font-size: 13px;

        &:hover {
          background: #f1f5f9;
        }
      }
    }

    .filter-dropdowns-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;

      @media (max-width: 900px) {
        grid-template-columns: repeat(2, 1fr);
      }
      @media (max-width: 500px) {
        grid-template-columns: 1fr;
      }

      .filter-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .filter-label {
          font-size: 11.5px;
          font-weight: 600;
          color: #475569;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .custom-select {
          font-size: 12.5px;
          border-radius: 6px;
          border-color: #cbd5e1;
          height: 34px;
          padding: 4px 10px;
        }
      }
    }

    /* 3. TABLE CARD */
    .journal-table-card {
      background: white;
      border: 1px solid var(--gray-200, #e2e8f0);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }

    .table-card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-bottom: 1px solid #e2e8f0;
      background: #fafafa;
      flex-wrap: wrap;
      gap: 8px;

      .head-left {
        display: flex;
        align-items: baseline;
        gap: 8px;

        .table-title {
          font-size: 14.5px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .count-pill {
          font-size: 12px;
          color: #64748b;
        }
      }

      .live-status-tag {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #059669;
        font-weight: 500;

        .pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }
      }
    }

    .custom-journal-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;

      th {
        background: #f8fafc;
        color: #475569;
        font-weight: 700;
        font-size: 11px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        padding: 11px 14px;
        border-bottom: 1px solid #e2e8f0;
        white-space: nowrap;
      }

      td {
        padding: 12px 14px;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }

      tbody tr {
        transition: background-color 0.1s ease;
        &:hover {
          background-color: #f8fafc;
        }

        &.row-alert {
          background-color: #fffdf5;
        }
      }

      .col-code {
        width: 140px;
        .code-badge-group {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .record-code {
          font-weight: 700;
          color: #1e3a8a;
          font-size: 13px;
        }
        .shift-badge {
          display: inline-block;
          font-size: 10.5px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 3px;
          width: fit-content;

          &.shift-morning { background: #eff6ff; color: #1d4ed8; }
          &.shift-afternoon { background: #fff7ed; color: #c2410c; }
          &.shift-night { background: #f5f3ff; color: #6b21a8; }
        }
      }

      .col-time {
        width: 150px;
        .time-main { font-size: 12.5px; color: #1e293b; }
        .time-range { font-size: 11.5px; margin-top: 1px; }
      }

      .col-route {
        min-width: 200px;
        .route-name {
          font-weight: 600;
          color: #0f172a;
          line-height: 1.3;
        }
        .route-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 3px;
          font-size: 11px;
        }
        .distance-tag {
          color: #4338ca;
          font-weight: 600;
        }
        .gps-status-tag {
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 500;
          &.gps-ok { background: #ecfdf5; color: #065f46; }
          &.gps-warn { background: #fef2f2; color: #991b1b; }
        }
      }

      .col-team {
        width: 180px;
        .team-name { font-size: 12px; color: #334155; }
        .lead-inspector { font-size: 11.5px; font-weight: 600; color: #0f172a; margin-top: 2px; }
      }

      .col-assets {
        width: 130px;
        .assets-total { font-size: 12.5px; color: #0f172a; }
        .assets-breakdown { font-size: 11px; margin-top: 2px; display: flex; align-items: center; gap: 4px; }
      }

      .col-issues {
        width: 130px;
        .issue-count-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          padding: 2px 7px;
          border-radius: 4px;
          font-size: 11.5px;
          font-weight: 600;
        }
        .issue-codes-preview {
          margin-top: 2px;
          display: flex;
          gap: 3px;
          .sub-code {
            font-size: 10px;
            color: #64748b;
          }
        }
        .no-issue-pill {
          color: #059669;
          font-size: 11.5px;
          font-weight: 500;
        }
      }

      .col-eval {
        width: 180px;
        .eval-badge {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;

          &.badge-verified { background: #dcfce7; color: #15803d; }
          &.badge-review { background: #fef3c7; color: #b45309; }
          &.badge-pending { background: #f1f5f9; color: #64748b; }
        }
        .eval-notes-snippet {
          font-size: 11.5px;
          color: #64748b;
          margin-top: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 170px;
        }
      }

      .col-actions {
        width: 110px;
        .action-btn-group {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .action-btn {
          width: 28px;
          height: 28px;
          border-radius: 5px;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;

          &.btn-view {
            background: #eff6ff;
            color: #2563eb;
            border-color: #bfdbfe;
            &:hover { background: #dbeafe; }
          }
          &.btn-edit {
            background: #f8fafc;
            color: #475569;
            border-color: #cbd5e1;
            &:hover { background: #e2e8f0; color: #0f172a; }
          }
          &.btn-delete {
            background: #fef2f2;
            color: #ef4444;
            border-color: #fecaca;
            &:hover { background: #fee2e2; }
          }
        }
      }
    }

    /* MODAL SHARED STYLES */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(3px);
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow: hidden;

      &.modal-detail-dialog {
        width: 860px;
        max-width: 95vw;
      }
      &.modal-edit-dialog {
        width: 600px;
        max-width: 95vw;
      }
      &.modal-delete-dialog {
        width: 400px;
        max-width: 95vw;
      }
    }

    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;

      .header-code-pill {
        font-size: 13px;
        font-weight: 700;
        background: #1e3a8a;
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
      }
      .header-shift-badge {
        font-size: 11px;
        background: #eff6ff;
        color: #1d4ed8;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
      }
      .detail-main-title {
        font-size: 17px;
        font-weight: 700;
        color: #0f172a;
        margin: 4px 0 2px 0;
      }
      .detail-subtitle {
        font-size: 12px;
      }
      .dot-sep {
        margin: 0 6px;
        color: #cbd5e1;
      }
    }

    .close-btn {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 16px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      &:hover { color: #0f172a; background: #f1f5f9; }
    }

    .modal-body {
      padding: 18px 20px;
      overflow-y: auto;
    }

    .modal-footer {
      padding: 12px 20px;
      border-top: 1px solid #e2e8f0;
      background: #fafafa;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    /* DETAIL MODAL INNER */
    .detail-tabs-bar {
      display: flex;
      gap: 6px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 16px;

      .detail-tab-btn {
        background: none;
        border: none;
        padding: 6px 12px;
        font-size: 13px;
        font-weight: 600;
        color: #64748b;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.15s ease;

        &:hover { background: #f1f5f9; color: #0f172a; }
        &.active {
          background: #eff6ff;
          color: #2563eb;
        }
      }
    }

    .overview-info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;

      @media (max-width: 700px) {
        grid-template-columns: 1fr;
      }

      .info-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px 14px;

        .info-title {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 6px;
        }
        .info-metric {
          display: flex;
          align-items: baseline;
          gap: 4px;
          .metric-num { font-size: 22px; font-weight: 800; color: #0f172a; }
          .metric-lbl { font-size: 12px; color: #64748b; }
        }
        .info-desc {
          font-size: 12px;
          color: #334155;
        }
        .members-roster {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          .member-tag {
            font-size: 11px;
            background: white;
            border: 1px solid #cbd5e1;
            padding: 1px 6px;
            border-radius: 4px;
            color: #334155;
          }
        }
      }
    }

    .map-simulation-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 14px;

      .map-banner-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-size: 13px;
      }

      .map-visual-box {
        background: white;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 20px;
      }

      .map-route-visual {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 0;

        .route-line-pulse {
          position: absolute;
          left: 15px;
          right: 15px;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #10b981);
          border-radius: 2px;
        }

        .checkpoint-node {
          position: relative;
          z-index: 2;
          background: white;
          border: 2px solid #3b82f6;
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 11.5px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.06);

          &.mid-point {
            border-color: #ef4444;
            color: #dc2626;
          }
          &.end-point {
            border-color: #10b981;
            color: #059669;
          }
        }
      }
    }

    /* ASSETS DETAIL CARDS */
    .assets-detail-list {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .asset-detail-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;

        .asset-code-badge {
          font-size: 11.5px;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 2px;
        }
        .asset-name-title {
          font-size: 13.5px;
          font-weight: 600;
          color: #0f172a;
        }
        .asset-meta-text {
          font-size: 11.5px;
          margin-top: 2px;
        }
        .asset-notes {
          font-size: 12px;
          color: #334155;
          margin-top: 4px;
        }

        .asset-card-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .condition-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;

          &.cond-good { background: #dcfce7; color: #15803d; }
          &.cond-normal { background: #f1f5f9; color: #475569; }
          &.cond-damaged { background: #fee2e2; color: #b91c1c; }
          &.cond-replace { background: #ffedd5; color: #c2410c; }
        }

        .asset-thumb-img {
          width: 50px;
          height: 50px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid #cbd5e1;
        }
      }
    }

    /* ISSUES DETAIL CARDS */
    .issues-detail-list {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .issue-item-card {
        background: #fffdfa;
        border: 1px solid #fed7aa;
        border-radius: 8px;
        padding: 12px 14px;

        .issue-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .issue-code-pill {
            font-size: 12px;
            font-weight: 700;
            color: #9a3412;
            background: #ffedd5;
            padding: 2px 7px;
            border-radius: 4px;
          }
          .status-pill-issue {
            font-size: 11px;
            color: #64748b;
          }
        }

        .issue-item-body {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;

          .issue-title {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 4px 0;
          }
          .issue-location {
            font-size: 12px;
          }

          .issue-thumb {
            width: 60px;
            height: 60px;
            border-radius: 6px;
            object-fit: cover;
            border: 1px solid #fed7aa;
          }
        }
      }
    }

    /* EVALUATION DETAIL BOX */
    .eval-detail-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;

      .eval-detail-rows {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .eval-row {
        display: grid;
        grid-template-columns: 180px 1fr;
        font-size: 13px;

        .eval-label {
          color: #64748b;
          font-weight: 600;
        }

        .eval-notes-text {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px 12px;
          color: #0f172a;
          line-height: 1.5;
        }
      }
    }

    /* DELETE MODAL */
    .delete-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #fee2e2;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin: 0 auto;
    }
    .delete-heading {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 10px 0 6px 0;
    }
    .delete-text {
      font-size: 13px;
      line-height: 1.45;
      margin: 0;
    }
  `]
})
export class PatrolJournalComponent {
  patrolService = inject(PatrolService);

  // Search & Filter state
  searchKeyword = '';
  selectedRoute = 'ALL';
  selectedTeam = 'ALL';
  selectedShift = 'ALL';
  selectedStatus = 'ALL';

  // Modal State: Chi tiết (UC 2)
  selectedDetailRecord: PatrolInspectionRecord | null = null;
  activeDetailTab: 'OVERVIEW' | 'ASSETS' | 'ISSUES' | 'EVALUATION' = 'OVERVIEW';

  // Modal State: Cập nhật (UC 4)
  editingRecord: PatrolInspectionRecord | null = null;
  editStatus: any = 'VERIFIED';
  editGrade: any = 'DAT_YEU_CAU';
  editOperationalNotes = '';
  editVerifiedBy = 'KS. Lê Hoàng Long (Cán bộ Vận hành Ban QLDA)';

  // Modal State: Xóa (UC 5)
  deletingRecord: PatrolInspectionRecord | null = null;

  // Computed Filtered List
  get filteredRecords(): PatrolInspectionRecord[] {
    const records = this.patrolService.inspectionRecords();
    const kw = this.searchKeyword.toLowerCase().trim();

    return records.filter((rec) => {
      // 1. Keyword search (Mã, Tuyến đường, Trưởng kíp, Đội, Ghi chú)
      if (kw) {
        const matchCode = rec.code.toLowerCase().includes(kw);
        const matchRoute = rec.routeName.toLowerCase().includes(kw);
        const matchLead = rec.leadInspector.toLowerCase().includes(kw);
        const matchTeam = rec.teamName.toLowerCase().includes(kw);
        const matchNotes = (rec.operationalNotes || '').toLowerCase().includes(kw);
        const matchIssues = rec.issueCodes.some((c) => c.toLowerCase().includes(kw));

        if (!matchCode && !matchRoute && !matchLead && !matchTeam && !matchNotes && !matchIssues) {
          return false;
        }
      }

      // 2. Filter Route
      if (this.selectedRoute !== 'ALL' && !rec.routeName.includes(this.selectedRoute)) {
        return false;
      }

      // 3. Filter Team
      if (this.selectedTeam !== 'ALL' && rec.teamId !== this.selectedTeam) {
        return false;
      }

      // 4. Filter Shift
      if (this.selectedShift !== 'ALL' && rec.shift !== this.selectedShift) {
        return false;
      }

      // 5. Filter Status
      if (this.selectedStatus !== 'ALL' && rec.status !== this.selectedStatus) {
        return false;
      }

      return true;
    });
  }

  // KPIs
  get totalRecordsCount(): number {
    return this.patrolService.inspectionRecords().length;
  }

  get totalDistanceKm(): number {
    return this.patrolService.inspectionRecords().reduce((acc, r) => acc + r.distanceKm, 0);
  }

  get verifiedCount(): number {
    return this.patrolService.inspectionRecords().filter((r) => r.status === 'VERIFIED').length;
  }

  get verifiedPercent(): number {
    if (this.totalRecordsCount === 0) return 0;
    return Math.round((this.verifiedCount / this.totalRecordsCount) * 100);
  }

  get totalIssuesFound(): number {
    return this.patrolService.inspectionRecords().reduce((acc, r) => acc + r.issuesFoundCount, 0);
  }

  resetFilters() {
    this.searchKeyword = '';
    this.selectedRoute = 'ALL';
    this.selectedTeam = 'ALL';
    this.selectedShift = 'ALL';
    this.selectedStatus = 'ALL';
  }

  // --- ACTIONS (UC 2, UC 4, UC 5, UC 6) ---

  // UC 2: Xem chi tiết
  openDetailModal(record: PatrolInspectionRecord) {
    this.selectedDetailRecord = record;
    this.activeDetailTab = 'OVERVIEW';
  }

  closeDetailModal() {
    this.selectedDetailRecord = null;
  }

  // UC 4: Cập nhật thông tin
  openUpdateModal(record: PatrolInspectionRecord) {
    this.editingRecord = record;
    this.editStatus = record.status === 'CANCELLED' ? 'COMPLETED' : record.status;
    this.editGrade = record.evaluationGrade;
    this.editOperationalNotes = record.operationalNotes;
    this.editVerifiedBy = record.verifiedBy || 'KS. Lê Hoàng Long (Cán bộ Vận hành Ban QLDA)';
  }

  closeUpdateModal() {
    this.editingRecord = null;
  }

  saveUpdateRecord() {
    if (!this.editingRecord) return;

    this.patrolService.updateInspectionRecord(this.editingRecord.id, {
      status: this.editStatus,
      evaluationGrade: this.editGrade,
      operationalNotes: this.editOperationalNotes,
      verifiedBy: this.editVerifiedBy
    });

    // Update current detail if opened
    if (this.selectedDetailRecord && this.selectedDetailRecord.id === this.editingRecord.id) {
      this.selectedDetailRecord = {
        ...this.selectedDetailRecord,
        status: this.editStatus,
        evaluationGrade: this.editGrade,
        operationalNotes: this.editOperationalNotes,
        verifiedBy: this.editVerifiedBy
      };
    }

    this.closeUpdateModal();
  }

  // UC 5: Xóa kết quả
  openDeleteConfirm(record: PatrolInspectionRecord) {
    this.deletingRecord = record;
  }

  closeDeleteConfirm() {
    this.deletingRecord = null;
  }

  confirmDeleteRecord() {
    if (!this.deletingRecord) return;
    const id = this.deletingRecord.id;
    this.patrolService.deleteInspectionRecord(id);
    if (this.selectedDetailRecord && this.selectedDetailRecord.id === id) {
      this.closeDetailModal();
    }
    this.closeDeleteConfirm();
  }

  // UC 6: Xuất sổ nhật ký
  onExportCsv() {
    this.patrolService.exportInspectionRecordsToCsv(this.filteredRecords);
  }

  getConditionLabel(condition: AssetCondition): string {
    switch (condition) {
      case 'GOOD': return 'Hoạt động tốt';
      case 'NORMAL': return 'Bình thường';
      case 'DAMAGED': return 'Hư hỏng';
      case 'NEEDS_REPLACEMENT': return 'Cần thay thế';
      default: return condition;
    }
  }
}
