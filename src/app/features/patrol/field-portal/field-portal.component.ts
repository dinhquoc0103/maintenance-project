import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { PatrolService } from '../../../core/services/patrol.service';
import { ProjectService } from '../../../core/services/project.service';
import { PatrolIssue, PatrolSchedule, PatrolPersonnel, AttendanceStatus, AssetCondition } from '../../../core/models/patrol.model';
import { LayerId, Asset } from '../../../core/models/maintenance.model';

@Component({
  selector: 'app-field-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="field-portal-page">
      <!-- HEADER PORTAL HIỆN TRƯỜNG -->
      <header class="portal-header">
        <div class="header-top-row">
          <div class="portal-title-box">
            <div class="badge-role-pill">
              <i class="bi bi-person-workspace"></i>
              <span>CỔNG THÔNG TIN NHÂN VIÊN HIỆN TRƯỜNG (WEB FIELD PORTAL)</span>
            </div>
            <h1 class="portal-heading">Cổng Tác Nghiệp Tuần Kiểm & Khắc Phục Hiện Trường</h1>
            <p class="portal-sub">
              Điểm danh ca trực trực tiếp trên Web (UC 8), Báo cáo sự cố (UC 7) & Tiếp nhận khắc phục (UC 10)
            </p>
          </div>

          <!-- Persona Selector & Actions -->
          <div class="header-actions">
            <!-- Nút Điểm Danh Nổi Bật -->
            <button
              class="btn btn-success d-flex align-items-center gap-2 fw-bold pulse-btn"
              [class.active]="activeTab === 'ATTENDANCE'"
              (click)="activeTab = 'ATTENDANCE'"
            >
              <i class="bi bi-fingerprint fs-5"></i>
              <span>ĐIỂM DANH WEB (CHECK-IN)</span>
            </button>

            <!-- Đóng vai người dùng khi demo -->
            <div class="persona-selector-box">
              <span class="persona-label text-muted fs-xs">Đang đóng vai:</span>
              <select class="form-select form-select-sm persona-select" [(ngModel)]="currentPersona" (ngModelChange)="onPersonaChange()">
                <option value="TUAN_NAM">👮‍♂️ Trần Đình Nam (Nhân Viên Tuần Kiểm Tuyến)</option>
                <option value="THO_HAI">👨‍🔧 Nguyễn Văn Hải (Thợ Khắc Phục Sự Cố Nhanh)</option>
              </select>
            </div>

            <a routerLink="/patrol" class="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
              <i class="bi bi-box-arrow-left"></i>
              <span>Về Admin</span>
            </a>
          </div>
        </div>

        <!-- Role Banner Alert -->
        <div class="role-welcome-banner" [ngClass]="currentPersona === 'THO_HAI' ? 'banner-worker' : 'banner-patrol'">
          <div class="d-flex align-items-center gap-2">
            <i class="bi fs-5" [ngClass]="currentPersona === 'THO_HAI' ? 'bi-tools text-warning' : 'bi-shield-check text-primary'"></i>
            <div>
              <strong class="d-block">
                {{ currentPersona === 'THO_HAI' ? 'Tài khoản: Nguyễn Văn Hải • Đội Phản ứng nhanh Duy tu Quận 1' : 'Tài khoản: Trần Đình Nam • Đội Tuần kiểm Trung tâm Quận 1' }}
              </strong>
              <span class="fs-xs text-muted">
                {{ currentPersona === 'THO_HAI' 
                  ? 'Nhiệm vụ: Xem danh sách sự cố được giao (UC 10), tiếp nhận và báo cáo hoàn thành sau khi sửa xong.' 
                  : 'Nhiệm vụ: Xem lịch ca trực hôm nay (UC 8), tự bấm điểm danh vào ca và báo cáo sự cố mới phát sinh (UC 7).' }}
              </span>
            </div>
          </div>

          <div class="quick-status-chip">
            <span class="badge" [ngClass]="isCurrentWorkerCheckedIn ? 'bg-success' : 'bg-warning text-dark'">
              <i class="bi" [ngClass]="isCurrentWorkerCheckedIn ? 'bi-check-circle-fill' : 'bi-clock'"></i>
              {{ isCurrentWorkerCheckedIn ? 'Đã điểm danh vào ca' : 'Chưa điểm danh ca hôm nay' }}
            </span>
          </div>
        </div>

        <!-- 3 TABS RIÊNG BIỆT RÕ RÀNG -->
        <div class="portal-nav-tabs">
          <button
            class="tab-btn tab-highlight"
            [class.active]="activeTab === 'ATTENDANCE'"
            (click)="activeTab = 'ATTENDANCE'"
          >
            <i class="bi bi-fingerprint"></i>
            <span>1. Điểm Danh Ca Trực (Check-in Web - UC 8)</span>
            <span class="badge bg-success ms-1">ĐIỂM DANH TẠI ĐÂY</span>
          </button>

          <button
            class="tab-btn"
            [class.active]="activeTab === 'MY_ISSUES' || activeTab === 'REPORT'"
            (click)="activeTab = 'MY_ISSUES'"
          >
            <i class="bi bi-journal-check"></i>
            <span>2. Sổ Sự Cố Của Tôi & Ghi Nhận Mới (UC 7)</span>
            <span class="badge bg-danger ms-1" *ngIf="myRejectedIssuesCount > 0">{{ myRejectedIssuesCount }} bị từ chối</span>
            <span class="badge bg-primary ms-1" *ngIf="myRejectedIssuesCount === 0">{{ myReportedIssues.length }} vụ</span>
          </button>

          <button
            class="tab-btn"
            [class.active]="activeTab === 'TASKS'"
            (click)="activeTab = 'TASKS'"
          >
            <i class="bi bi-tools"></i>
            <span>3. Nhiệm Vụ Khắc Phục Được Giao (UC 10)</span>
            <span class="badge bg-warning text-dark ms-1">{{ myAssignedTasks.length }}</span>
          </button>
        </div>
      </header>

      <!-- BODY CONTENT -->
      <main class="portal-body">
        <!-- ==================== TAB 1: ĐIỂM DANH CA TRỰC WEB (UC 8) ==================== -->
        <div *ngIf="activeTab === 'ATTENDANCE'" class="attendance-portal-panel">
          <div class="row g-4">
            <!-- CỘT TRÁI: KHUNG ĐIỂM DANH TRỰC TIẾP TRÊN WEB -->
            <div class="col-lg-5">
              <div class="portal-box-card attendance-card">
                <div class="card-title-bar bg-success text-white">
                  <i class="bi bi-fingerprint fs-5"></i>
                  <h4 class="m-0 fw-bold fs-6">Trạm Điểm Danh Ca Trực Trực Tuyến (Web Check-in)</h4>
                </div>

                <div class="p-4">
                  <!-- Chọn Nhân Viên Điểm Danh -->
                  <div class="mb-3">
                    <label class="form-label fw-bold">Chọn nhân viên điểm danh (*):</label>
                    <select class="form-select" [(ngModel)]="checkInForm.personnelId" (ngModelChange)="onSelectCheckInPersonnel()">
                      <option *ngFor="let p of patrolService.personnel()" [value]="p.id">
                        {{ p.name }} ({{ p.code }}) - {{ p.teamName }}
                      </option>
                    </select>
                  </div>

                  <!-- Thông Tin Ca Trực & Địa Điểm Check-in -->
                  <div class="attendance-info-box mb-3">
                    <div class="info-row">
                      <span class="label">Ca trực hôm nay:</span>
                      <strong class="text-primary">{{ todaySchedule?.shift === 'SANG' ? 'Ca Sáng (06:00 - 11:30)' : todaySchedule?.shift === 'CHIEU' ? 'Ca Chiều' : 'Ca Tối' }}</strong>
                    </div>
                    <div class="info-row">
                      <span class="label">Tuyến đường:</span>
                      <strong>{{ todaySchedule?.routeName || 'Tuyến Nguyễn Huệ - Lê Lợi' }}</strong>
                    </div>
                    <div class="info-row">
                      <span class="label">Thời gian hiện tại:</span>
                      <strong class="font-monospace text-dark">{{ currentTimeString }}</strong>
                    </div>
                    <div class="info-row">
                      <span class="label">Trạm check-in:</span>
                      <select class="form-select form-select-sm" [(ngModel)]="checkInForm.location">
                        <option value="Công viên Tượng đài Bác Hồ (GPS: 10.7762, 106.7022)">Công viên Tượng đài Bác Hồ (GPS: 10.7762, 106.7022)</option>
                        <option value="Đầu đường Nguyễn Huệ - Lê Thánh Tôn">Đầu đường Nguyễn Huệ - Lê Thánh Tôn</option>
                        <option value="Ga ngầm Metro Nhà Hát Thành Phố">Ga ngầm Metro Nhà Hát Thành Phố</option>
                        <option value="Cột cờ Thủ Ngữ - Bến Bạch Đằng">Cột cờ Thủ Ngữ - Bến Bạch Đằng</option>
                      </select>
                    </div>
                  </div>

                  <!-- Trạng thái điểm danh hiện tại của nhân sự đang chọn -->
                  <div class="attendance-status-display mb-3" [class.checked]="selectedPersonnelRecord?.todayAttendance === 'CHECKED_IN'">
                    <div class="d-flex align-items-center gap-2">
                      <i class="bi fs-4" [ngClass]="selectedPersonnelRecord?.todayAttendance === 'CHECKED_IN' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle text-warning'"></i>
                      <div>
                        <div class="status-main-label">
                          {{ selectedPersonnelRecord?.todayAttendance === 'CHECKED_IN' ? 'ĐÃ ĐIỂM DANH VÀO CA' : 'CHƯA ĐIỂM DANH' }}
                        </div>
                        <div class="status-sub-label text-muted fs-xs" *ngIf="selectedPersonnelRecord?.todayAttendance === 'CHECKED_IN'">
                          Xác nhận lúc {{ selectedPersonnelRecord?.checkInTime }} tại {{ selectedPersonnelRecord?.checkInLocation }}
                        </div>
                        <div class="status-sub-label text-muted fs-xs" *ngIf="selectedPersonnelRecord?.todayAttendance !== 'CHECKED_IN'">
                          Vui lòng bấm nút bên dưới để ghi nhận điểm danh có mặt.
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- CỤM NÚT ĐIỂM DANH TO RÕ -->
                  <div class="d-flex flex-column gap-2">
                    <button
                      class="btn btn-success btn-lg w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 checkin-submit-btn"
                      (click)="executeWebCheckIn()"
                    >
                      <i class="bi bi-fingerprint fs-4"></i>
                      <span>{{ selectedPersonnelRecord?.todayAttendance === 'CHECKED_IN' ? 'CẬP NHẬT LẠI ĐIỂM DANH' : 'XÁC NHẬN ĐIỂM DANH VÀO CA (CHECK-IN)' }}</span>
                    </button>

                    <button
                      class="btn btn-outline-secondary btn-sm"
                      *ngIf="selectedPersonnelRecord?.todayAttendance === 'CHECKED_IN'"
                      (click)="executeCheckOut()"
                    >
                      <i class="bi bi-box-arrow-right"></i> Điểm danh kết thúc ca trực (Check-out)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- CỘT PHẢI: BẢNG THEO DÕI ĐIỂM DANH TOÀN ĐỘI HÔM NAY (LIVE ATTENDANCE BOARD) -->
            <div class="col-lg-7">
              <div class="portal-box-card">
                <div class="card-title-bar bg-light d-flex justify-content-between align-items-center">
                  <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-card-checklist text-primary"></i>
                    <h4 class="m-0 fw-bold fs-6">Danh Sách Điểm Danh Toàn Đội Hôm Nay (13/10/2026)</h4>
                  </div>
                  <span class="badge bg-primary">{{ checkedInCount }}/{{ patrolService.personnel().length }} đã điểm danh</span>
                </div>

                <div class="p-0 table-responsive">
                  <table class="table table-hover align-middle m-0 fs-xs">
                    <thead class="table-light">
                      <tr>
                        <th>Nhân sự</th>
                        <th>Tổ đội</th>
                        <th>Trạng thái</th>
                        <th>Giờ & Vị trí check-in</th>
                        <th class="text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let p of patrolService.personnel()">
                        <td>
                          <div class="fw-bold">{{ p.name }}</div>
                          <div class="text-muted font-monospace">{{ p.code }}</div>
                        </td>
                        <td>{{ p.teamName }}</td>
                        <td>
                          <span class="badge" [ngClass]="getAttendanceBadgeClass(p.todayAttendance)">
                            {{ getAttendanceLabel(p.todayAttendance) }}
                          </span>
                        </td>
                        <td>
                          <div *ngIf="p.checkInTime">
                            <span class="fw-bold text-success">{{ p.checkInTime }}</span>
                            <div class="text-muted text-truncate max-w-180">{{ p.checkInLocation }}</div>
                          </div>
                          <span *ngIf="!p.checkInTime" class="text-muted">Chưa có dữ liệu</span>
                        </td>
                        <td class="text-center">
                          <button
                            class="btn btn-xs btn-outline-success"
                            *ngIf="p.todayAttendance !== 'CHECKED_IN'"
                            (click)="quickCheckInUser(p.id)"
                            title="Điểm danh nhanh"
                          >
                            <i class="bi bi-check-lg"></i> Điểm danh
                          </button>
                          <span class="badge bg-light text-success border" *ngIf="p.todayAttendance === 'CHECKED_IN'">
                            <i class="bi bi-check2-all"></i> Hợp lệ
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== TAB 2: NHIỆM VỤ KHẮC PHỤC ĐƯỢC GIAO (UC 10) ==================== -->
        <div *ngIf="activeTab === 'TASKS'" class="tasks-portal-panel">
          <div class="panel-toolbar">
            <div class="d-flex align-items-center gap-2">
              <span class="fw-bold fs-6"><i class="bi bi-list-task text-primary"></i> Danh Sách Sự Cố Phân Công Cho Thợ (UC 10):</span>
              <select class="form-select form-select-sm status-filter" [(ngModel)]="taskStatusFilter">
                <option value="ALL">Tất cả nhiệm vụ ({{ myAssignedTasks.length }})</option>
                <option value="QUICK_FIXING">Đang xử lý ({{ countTasksByStatus('QUICK_FIXING') }})</option>
                <option value="NEW">Mới giao / Chờ tiếp nhận ({{ countTasksByStatus('NEW') }})</option>
                <option value="RESOLVED">Đã hoàn thành / Nghiệm thu ({{ countTasksByStatus('RESOLVED') }})</option>
              </select>
            </div>

            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-secondary" (click)="exportMyTasksExcel()">
                <i class="bi bi-file-earmark-excel-fill text-success"></i> Xuất Excel Nhiệm Vụ (UC 10)
              </button>
            </div>
          </div>

          <!-- Cards Grid Danh Sách Sự Cố Của Thợ -->
          <div class="tasks-cards-grid mt-3">
            <div
              *ngFor="let task of filteredTasks"
              class="worker-task-card"
              [class.resolved]="task.status === 'RESOLVED'"
            >
              <div class="task-card-header">
                <div class="d-flex align-items-center gap-2">
                  <span class="task-code">{{ task.code }}</span>
                  <span class="priority-pill" [ngClass]="'priority-' + task.priority.toLowerCase()">
                    {{ task.priority }}
                  </span>
                </div>
                <span class="status-badge" [ngClass]="'status-' + task.status.toLowerCase()">
                  {{ task.status === 'NEW' ? 'Chờ thợ tiếp nhận' : task.status === 'QUICK_FIXING' ? 'Đang sửa chữa' : 'Đã sửa xong' }}
                </span>
              </div>

              <div class="task-card-body">
                <div class="task-img-wrapper">
                  <img [src]="task.photoBeforeUrl" alt="Hiện trường" class="task-photo" />
                  <span class="img-label">ẢNH SỰ CỐ</span>
                </div>

                <div class="task-info-content">
                  <h3 class="task-title">{{ task.title }}</h3>
                  
                  <div class="task-meta-row">
                    <i class="bi bi-geo-alt-fill text-danger"></i>
                    <span><strong>{{ task.address }}</strong> ({{ task.routeName }})</span>
                  </div>

                  <div class="task-meta-row" *ngIf="task.assetCode">
                    <i class="bi bi-pin-angle-fill text-primary"></i>
                    <span>Tài sản: <strong>[{{ task.assetCode }}]</strong> {{ task.assetName }}</span>
                  </div>

                  <div class="task-instruction-box mt-2" *ngIf="task.quickFixDetails">
                    <div class="instruction-header">
                      <i class="bi bi-info-circle-fill text-primary"></i>
                      <strong>Chỉ đạo kỹ thuật từ Cán bộ:</strong>
                    </div>
                    <p class="instruction-note m-0">{{ task.quickFixDetails.resolutionNote || 'Yêu cầu khắc phục an toàn' }}</p>
                    <div class="d-flex justify-content-between mt-1 fs-xs text-muted">
                      <span>Hạn chót: <strong class="text-danger">{{ task.quickFixDetails.deadline }}</strong></span>
                      <span>Dự toán: <strong class="text-primary">{{ task.quickFixDetails.estimatedCost | number }} VNĐ</strong></span>
                    </div>
                  </div>

                  <!-- Thợ đã sửa xong nếu có ảnh sau -->
                  <div class="resolved-note-box mt-2" *ngIf="task.photoAfterUrl">
                    <div class="d-flex align-items-center gap-2 text-success fw-bold fs-xs">
                      <i class="bi bi-check-circle-fill"></i>
                      <span>Đã nộp ảnh sau khi sửa xong & biên bản hoàn thành</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Bar của Thợ (UC 10) -->
              <div class="task-card-footer">
                <div class="assigned-worker-tag fs-xs text-muted">
                  <i class="bi bi-person-fill"></i> Thợ phụ trách: <strong>{{ task.quickFixDetails?.assignedWorker || 'Nguyễn Văn Hải' }}</strong>
                </div>

                <div class="action-buttons-group">
                  <!-- Nút 1: Tiếp nhận nhiệm vụ -->
                  <button
                    class="btn btn-sm btn-outline-warning"
                    *ngIf="task.status === 'NEW'"
                    (click)="acceptTask(task)"
                  >
                    <i class="bi bi-play-circle-fill"></i> Tiếp Nhận Xử Lý
                  </button>

                  <!-- Nút 2: Báo cáo hoàn thành & Nộp ảnh -->
                  <button
                    class="btn btn-sm btn-success"
                    *ngIf="task.status === 'QUICK_FIXING'"
                    (click)="openReportCompletionModal(task)"
                  >
                    <i class="bi bi-camera-fill"></i> Báo Cáo Hoàn Thành (Nộp Ảnh)
                  </button>

                  <span class="badge bg-success py-2 px-3 fs-xs" *ngIf="task.status === 'RESOLVED'">
                    <i class="bi bi-check-lg"></i> Hoàn Thành Nghiệm Thu
                  </span>
                </div>
              </div>
            </div>

            <div *ngIf="filteredTasks.length === 0" class="empty-state text-center p-5 text-muted">
              <i class="bi bi-check2-circle fs-1 text-success"></i>
              <h4 class="mt-2">Không có sự cố nào trong bộ lọc này!</h4>
              <p class="fs-xs">Tất cả nhiệm vụ được giao đã hoàn tất hoặc chưa có nhiệm vụ mới.</p>
            </div>
          </div>
        </div>

        <!-- ==================== TAB 2: SỔ SỰ CỐ TUẦN KIỂM CỦA TÔI & GHI NHẬN MỚI (UC 7) ==================== -->
        <div *ngIf="activeTab === 'MY_ISSUES' || activeTab === 'REPORT'" class="my-issues-portal-panel">
          <!-- TOP TOOLBAR & KPI SUMMARY -->
          <div class="portal-box-card mb-3">
            <div class="card-title-bar bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-journal-text fs-5 text-primary"></i>
                <div>
                  <h4 class="m-0 fw-bold fs-6">Sổ Theo Dõi Sự Cố Tuần Kiểm Của Tôi (Hiện Trường - UC 7)</h4>
                  <p class="m-0 fs-xxs text-muted">
                    Quản lý danh sách sự cố do bạn phát hiện. Theo dõi phê duyệt, nhận phản hồi từ chối và cập nhật gửi lại thẩm tra.
                  </p>
                </div>
              </div>

              <!-- NÚT GHI NHẬN SỰ CỐ MỚI TO NỔI BẬT -->
              <button class="btn btn-primary d-flex align-items-center gap-2 fw-bold shadow-sm" (click)="openCreateIssueModal()">
                <i class="bi bi-plus-circle-fill fs-5"></i>
                <span>GHI NHẬN SỰ CỐ MỚI TẠI HIỆN TRƯỜNG</span>
              </button>
            </div>

            <!-- KPI CHIPS BAR (LƯỚI 4 CỘT CHUẨN KHÔNG BỊ VỠ GIAO DIỆN) -->
            <div class="kpi-chips-container border-bottom bg-white p-3">
              <div class="kpi-mini-grid">
                <div class="kpi-mini-card bg-light">
                  <span class="label">Tổng sự cố đã ghi nhận</span>
                  <strong class="val text-dark">{{ myReportedIssues.length }} vụ</strong>
                </div>
                <div class="kpi-mini-card bg-primary-subtle">
                  <span class="label">Mới gửi (Chờ duyệt)</span>
                  <strong class="val text-primary">{{ countMyIssuesByStatus('NEW') }} vụ</strong>
                </div>
                <div class="kpi-mini-card bg-danger-subtle border-danger">
                  <span class="label text-danger">🔴 Bị từ chối (Cần sửa lại)</span>
                  <strong class="val text-danger">{{ countMyIssuesByStatus('REJECTED') }} vụ</strong>
                </div>
                <div class="kpi-mini-card bg-success-subtle">
                  <span class="label">Đang xử lý / Hoàn thành</span>
                  <strong class="val text-success">{{ countMyIssuesByStatus('QUICK_FIXING') + countMyIssuesByStatus('RESOLVED') + countMyIssuesByStatus('MOVED_TO_PROJECT') }} vụ</strong>
                </div>
              </div>
            </div>

            <!-- SEARCH & STATUS FILTERS (TOOLBAR GỌN ĐẸP) -->
            <div class="my-issues-toolbar">
              <div class="search-input-box">
                <i class="bi bi-search text-muted"></i>
                <input
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="Tìm theo mã sự cố, tên, tuyến đường..."
                  [(ngModel)]="myIssuesSearchKeyword"
                />
              </div>

              <div class="filter-status-box">
                <span class="fs-xs text-muted">Lọc theo trạng thái:</span>
                <select class="form-select form-select-sm w-auto" [(ngModel)]="myIssuesStatusFilter">
                  <option value="ALL">Tất cả ({{ myReportedIssues.length }})</option>
                  <option value="REJECTED">🔴 Bị từ chối tiếp nhận ({{ countMyIssuesByStatus('REJECTED') }})</option>
                  <option value="NEW">Mới gửi (Chờ duyệt) ({{ countMyIssuesByStatus('NEW') }})</option>
                  <option value="QUICK_FIXING">Đang khắc phục ({{ countMyIssuesByStatus('QUICK_FIXING') }})</option>
                  <option value="RESOLVED">Đã hoàn thành / Nghiệm thu ({{ countMyIssuesByStatus('RESOLVED') }})</option>
                  <option value="MOVED_TO_PROJECT">Đã chuyển Dự Án ({{ countMyIssuesByStatus('MOVED_TO_PROJECT') }})</option>
                </select>
              </div>
            </div>
          </div>

          <!-- CARDS GRID SỰ CỐ CỦA TÔI -->
          <div class="my-issues-grid">
            <div
              *ngFor="let iss of filteredMyIssues"
              class="my-issue-card"
              [class.rejected-border]="iss.status === 'REJECTED'"
            >
              <!-- Card Top -->
              <div class="my-issue-top">
                <div class="d-flex align-items-center gap-2">
                  <span class="issue-code font-monospace fw-bold">{{ iss.code }}</span>
                  <span class="priority-pill" [ngClass]="'priority-' + iss.priority.toLowerCase()">{{ iss.priority }}</span>
                  <span class="layer-pill" [style.background-color]="getLayerColor(iss.layerId) + '20'" [style.color]="getLayerColor(iss.layerId)">
                    {{ iss.categoryName }}
                  </span>
                </div>

                <span class="status-badge" [ngClass]="'status-' + iss.status.toLowerCase()">
                  {{ getStatusLabel(iss.status) }}
                </span>
              </div>

              <!-- Card Body -->
              <div class="my-issue-body">
                <div class="img-box">
                  <img [src]="iss.photoBeforeUrl" alt="Hiện trường" />
                  <span class="time-tag">{{ iss.reportedAt }}</span>
                </div>

                <div class="info-box">
                  <h4 class="issue-title">{{ iss.title }}</h4>
                  <div class="meta-line text-muted fs-xs">
                    <i class="bi bi-geo-alt-fill text-danger"></i>
                    <span><strong>{{ iss.address }}</strong> ({{ iss.routeName }})</span>
                  </div>

                  <!-- Danh sách nhiều tài sản cùng loại (Nguyên tắc 2) -->
                  <div class="attached-assets-chips mt-2" *ngIf="iss.attachedAssets && iss.attachedAssets.length > 0">
                    <span class="chip-title fs-xxs text-muted d-block mb-1">
                      <i class="bi bi-diagram-3-fill text-primary"></i> Đính kèm {{ iss.attachedAssets.length }} tài sản cùng loại (Nguyên tắc 2):
                    </span>
                    <div class="d-flex flex-wrap gap-1">
                      <span class="badge bg-light text-dark border" *ngFor="let a of iss.attachedAssets">
                        [{{ a.assetCode }}] {{ a.assetName }}
                      </span>
                    </div>
                  </div>

                  <div class="single-asset-line mt-1 fs-xs text-muted" *ngIf="(!iss.attachedAssets || iss.attachedAssets.length === 0) && iss.assetCode">
                    <i class="bi bi-pin-angle-fill text-primary"></i>
                    <span>Tài sản: <strong>[{{ iss.assetCode }}]</strong> {{ iss.assetName }}</span>
                  </div>

                  <p class="issue-desc text-muted fs-xs mt-2 m-0">{{ iss.description }}</p>

                  <!-- ==================== KHUNG CẢNH BÁO BỊ TỪ CHỐI TIẾP NHẬN ==================== -->
                  <div class="rejected-alert-card mt-3" *ngIf="iss.status === 'REJECTED'">
                    <div class="d-flex align-items-start gap-2">
                      <i class="bi bi-exclamation-octagon-fill text-danger fs-4 mt-0 flex-shrink-0"></i>
                      <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center flex-wrap">
                          <strong class="text-danger fs-xs">CÁN BỘ QUẢN LÝ TỪ CHỐI TIẾP NHẬN:</strong>
                          <span class="fs-xxs text-muted">{{ iss.rejectedAt }} • {{ iss.rejectedBy }}</span>
                        </div>
                        <div class="reject-reason-box mt-1">
                          "{{ iss.rejectReason }}"
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
                          <span class="fs-xxs text-muted">
                            <i class="bi bi-info-circle"></i> Sự cố chưa đóng. Vui lòng bấm nút bên để sửa và gửi lại thẩm tra.
                          </span>
                          <button class="btn btn-sm btn-danger fw-bold d-flex align-items-center gap-1 shadow-sm" (click)="openEditRejectedIssueModal(iss)">
                            <i class="bi bi-pencil-square"></i>
                            <span>CẬP NHẬT & GỬI LẠI THẨM TRA</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- ==================== KHUNG THÔNG BÁO VỪA GỬI LẠI ĐANG CHỜ DUYỆT ==================== -->
                  <div class="resubmitted-alert-card mt-2 p-2 rounded" *ngIf="iss.resubmittedAt && iss.status === 'NEW'">
                    <div class="d-flex align-items-center gap-2">
                      <i class="bi bi-arrow-repeat text-warning fs-5"></i>
                      <div class="fs-xs">
                        <strong>Bạn đã cập nhật & gửi lại:</strong>
                        <span class="text-muted ms-1">({{ iss.resubmittedAt }})</span>
                        <div class="text-dark fs-xxs" *ngIf="iss.resubmitNotes">
                          <strong>Giải trình:</strong> {{ iss.resubmitNotes }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="filteredMyIssues.length === 0" class="empty-state text-center p-5 text-muted bg-white rounded border">
              <i class="bi bi-inbox fs-1 text-muted"></i>
              <h5 class="mt-2">Không tìm thấy sự cố nào trong bộ lọc!</h5>
              <p class="fs-xs">Bấm nút "Ghi Nhận Sự Cố Mới Tại Hiện Trường" bên trên để tạo báo cáo đầu tiên.</p>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- MODAL BÁO CÁO HOÀN THÀNH (DÀNH CHO THỢ - UC 10) -->
    <div class="custom-modal-backdrop" *ngIf="showCompletionModal">
      <div class="custom-modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title"><i class="bi bi-camera-fill"></i> Báo Cáo Hoàn Thành Sự Cố (UC 10)</h5>
            <button class="btn-close btn-close-white" (click)="showCompletionModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="p-2 bg-light rounded fs-xs mb-3">
              <strong>[{{ completingTask?.code }}]</strong> {{ completingTask?.title }}
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Ảnh chụp nghiệm thu sau khi sửa xong (*):</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="completionForm.afterPhotoUrl" />
              <div class="mt-2 preview-box" *ngIf="completionForm.afterPhotoUrl">
                <img [src]="completionForm.afterPhotoUrl" alt="Sau khi sửa" style="height: 120px; width: 100%; object-fit: cover; border-radius: 6px;" />
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Hiện trạng tài sản sau khắc phục (*):</label>
              <select class="form-select form-select-sm" [(ngModel)]="completionForm.finalCondition">
                <option value="GOOD">🟢 Hoạt động tốt (Đạt yêu cầu)</option>
                <option value="NORMAL">🔵 Bình thường (Khắc phục tạm)</option>
                <option value="DAMAGED">🔴 Còn lỗi / Hư hỏng</option>
                <option value="NEEDS_REPLACEMENT">🟠 Cần thay thế toàn bộ</option>
              </select>
              <div class="text-muted fs-xxs mt-1">Lưu vết hiện trạng kỹ thuật theo lần xử lý này • Không làm biến động hồ sơ tài sản gốc</div>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Biên bản / Báo cáo kỹ thuật sửa chữa:</label>
              <textarea class="form-control form-control-sm" rows="3" [(ngModel)]="completionForm.note" placeholder="Mô tả các công việc đã thực hiện, vật tư thay thế..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="showCompletionModal = false">Hủy</button>
            <button class="btn btn-success btn-sm" (click)="submitCompletion()">
              <i class="bi bi-check-circle-fill"></i> Nộp Báo Cáo Hoàn Thành
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL GHI NHẬN / CẬP NHẬT SỰ CỐ HIỆN TRƯỜNG (CHUẨN 3 NGUYÊN TẮC & BẢN ĐỒ GIS TƯƠNG TÁC) -->
    <div class="custom-modal-backdrop" *ngIf="showIssueModal">
      <div class="custom-modal-dialog modal-xl">
        <!-- Modal Header -->
        <div class="custom-header-bar" [ngClass]="isEditingIssue ? 'header-rejected' : 'header-create'">
          <div class="d-flex align-items-center gap-2">
            <i class="bi fs-5" [ngClass]="isEditingIssue ? 'bi-arrow-clockwise' : 'bi-camera-fill'"></i>
            <div>
              <h5 class="modal-title m-0 fw-bold">
                {{ isEditingIssue ? ('Cập Nhật & Gửi Lại Sự Cố [' + editingIssue?.code + '] (Sau Khi Bị Từ Chối)') : 'Ghi Nhận Sự Cố Hạ Tầng Tại Hiện Trường (Chuẩn 3 Nguyên Tắc GIS)' }}
              </h5>
              <p class="m-0 fs-xxs opacity-75">
                {{ isEditingIssue ? 'Sửa lại ảnh, vị trí hoặc bổ sung tài sản GIS để Quản lý thẩm tra lại' : '1 báo cáo - 1 loại vấn đề - chọn nhiều tài sản cùng loại gắn vào sự cố' }}
              </p>
            </div>
          </div>
          <button class="btn-close btn-close-white" (click)="closeIssueModal()"></button>
        </div>

        <!-- Banner 3 Nguyên Tắc Cốt Lõi -->
        <div class="principles-banner p-2 px-3 bg-light border-bottom">
          <div class="d-flex align-items-center gap-2 fs-xs flex-wrap">
            <span class="badge bg-dark">3 NGUYÊN TẮC NGHIỆP VỤ:</span>
            <span><strong>1:</strong> 1 báo cáo = 1 Layer.</span>
            <span class="text-muted">•</span>
            <span><strong>2:</strong> Được chọn nhiều tài sản cùng loại (vd: các vị trí lún liên tiếp).</span>
            <span class="text-muted">•</span>
            <span><strong>3:</strong> Người đi tuần tự đánh giá hiện trường, phần mềm quản lý dữ liệu.</span>
          </div>
        </div>

        <!-- Modal Body Split Layout -->
        <div class="custom-modal-body p-3">
          <!-- Nếu đang sửa sự cố bị từ chối, hiển thị lý do từ chối -->
          <div class="alert alert-danger p-2 fs-xs mb-3 d-flex align-items-center gap-2" *ngIf="isEditingIssue">
            <i class="bi bi-exclamation-octagon-fill fs-5 text-danger flex-shrink-0"></i>
            <div>
              <strong>Lý do Quản lý từ chối trước đó:</strong>
              <span class="ms-1">{{ editingIssue?.rejectReason }}</span>
              <div class="text-muted fs-xxs mt-0">Từ chối bởi {{ editingIssue?.rejectedBy }} lúc {{ editingIssue?.rejectedAt }}</div>
            </div>
          </div>

          <div class="modal-split-layout">
            <!-- CỘT TRÁI (50%): FORM NHẬP LIỆU CÓ SPACING VÀ SECTION RÕ RÀNG -->
            <div class="modal-form-col">
              <!-- KHỐI 1: CHỌN LỚP HẠ TẦNG GIS & LOẠI VẤN ĐỀ (BƯỚC 1 & 2) -->
              <div class="modal-form-section mb-3">
                <div class="section-title-tag">
                  <i class="bi bi-diagram-3-fill text-primary"></i>
                  <span>BƯỚC 1 & 2: PHÂN LOẠI HẠ TẦNG GIS & LOẠI VẤN ĐỀ SỰ CỐ</span>
                </div>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label fw-bold fs-xs d-flex justify-content-between align-items-center mb-1">
                      <span>1. Lớp Dữ Liệu Hạ Tầng GIS (*):</span>
                      <span class="badge bg-secondary-subtle text-secondary font-normal fs-xxs">1 Báo cáo = 1 Layer</span>
                    </label>
                    <select
                      class="form-select form-select-sm fw-semibold"
                      [ngModel]="issueModalForm.layerId"
                      (ngModelChange)="onSelectLayer($event)"
                    >
                      <option value="ROADWAY">🛣️ Mặt đường & Biển báo (Lớp ROADWAY)</option>
                      <option value="LIGHTING">💡 Chiếu sáng đô thị (Lớp LIGHTING)</option>
                      <option value="GREENERY">🌳 Cây xanh & Công viên (Lớp GREENERY)</option>
                      <option value="DRAINAGE">🚰 Thoát nước & Hố ga (Lớp DRAINAGE)</option>
                    </select>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label fw-bold fs-xs mb-1">2. Loại Vấn Đề Hạ Tầng (* Lọc theo Lớp):</label>
                    <select class="form-select form-select-sm" [(ngModel)]="issueModalForm.categoryId">
                      <option *ngFor="let cat of availableCategories" [value]="cat.id">
                        [{{ cat.code }}] {{ cat.name }} (Ưu tiên: {{ cat.defaultPriority }})
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- KHỐI 2: CHỌN NHIỀU TÀI SẢN CÙNG LOẠI (NGUYÊN TẮC 2) -->
              <div class="modal-form-section mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <div class="section-title-tag m-0">
                    <i class="bi bi-geo-alt-fill text-primary"></i>
                    <span>3. CHỌN TÀI SẢN GIS CÙNG LOẠI GẮN VÀO BÁO CÁO (*)</span>
                  </div>
                  <span class="badge" [ngClass]="issueModalForm.selectedAssetIds.length > 0 ? 'bg-success' : 'bg-secondary'">
                    Đã chọn {{ issueModalForm.selectedAssetIds.length }} tài sản
                  </span>
                </div>
                <p class="fs-xxs text-muted m-0 mb-2">
                  Nguyên tắc 2: Nếu có nhiều điểm hư hỏng cùng loại liên tiếp (vd: 3 vị trí lún trên đoạn đường), tick chọn cả 3 tài sản vào 1 báo cáo.
                </p>

                <!-- Search & List assets -->
                <div class="assets-picker-box">
                  <div class="input-group input-group-sm mb-2">
                    <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Tìm mã hoặc tên tài sản trong lớp..."
                      [(ngModel)]="assetSearchKeyword"
                    />
                    <button class="btn btn-outline-secondary" type="button" *ngIf="assetSearchKeyword" (click)="assetSearchKeyword = ''">
                      <i class="bi bi-x"></i>
                    </button>
                  </div>

                  <div class="assets-scroll-list">
                    <div
                      *ngFor="let ast of filteredAvailableAssets"
                      class="asset-item-row"
                      [class.selected]="isAssetSelected(ast.id)"
                      (click)="toggleAssetSelection(ast)"
                    >
                      <input
                        type="checkbox"
                        class="form-check-input m-0 flex-shrink-0"
                        [checked]="isAssetSelected(ast.id)"
                        (click)="$event.stopPropagation()"
                        (change)="toggleAssetSelection(ast)"
                      />
                      <div class="flex-grow-1 min-w-0">
                        <div class="d-flex justify-content-between">
                          <strong class="font-monospace text-primary fs-xs">{{ ast.code }}</strong>
                          <span class="badge bg-light text-muted fs-xxs">{{ ast.chainage || 'Đô thị' }}</span>
                        </div>
                        <div class="text-truncate fw-semibold text-dark fs-xs">{{ ast.name }}</div>
                        <div class="text-truncate text-muted fs-xxs"><i class="bi bi-geo-alt"></i> {{ ast.address }}</div>
                      </div>
                    </div>

                    <div *ngIf="filteredAvailableAssets.length === 0" class="p-3 text-center text-muted fs-xs">
                      Không có tài sản nào phù hợp từ khóa
                    </div>
                  </div>
                </div>
              </div>

              <!-- KHỐI 3: THÔNG TIN SỰ CỐ & HIỆN TRƯỜNG (BƯỚC 4) -->
              <div class="modal-form-section mb-3">
                <div class="section-title-tag mb-2">
                  <i class="bi bi-file-earmark-text-fill text-primary"></i>
                  <span>4. TIÊU ĐỀ & CHI TIẾT HIỆN TRƯỜNG</span>
                </div>

                <div class="mb-3">
                  <label class="form-label fw-bold fs-xs mb-1">Tiêu Đề Sự Cố Phát Hiện (*):</label>
                  <input
                    type="text"
                    class="form-control form-control-sm"
                    [(ngModel)]="issueModalForm.title"
                    placeholder="VD: Mặt đường sụt lún ổ gà 3 điểm liên tiếp..."
                  />
                </div>

                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label fs-xs mb-1 fw-semibold">Tọa độ GPS hiện trường:</label>
                    <div class="input-group input-group-sm">
                      <input type="text" class="form-control font-monospace" [value]="issueModalForm.lat.toFixed(5) + ', ' + issueModalForm.lng.toFixed(5)" readonly />
                      <button class="btn btn-outline-secondary" type="button" (click)="refreshGPSInModal()" title="Cập nhật GPS">
                        <i class="bi bi-arrow-clockwise"></i>
                      </button>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fs-xs mb-1 fw-semibold">Tuyến đường:</label>
                    <input type="text" class="form-control form-control-sm" [(ngModel)]="issueModalForm.routeName" />
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label fs-xs mb-1 fw-semibold">Địa chỉ số nhà cụ thể:</label>
                  <input type="text" class="form-control form-control-sm" [(ngModel)]="issueModalForm.address" />
                </div>

                <!-- ẢNH HIỆN TRƯỜNG -->
                <div class="mb-3">
                  <label class="form-label fw-bold fs-xs mb-1">Ảnh Chụp Hiện Trường (*):</label>
                  <div class="sample-photos-row mb-2">
                    <div
                      *ngFor="let sample of samplePhotos"
                      class="sample-photo-btn"
                      [class.active]="issueModalForm.photoUrl === sample.url"
                      (click)="issueModalForm.photoUrl = sample.url"
                    >
                      <img [src]="sample.url" alt="" />
                      <span>{{ sample.title }}</span>
                    </div>
                  </div>
                  <div class="current-photo-view" *ngIf="issueModalForm.photoUrl">
                    <img [src]="issueModalForm.photoUrl" alt="Ảnh hiện trường" />
                    <span class="tag-attached"><i class="bi bi-check2"></i> Đã đính kèm ảnh</span>
                  </div>
                </div>

                <!-- MÔ TẢ HIỆN TRẠNG -->
                <div class="mb-2">
                  <label class="form-label fs-xs mb-1 fw-semibold">Mô tả hiện trạng chi tiết:</label>
                  <textarea
                    class="form-control form-control-sm"
                    rows="3"
                    [(ngModel)]="issueModalForm.description"
                    placeholder="Mô tả mức độ hư hại, kích thước (rộng x sâu)..."
                  ></textarea>
                </div>

                <!-- NẾU RESUBMIT: GIẢI TRÌNH CẬP NHẬT -->
                <div class="mt-3 p-3 bg-danger-subtle border border-danger-subtle rounded-3" *ngIf="isEditingIssue">
                  <label class="form-label fw-bold fs-xs text-danger mb-1 d-flex align-items-center gap-1">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    <span>Nội Dung Giải Trình & Bổ Sung Gửi Lại Cho Quản Lý (*):</span>
                  </label>
                  <textarea
                    class="form-control form-control-sm border-danger"
                    rows="2"
                    [(ngModel)]="issueModalForm.resubmitNote"
                    placeholder="VD: Em đã ra chụp lại ảnh góc nghiêng 45 độ đo độ lún và chọn thêm tài sản liền kề theo chỉ đạo."
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- CỘT PHẢI (50%): BẢN ĐỒ GIS TƯƠNG TÁC RỘNG RÃI -->
            <div class="modal-map-col">
              <div class="map-toolbar-box">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-map-fill text-primary"></i>
                  <strong class="fs-xs">Bản Đồ Số GIS: Lớp {{ getLayerName(issueModalForm.layerId) }}</strong>
                </div>
                <div class="d-flex align-items-center gap-1">
                  <button class="btn btn-xs btn-outline-primary" type="button" (click)="fitMapToSelected()">
                    <i class="bi bi-arrows-angle-expand"></i> Bao quát
                  </button>
                  <button class="btn btn-xs btn-outline-success" type="button" (click)="centerMapOnUser()">
                    <i class="bi bi-geo-alt"></i> Vị trí của tôi
                  </button>
                </div>
              </div>

              <!-- MAP CONTAINER -->
              <div class="modal-map-wrapper">
                <div #issueModalMapContainer class="modal-leaflet-map"></div>
              </div>

              <div class="map-helper-tip mt-2">
                <i class="bi bi-info-circle-fill text-primary"></i>
                <span>
                  Bản đồ hiển thị các tài sản thuộc <strong>Lớp {{ getLayerName(issueModalForm.layerId) }}</strong>. Bấm trực tiếp vào điểm tài sản trên bản đồ để chọn/bỏ chọn. Điểm số (1, 2, 3...) và đường nối thể hiện các tài sản được gắn chung vào sự cố này.
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="custom-modal-footer">
          <button class="btn btn-secondary btn-sm" (click)="closeIssueModal()">Hủy bỏ</button>
          <button
            class="btn btn-sm fw-bold"
            [ngClass]="isEditingIssue ? 'btn-danger' : 'btn-primary'"
            [disabled]="!issueModalForm.title.trim() || issueModalForm.selectedAssetIds.length === 0"
            (click)="submitIssueModal()"
          >
            <i class="bi" [ngClass]="isEditingIssue ? 'bi-send-check' : 'bi-send-fill'"></i>
            <span>
              {{ isEditingIssue ? 'GỬI LẠI CHO QUẢN LÝ THẨM TRA' : ('GỬI BÁO CÁO VỀ ADMIN (' + issueModalForm.selectedAssetIds.length + ' TÀI SẢN)') }}
            </span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .field-portal-page {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: calc(100vh - 64px);
      background: #f1f5f9;
    }

    .portal-header {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-lg);
      padding: 16px 20px 0 20px;
      box-shadow: var(--shadow-sm);
    }

    .header-top-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;

      .portal-title-box {
        .badge-role-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fef3c7;
          color: #b45309;
          font-weight: 700;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 4px;
          margin-bottom: 4px;
        }

        .portal-heading {
          font-size: 20px;
          font-weight: 700;
          color: var(--gray-900);
          margin: 0;
        }

        .portal-sub {
          font-size: 12.5px;
          color: var(--gray-500);
          margin: 2px 0 0 0;
        }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;

        .pulse-btn {
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          animation: pulseGreen 2s infinite;
        }

        .persona-selector-box {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          border: 1px solid var(--gray-300);
          border-radius: 6px;
          padding: 4px 8px;

          .persona-select {
            border: none;
            background: none;
            font-weight: 600;
            cursor: pointer;
            width: auto;
          }
        }
      }
    }

    @keyframes pulseGreen {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .role-welcome-banner {
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      &.banner-worker { background: #fffbeb; border: 1px solid #fde68a; }
      &.banner-patrol { background: #eff6ff; border: 1px solid #bfdbfe; }
    }

    .portal-nav-tabs {
      display: flex;
      gap: 4px;
      margin-top: 12px;
      border-bottom: 1px solid var(--gray-200);

      .tab-btn {
        padding: 12px 20px;
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

        &:hover { color: var(--gray-900); }

        &.active {
          color: var(--primary-600);
          border-bottom-color: var(--primary-600);
        }

        &.tab-highlight.active {
          color: #059669;
          border-bottom-color: #059669;
        }
      }
    }

    .portal-body {
      flex: 1;
    }

    /* TAB 1: ATTENDANCE STYLES */
    .portal-box-card {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: var(--shadow-sm);

      .card-title-bar {
        padding: 12px 18px;
        border-bottom: 1px solid var(--gray-200);
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }

    .attendance-card {
      border-top: 4px solid #10b981;
    }

    .attendance-info-box {
      background: #f8fafc;
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12.5px;

        .label { color: var(--gray-500); }
      }
    }

    .attendance-status-display {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 12px 16px;

      &.checked {
        background: #ecfdf5;
        border-color: #a7f3d0;
      }

      .status-main-label {
        font-weight: 700;
        font-size: 14px;
      }
    }

    .checkin-submit-btn {
      letter-spacing: 0.02em;
      box-shadow: 0 4px 6px rgba(16,185,129,0.25);
    }

    /* TAB 2: WORKER TASKS */
    .tasks-portal-panel {
      display: flex;
      flex-direction: column;

      .panel-toolbar {
        background: white;
        padding: 12px 18px;
        border-radius: 8px;
        border: 1px solid var(--gray-200);
        display: flex;
        justify-content: space-between;
        align-items: center;

        .status-filter { width: 220px; }
      }
    }

    .tasks-cards-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .worker-task-card {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: var(--shadow-sm);

      &.resolved { border-left: 5px solid #10b981; }

      .task-card-header {
        padding: 10px 16px;
        background: #f8fafc;
        border-bottom: 1px solid var(--gray-200);
        display: flex;
        justify-content: space-between;
        align-items: center;

        .task-code {
          font-family: monospace;
          font-weight: 700;
          color: var(--primary-800);
        }
      }

      .task-card-body {
        padding: 14px 16px;
        display: flex;
        gap: 16px;

        .task-img-wrapper {
          position: relative;
          width: 140px;
          height: 110px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;

          .task-photo { width: 100%; height: 100%; object-fit: cover; }
          .img-label {
            position: absolute;
            bottom: 4px;
            left: 4px;
            background: rgba(0,0,0,0.7);
            color: white;
            font-size: 9px;
            padding: 2px 6px;
            border-radius: 4px;
          }
        }

        .task-info-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;

          .task-title {
            font-size: 15px;
            font-weight: 700;
            color: var(--gray-900);
            margin: 0;
          }

          .task-meta-row {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12.5px;
            color: var(--gray-600);
          }

          .task-instruction-box {
            background: #f8fafc;
            border: 1px dashed var(--gray-300);
            border-radius: 6px;
            padding: 8px 12px;

            .instruction-header { font-size: 11.5px; }
            .instruction-note { font-size: 12.5px; color: var(--gray-800); }
          }
        }
      }

      .task-card-footer {
        padding: 10px 16px;
        background: #f8fafc;
        border-top: 1px solid var(--gray-200);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }

    /* SAMPLE PHOTOS */
    .sample-photo-btn {
      border: 2px solid transparent;
      border-radius: 6px;
      overflow: hidden;
      cursor: pointer;
      width: 100px;
      text-align: center;
      background: #f8fafc;

      img { width: 100%; height: 55px; object-fit: cover; }
      span { font-size: 10px; display: block; padding: 2px; }
      &.active { border-color: var(--primary-600); }
    }

    .current-photo-view {
      position: relative;
      border-radius: 6px;
      overflow: hidden;
      height: 120px;

      img { width: 100%; height: 100%; object-fit: cover; }
      .tag-attached {
        position: absolute;
        bottom: 6px;
        right: 6px;
        background: rgba(16,185,129,0.85);
        color: white;
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 700;
      }
    }

    .max-w-800 { max-width: 800px; }
    .max-w-180 { max-width: 180px; }

    /* BADGES */
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
      font-size: 11px;
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
    .fs-xxs { font-size: 10px; }
    .max-w-400 { max-width: 400px; }

    /* KPI MINI CARDS GRID */
    .kpi-mini-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    @media (max-width: 900px) {
      .kpi-mini-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .kpi-mini-card {
      padding: 10px 14px;
      border-radius: 6px;
      border: 1px solid var(--gray-200);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .kpi-mini-card .label {
      font-size: 11px;
      color: var(--gray-600);
    }
    .kpi-mini-card .val {
      font-size: 16px;
      font-weight: 700;
    }

    .my-issues-toolbar {
      padding: 10px 16px;
      background: #f8fafc;
      border-top: 1px solid var(--gray-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .search-input-box {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      max-width: 480px;
      min-width: 250px;
    }

    .filter-status-box {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* MY ISSUES CARDS */
    .my-issues-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .my-issue-card {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 10px;
      padding: 14px 16px;
      box-shadow: var(--shadow-sm);
      transition: all 0.15s ease;
    }

    .my-issue-card.rejected-border {
      border-color: #fca5a5;
      border-width: 1.5px;
      background: #fffafa;
    }

    .my-issue-card .my-issue-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--gray-100);
      padding-bottom: 8px;
      margin-bottom: 10px;
    }

    .my-issue-card .my-issue-body {
      display: flex;
      gap: 16px;
    }

    .my-issue-card .my-issue-body .img-box {
      position: relative;
      width: 140px;
      height: 95px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
      background: #e2e8f0;
    }

    .my-issue-card .my-issue-body .img-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .my-issue-card .my-issue-body .img-box .time-tag {
      position: absolute;
      bottom: 4px;
      left: 4px;
      background: rgba(0,0,0,0.65);
      color: white;
      font-size: 9.5px;
      padding: 1px 6px;
      border-radius: 4px;
    }

    .my-issue-card .my-issue-body .info-box {
      flex: 1;
      min-width: 0;
    }

    .my-issue-card .my-issue-body .info-box .issue-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--gray-900);
      margin: 0 0 4px 0;
    }

    .rejected-alert-card {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 10px 12px;
    }

    .rejected-alert-card .reject-reason-box {
      background: white;
      border: 1px solid #fca5a5;
      border-radius: 6px;
      padding: 6px 10px;
      color: #b91c1c;
      font-size: 12px;
      font-weight: 600;
    }

    .resubmitted-alert-card {
      background: #fefce8;
      border: 1px solid #fef08a;
    }

    /* MODAL */
    .custom-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
    }

    .custom-modal-dialog {
      width: 100%;
      max-width: 520px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .custom-modal-dialog.modal-xl {
      max-width: 1780px;
      width: calc(100vw - 32px);
      height: calc(100vh - 32px);
      max-height: calc(100vh - 32px);
      display: flex;
      flex-direction: column;
      border-radius: 12px;
      background: white;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
    }

    .custom-header-bar {
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      color: white;
      width: 100%;
    }
    .custom-header-bar.header-create {
      background: #2563eb;
    }
    .custom-header-bar.header-rejected {
      background: #dc2626;
    }

    .principles-banner {
      flex-shrink: 0;
      width: 100%;
    }

    .custom-modal-body {
      overflow-y: auto;
      flex: 1;
      padding: 16px 20px;
      background: #f1f5f9;
      width: 100%;
    }

    .custom-modal-footer {
      padding: 12px 20px;
      background: white;
      border-top: 1px solid var(--gray-200);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      flex-shrink: 0;
      width: 100%;
    }

    .modal-header {
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-footer {
      padding: 12px 20px;
      background: white;
      border-top: 1px solid var(--gray-200);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    /* MODAL SPLIT LAYOUT */
    .modal-split-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      align-items: stretch;
      min-height: 100%;
      width: 100%;
    }

    .modal-form-col {
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .modal-form-section {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 10px;
      padding: 14px 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .section-title-tag {
      font-size: 11px;
      font-weight: 700;
      color: var(--gray-700);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 12px;
    }

    .modal-map-col {
      display: flex;
      flex-direction: column;
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 10px;
      padding: 14px;
      height: 100%;
      min-height: 580px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .map-toolbar-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--gray-100);
    }

    .modal-map-wrapper {
      flex: 1;
      min-height: 500px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--gray-300);
      position: relative;
    }

    .modal-leaflet-map {
      width: 100%;
      height: 100%;
      min-height: 500px;
    }

    .map-helper-tip {
      font-size: 11.5px;
      color: var(--gray-600);
      display: flex;
      gap: 6px;
      line-height: 1.45;
      margin-top: 10px;
      padding: 8px 10px;
      background: #f8fafc;
      border-radius: 6px;
      border: 1px solid var(--gray-200);
    }

    .row-2-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .sample-photos-row {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .sample-photo-btn {
      border: 1.5px solid var(--gray-300);
      border-radius: 6px;
      overflow: hidden;
      cursor: pointer;
      width: 95px;
      flex-shrink: 0;
      text-align: center;
      background: white;
      transition: all 0.15s ease;
    }
    .sample-photo-btn img {
      width: 100%;
      height: 48px;
      object-fit: cover;
    }
    .sample-photo-btn span {
      font-size: 10px;
      display: block;
      padding: 3px 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sample-photo-btn.active {
      border-color: var(--primary-600);
      background: #eff6ff;
      font-weight: 700;
      color: var(--primary-700);
    }

    .current-photo-view {
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      height: 120px;
      margin-top: 8px;
      border: 1px solid var(--gray-200);
    }
    .current-photo-view img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .current-photo-view .tag-attached {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(16,185,129,0.9);
      color: white;
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 4px;
      font-weight: 700;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    /* ASSETS PICKER */
    .assets-picker-box {
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 10px;
      background: #f8fafc;
    }

    .assets-picker-box .assets-scroll-list {
      max-height: 180px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .assets-picker-box .asset-item-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 10px;
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .assets-picker-box .asset-item-row:hover {
      background: #f1f5f9;
      border-color: var(--gray-300);
    }
    .assets-picker-box .asset-item-row.selected {
      background: #eff6ff;
      border-color: var(--primary-400);
      box-shadow: 0 1px 2px rgba(59, 130, 246, 0.1);
    }
  `]
})
export class FieldPortalComponent implements OnInit {
  patrolService = inject(PatrolService);
  projectService = inject(ProjectService);
  route = inject(ActivatedRoute);

  // Persona: TUAN_NAM | THO_HAI
  currentPersona: 'TUAN_NAM' | 'THO_HAI' = 'TUAN_NAM';

  // 3 Distinct Tabs: ATTENDANCE | TASKS | REPORT | MY_ISSUES
  activeTab: 'ATTENDANCE' | 'TASKS' | 'REPORT' | 'MY_ISSUES' = 'ATTENDANCE';

  taskStatusFilter = 'ALL';

  // Sổ theo dõi sự cố của tôi
  myIssuesSearchKeyword = '';
  myIssuesStatusFilter = 'ALL';

  // Modal Ghi nhận sự cố mới / Cập nhật sự cố bị từ chối
  showIssueModal = false;
  isEditingIssue = false;
  editingIssue?: PatrolIssue;
  assetSearchKeyword = '';

  issueModalForm = {
    title: 'Sụt lún mép vỉa hè lát đá hoa cương',
    description: 'Khoảng 3m2 vỉa hè bị sụt lún mép tạo rãnh sâu nguy hiểm cho người đi bộ.',
    layerId: 'ROADWAY' as LayerId,
    categoryId: 'cat-4',
    selectedAssetIds: ['ast-24'] as string[],
    photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&q=80',
    lat: 10.77450,
    lng: 106.70320,
    address: 'Số 68 Phố đi bộ Nguyễn Huệ, P. Bến Nghé, Q.1',
    routeName: 'Tuyến Phố Đi Bộ Nguyễn Huệ',
    resubmitNote: ''
  };

  @ViewChild('issueModalMapContainer') issueModalMapContainer?: ElementRef;
  private modalMap?: L.Map;
  private modalMarkersGroup?: L.FeatureGroup;
  private modalPolyline?: L.Polyline;

  // Form Điểm danh Web (Check-in)
  checkInForm = {
    personnelId: 'ns-1',
    location: 'Công viên Tượng đài Bác Hồ (GPS: 10.7762, 106.7022)'
  };

  currentTimeString = '';

  // Modal Báo cáo hoàn thành của Thợ
  showCompletionModal = false;
  completingTask?: PatrolIssue;
  completionForm = {
    afterPhotoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=700&q=80',
    finalCondition: 'GOOD' as AssetCondition,
    note: 'Đã hoàn tất thay thế bu lông neo và kiểm tra chịu lực an toàn.'
  };

  // Mẫu ảnh hiện trường tham khảo
  samplePhotos = [
    { title: 'Sụt lún vỉa hè', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&q=80' },
    { title: 'Đèn chập cháy', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=700&q=80' },
    { title: 'Cây gãy cành', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=700&q=80' },
    { title: 'Hố ga nứt vỡ', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=700&q=80' }
  ];

  reportForm = {
    title: 'Sụt lún mép vỉa hè lát đá hoa cương',
    categoryId: 'cat-4',
    assetId: 'ast-24',
    assetCondition: 'DAMAGED' as AssetCondition,
    description: 'Khoảng 3m2 vỉa hè bị sụt lún mép tạo rãnh sâu nguy hiểm cho người đi bộ.',
    photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&q=80',
    lat: 10.77450,
    lng: 106.70320,
    address: 'Số 68 Phố đi bộ Nguyễn Huệ, P. Bến Nghé, Q.1',
    routeName: 'Tuyến Nguyễn Huệ'
  };

  ngOnInit() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    // Hỗ trợ query params: /field-portal?tab=ATTENDANCE hoặc tab=MY_ISSUES
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
    });
  }

  updateClock() {
    this.currentTimeString = new Date().toLocaleTimeString('vi-VN') + ' - 13/10/2026';
  }

  onPersonaChange() {
    if (this.currentPersona === 'TUAN_NAM') {
      this.checkInForm.personnelId = 'ns-1';
      this.activeTab = 'MY_ISSUES';
    } else {
      this.activeTab = 'TASKS';
    }
  }

  onSelectCheckInPersonnel() {
    // Sync
  }

  get selectedPersonnelRecord(): PatrolPersonnel | undefined {
    return this.patrolService.personnel().find(p => p.id === this.checkInForm.personnelId);
  }

  get isCurrentWorkerCheckedIn(): boolean {
    return this.selectedPersonnelRecord?.todayAttendance === 'CHECKED_IN';
  }

  get todaySchedule(): PatrolSchedule | undefined {
    return this.patrolService.schedules().find(s => s.date === '2026-10-13');
  }

  get checkedInCount(): number {
    return this.patrolService.personnel().filter(p => p.todayAttendance === 'CHECKED_IN').length;
  }

  // THỰC HIỆN ĐIỂM DANH TRÊN WEB (CHECK-IN)
  executeWebCheckIn() {
    const schId = this.todaySchedule?.id || 'sch-1';
    this.patrolService.workerSelfCheckIn(
      this.checkInForm.personnelId,
      schId,
      this.checkInForm.location
    );
  }

  executeCheckOut() {
    this.patrolService.personnel.update(list =>
      list.map(p => p.id === this.checkInForm.personnelId ? { ...p, todayAttendance: 'NOT_CHECKED_IN', checkInTime: undefined } : p)
    );
  }

  quickCheckInUser(personnelId: string) {
    const schId = this.todaySchedule?.id || 'sch-1';
    this.patrolService.workerSelfCheckIn(
      personnelId,
      schId,
      'Điểm danh nhanh qua Web Portal'
    );
  }

  getAttendanceBadgeClass(att: AttendanceStatus): string {
    switch (att) {
      case 'CHECKED_IN': return 'bg-success';
      case 'LATE': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  }

  getAttendanceLabel(att: AttendanceStatus): string {
    switch (att) {
      case 'CHECKED_IN': return 'Đã điểm danh';
      case 'LATE': return 'Điểm danh trễ';
      default: return 'Chưa điểm danh';
    }
  }

  // SỔ SỰ CỐ CỦA TÔI (CỔNG HIỆN TRƯỜNG - UC 7)
  get myReportedIssues(): PatrolIssue[] {
    return this.patrolService.issues();
  }

  get myRejectedIssuesCount(): number {
    return this.myReportedIssues.filter(i => i.status === 'REJECTED').length;
  }

  countMyIssuesByStatus(status: string): number {
    return this.myReportedIssues.filter(i => i.status === status).length;
  }

  get filteredMyIssues(): PatrolIssue[] {
    return this.myReportedIssues.filter(iss => {
      if (this.myIssuesStatusFilter !== 'ALL' && iss.status !== this.myIssuesStatusFilter) {
        return false;
      }
      if (this.myIssuesSearchKeyword.trim()) {
        const kw = this.myIssuesSearchKeyword.toLowerCase();
        const matchCode = iss.code?.toLowerCase().includes(kw);
        const matchTitle = iss.title?.toLowerCase().includes(kw);
        const matchAddr = iss.address?.toLowerCase().includes(kw);
        const matchRoute = iss.routeName?.toLowerCase().includes(kw);
        const matchAsset = iss.assetName?.toLowerCase().includes(kw) || iss.assetCode?.toLowerCase().includes(kw);
        return matchCode || matchTitle || matchAddr || matchRoute || matchAsset;
      }
      return true;
    });
  }

  get availableCategories() {
    return this.patrolService.categories().filter(c => c.layerId === this.issueModalForm.layerId);
  }

  get availableAssetsForLayer(): Asset[] {
    return this.projectService.masterAssets().filter(a => a.layerId === this.issueModalForm.layerId);
  }

  get filteredAvailableAssets(): Asset[] {
    if (!this.assetSearchKeyword.trim()) {
      return this.availableAssetsForLayer;
    }
    const kw = this.assetSearchKeyword.toLowerCase();
    return this.availableAssetsForLayer.filter(a =>
      a.code.toLowerCase().includes(kw) ||
      a.name.toLowerCase().includes(kw) ||
      (a.address && a.address.toLowerCase().includes(kw))
    );
  }

  isAssetSelected(assetId: string): boolean {
    return this.issueModalForm.selectedAssetIds.includes(assetId);
  }

  getLayerName(layerId: LayerId): string {
    switch (layerId) {
      case 'ROADWAY': return 'Mặt đường & Biển báo';
      case 'LIGHTING': return 'Chiếu sáng đô thị';
      case 'GREENERY': return 'Cây xanh & Công viên';
      case 'DRAINAGE': return 'Thoát nước & Hố ga';
      default: return layerId;
    }
  }

  getLayerColor(layerId: LayerId): string {
    switch (layerId) {
      case 'ROADWAY': return '#8b5cf6';
      case 'LIGHTING': return '#eab308';
      case 'GREENERY': return '#10b981';
      case 'DRAINAGE': return '#06b6d4';
      default: return '#6b7280';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'NEW': return 'Mới tiếp nhận (Chờ duyệt)';
      case 'QUICK_FIXING': return 'Đang khắc phục';
      case 'RESOLVED': return 'Đã hoàn thành';
      case 'MOVED_TO_PROJECT': return 'Đã chuyển Dự án Duy tu';
      case 'REJECTED': return 'Bị từ chối tiếp nhận';
      default: return status;
    }
  }

  // MODAL GHI NHẬN / SỬA SỰ CỐ
  openCreateIssueModal() {
    this.isEditingIssue = false;
    this.editingIssue = undefined;
    this.issueModalForm = {
      title: 'Sụt lún mép vỉa hè lát đá hoa cương',
      description: 'Khoảng 3m2 vỉa hè bị sụt lún mép tạo rãnh sâu nguy hiểm cho người đi bộ.',
      layerId: 'ROADWAY' as LayerId,
      categoryId: 'cat-4',
      selectedAssetIds: ['ast-24'],
      photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&q=80',
      lat: 10.77450,
      lng: 106.70320,
      address: 'Số 68 Phố đi bộ Nguyễn Huệ, P. Bến Nghé, Q.1',
      routeName: 'Tuyến Phố Đi Bộ Nguyễn Huệ',
      resubmitNote: ''
    };
    this.showIssueModal = true;
    setTimeout(() => this.initModalMap(), 250);
  }

  openEditRejectedIssueModal(issue: PatrolIssue) {
    this.isEditingIssue = true;
    this.editingIssue = issue;
    const selectedIds = issue.attachedAssets && issue.attachedAssets.length > 0
      ? issue.attachedAssets.map(a => a.assetId)
      : (issue.assetId ? [issue.assetId] : []);

    this.issueModalForm = {
      title: issue.title,
      description: issue.description,
      layerId: issue.layerId,
      categoryId: issue.categoryId,
      selectedAssetIds: selectedIds,
      photoUrl: issue.photoBeforeUrl,
      lat: issue.lat,
      lng: issue.lng,
      address: issue.address,
      routeName: issue.routeName,
      resubmitNote: issue.resubmitNotes || ''
    };
    this.showIssueModal = true;
    setTimeout(() => this.initModalMap(), 250);
  }

  closeIssueModal() {
    this.showIssueModal = false;
    if (this.modalMap) {
      this.modalMap.remove();
      this.modalMap = undefined;
    }
  }

  onSelectLayer(layerId: LayerId) {
    if (this.issueModalForm.layerId === layerId) return;
    this.issueModalForm.layerId = layerId;
    this.issueModalForm.selectedAssetIds = [];
    const cats = this.availableCategories;
    if (cats.length > 0) {
      this.issueModalForm.categoryId = cats[0].id;
    }
    const assets = this.availableAssetsForLayer;
    if (assets.length > 0) {
      this.issueModalForm.selectedAssetIds = [assets[0].id];
      this.issueModalForm.lat = assets[0].lat;
      this.issueModalForm.lng = assets[0].lng;
      this.issueModalForm.address = assets[0].address;
      this.issueModalForm.routeName = assets[0].route;
    }
    this.renderModalMapAssets();
  }

  toggleAssetSelection(ast: Asset) {
    const idx = this.issueModalForm.selectedAssetIds.indexOf(ast.id);
    if (idx >= 0) {
      this.issueModalForm.selectedAssetIds.splice(idx, 1);
    } else {
      this.issueModalForm.selectedAssetIds.push(ast.id);
      if (this.issueModalForm.selectedAssetIds.length === 1) {
        this.issueModalForm.lat = ast.lat;
        this.issueModalForm.lng = ast.lng;
        this.issueModalForm.address = ast.address;
        this.issueModalForm.routeName = ast.route;
      }
    }
    this.renderModalMapAssets();
  }

  refreshGPSInModal() {
    const deltaLat = (Math.random() - 0.5) * 0.0006;
    const deltaLng = (Math.random() - 0.5) * 0.0006;
    this.issueModalForm.lat = +(10.7745 + deltaLat).toFixed(5);
    this.issueModalForm.lng = +(10.7032 + deltaLng).toFixed(5);
    this.renderModalMapAssets();
  }

  initModalMap() {
    if (!this.issueModalMapContainer) return;
    if (this.modalMap) {
      this.modalMap.remove();
    }
    const container = this.issueModalMapContainer.nativeElement;
    this.modalMap = L.map(container, {
      center: [this.issueModalForm.lat, this.issueModalForm.lng],
      zoom: 16,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.modalMap);

    this.modalMarkersGroup = L.featureGroup().addTo(this.modalMap);
    this.renderModalMapAssets();
    this.modalMap.invalidateSize();
    setTimeout(() => {
      this.modalMap?.invalidateSize();
    }, 200);
  }

  renderModalMapAssets() {
    if (!this.modalMap || !this.modalMarkersGroup) return;
    this.modalMarkersGroup.clearLayers();
    if (this.modalPolyline) {
      this.modalMap.removeLayer(this.modalPolyline);
      this.modalPolyline = undefined;
    }

    const layerColor = this.getLayerColor(this.issueModalForm.layerId);
    const selectedPoints: L.LatLngExpression[] = [];

    // Render các tài sản thuộc layer
    this.availableAssetsForLayer.forEach(ast => {
      const isSelected = this.isAssetSelected(ast.id);
      const selectedIndex = this.issueModalForm.selectedAssetIds.indexOf(ast.id);

      if (isSelected) {
        selectedPoints.push([ast.lat, ast.lng]);
        const numberBadge = selectedIndex + 1;
        const selectedIcon = L.divIcon({
          className: 'modal-asset-selected-marker',
          html: `<div style="
            background: #dc2626;
            color: white;
            font-weight: 800;
            font-size: 11px;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 0 3px white, 0 3px 8px rgba(0,0,0,0.4);
            border: 2px solid #991b1b;
          ">${numberBadge}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([ast.lat, ast.lng], { icon: selectedIcon }).addTo(this.modalMarkersGroup!);
        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px;">
            <div style="font-weight: bold; color: #dc2626;">[Điểm ${numberBadge}] ${ast.code}</div>
            <div style="font-weight: 600;">${ast.name}</div>
            <div style="color: #6b7280; font-size: 11px;">${ast.address}</div>
            <div style="margin-top: 4px; color: #059669; font-weight: bold;">✓ ĐÃ GẮN VÀO SỰ CỐ NÀY</div>
          </div>
        `);
        marker.on('click', () => this.toggleAssetSelection(ast));
      } else {
        const defaultIcon = L.divIcon({
          className: 'modal-asset-unselected-marker',
          html: `<div style="
            background: ${layerColor};
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            cursor: pointer;
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        const marker = L.marker([ast.lat, ast.lng], { icon: defaultIcon }).addTo(this.modalMarkersGroup!);
        marker.bindTooltip(`[${ast.code}] ${ast.name}`, { direction: 'top', offset: [0, -8] });
        marker.on('click', () => this.toggleAssetSelection(ast));
      }
    });

    // Vẽ polyline nối các tài sản được chọn (Nguyên tắc 2: nhiều tài sản cùng loại liên tiếp)
    if (selectedPoints.length > 1) {
      this.modalPolyline = L.polyline(selectedPoints, {
        color: '#dc2626',
        weight: 3,
        dashArray: '6, 6',
        opacity: 0.8
      }).addTo(this.modalMap);
    }

    // Marker GPS người đi tuần
    const userIcon = L.divIcon({
      className: 'modal-user-pos-marker',
      html: `<div style="
        background: #2563eb;
        color: white;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2.5px solid white;
        box-shadow: 0 0 0 4px rgba(37,99,235,0.35);
      "></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
    L.marker([this.issueModalForm.lat, this.issueModalForm.lng], { icon: userIcon })
      .bindTooltip('Vị trí hiện trường của bạn', { direction: 'bottom' })
      .addTo(this.modalMarkersGroup);
  }

  fitMapToSelected() {
    if (!this.modalMap) return;
    if (this.modalMarkersGroup && this.modalMarkersGroup.getLayers().length > 0) {
      this.modalMap.fitBounds(this.modalMarkersGroup.getBounds(), { padding: [30, 30] });
    }
  }

  centerMapOnUser() {
    if (!this.modalMap) return;
    this.modalMap.setView([this.issueModalForm.lat, this.issueModalForm.lng], 17);
  }

  submitIssueModal() {
    if (!this.issueModalForm.title.trim()) {
      alert('Vui lòng nhập tiêu đề sự cố!');
      return;
    }
    if (this.issueModalForm.selectedAssetIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 tài sản GIS cho sự cố (Nguyên tắc 2)!');
      return;
    }

    const selectedAssets = this.projectService.masterAssets().filter(a =>
      this.issueModalForm.selectedAssetIds.includes(a.id)
    );
    const primaryAsset = selectedAssets[0];
    const category = this.patrolService.categories().find(c => c.id === this.issueModalForm.categoryId);

    const attachedAssetsList = selectedAssets.map(a => ({
      assetId: a.id,
      assetCode: a.code,
      assetName: a.name,
      layerId: a.layerId,
      condition: 'DAMAGED' as AssetCondition,
      notes: a.address
    }));

    if (this.isEditingIssue && this.editingIssue) {
      // Resubmit sự cố sau khi bị từ chối
      this.patrolService.resubmitIssue(
        this.editingIssue.id,
        {
          title: this.issueModalForm.title,
          description: this.issueModalForm.description,
          layerId: this.issueModalForm.layerId,
          categoryId: this.issueModalForm.categoryId,
          attachedAssetIds: this.issueModalForm.selectedAssetIds,
          photoUrl: this.issueModalForm.photoUrl,
          lat: this.issueModalForm.lat,
          lng: this.issueModalForm.lng,
          address: this.issueModalForm.address,
          routeName: this.issueModalForm.routeName
        },
        this.issueModalForm.resubmitNote || 'Đã kiểm tra lại hiện trường và bổ sung tài sản theo yêu cầu'
      );
    } else {
      // Tạo sự cố mới tại hiện trường chuẩn 3 nguyên tắc
      this.patrolService.createPatrolIssue({
        title: this.issueModalForm.title,
        description: this.issueModalForm.description,
        layerId: this.issueModalForm.layerId,
        categoryId: this.issueModalForm.categoryId,
        attachedAssetIds: this.issueModalForm.selectedAssetIds,
        photoUrl: this.issueModalForm.photoUrl,
        lat: this.issueModalForm.lat,
        lng: this.issueModalForm.lng,
        address: this.issueModalForm.address,
        routeName: this.issueModalForm.routeName,
        reportedByName: 'Trần Đình Nam (Tuần tra viên)'
      });
    }

    this.closeIssueModal();
  }

  // THỢ (UC 10)
  get myAssignedTasks(): PatrolIssue[] {
    return this.patrolService.issues().filter(i => {
      return i.status === 'QUICK_FIXING' || i.status === 'RESOLVED' || (i.status === 'NEW' && i.quickFixDetails);
    });
  }

  get filteredTasks(): PatrolIssue[] {
    return this.myAssignedTasks.filter(t => {
      if (this.taskStatusFilter !== 'ALL' && t.status !== this.taskStatusFilter) return false;
      return true;
    });
  }

  countTasksByStatus(st: string): number {
    return this.myAssignedTasks.filter(t => t.status === st).length;
  }

  acceptTask(task: PatrolIssue) {
    this.patrolService.workerAcceptTask(task.id, 'Nguyễn Văn Hải');
  }

  openReportCompletionModal(task: PatrolIssue) {
    this.completingTask = task;
    this.completionForm.note = `Thợ Nguyễn Văn Hải đã hoàn tất sửa chữa và bàn giao hiện trường sự cố ${task.code}`;
    this.showCompletionModal = true;
  }

  submitCompletion() {
    if (!this.completingTask) return;
    this.patrolService.workerReportCompletion(
      this.completingTask.id,
      'Nguyễn Văn Hải',
      this.completionForm.afterPhotoUrl,
      this.completionForm.note,
      this.completionForm.finalCondition
    );
    this.showCompletionModal = false;
  }

  exportMyTasksExcel() {
    const rows = this.filteredTasks.map(t => [
      t.code,
      t.title,
      t.priority,
      t.status,
      t.address,
      t.quickFixDetails?.deadline || 'Hôm nay',
      t.quickFixDetails?.estimatedCost || 0,
      t.quickFixDetails?.assignedWorker || 'Nguyễn Văn Hải'
    ]);

    this.patrolService.exportToCsv(
      'Nhiem_Vu_Khac_Phuc_Duoc_Giao',
      ['Mã Sự Cố', 'Tên Sự Cố', 'Độ Ưu Tiên', 'Trạng Thái', 'Địa Chỉ Hiện Trường', 'Hạn Chót', 'Dự Toán', 'Thợ Phụ Trách'],
      rows
    );
  }

  // BÁO CÁO SỰ CỐ TRÊN WEB (UC 7 CŨ - CHUYỂN SANG MODAL MỚI)
  onSelectAsset() {
    const ast = this.projectService.masterAssets().find(a => a.id === this.reportForm.assetId);
    if (ast) {
      this.reportForm.lat = ast.lat;
      this.reportForm.lng = ast.lng;
      this.reportForm.address = ast.address;
      this.reportForm.routeName = ast.route;
    }
  }

  refreshGPS() {
    const deltaLat = (Math.random() - 0.5) * 0.001;
    const deltaLng = (Math.random() - 0.5) * 0.001;
    this.reportForm.lat = +(10.7745 + deltaLat).toFixed(5);
    this.reportForm.lng = +(10.7732 + deltaLng).toFixed(5);
  }

  submitPatrolReport() {
    this.openCreateIssueModal();
  }
}
