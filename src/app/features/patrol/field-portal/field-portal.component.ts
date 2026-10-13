import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PatrolService } from '../../../core/services/patrol.service';
import { ProjectService } from '../../../core/services/project.service';
import { PatrolIssue, PatrolSchedule, PatrolPersonnel, AttendanceStatus, AssetCondition } from '../../../core/models/patrol.model';

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
            [class.active]="activeTab === 'TASKS'"
            (click)="activeTab = 'TASKS'"
          >
            <i class="bi bi-tools"></i>
            <span>2. Nhiệm Vụ Khắc Phục Được Giao (UC 10)</span>
            <span class="badge bg-warning text-dark ms-1">{{ myAssignedTasks.length }}</span>
          </button>

          <button
            class="tab-btn"
            [class.active]="activeTab === 'REPORT'"
            (click)="activeTab = 'REPORT'"
          >
            <i class="bi bi-camera-fill"></i>
            <span>3. Báo Cáo Sự Cố Hiện Trường (UC 7)</span>
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

        <!-- ==================== TAB 3: BÁO CÁO SỰ CỐ HIỆN TRƯỜNG TRÊN WEB (UC 7) ==================== -->
        <div *ngIf="activeTab === 'REPORT'" class="report-portal-panel">
          <div class="portal-box-card max-w-800 mx-auto">
            <div class="card-title-bar bg-light">
              <i class="bi bi-camera-fill text-danger"></i>
              <h4 class="m-0 fw-bold fs-6">Ghi Nhận & Báo Cáo Sự Cố Mới Tại Hiện Trường (Web Form - UC 7)</h4>
            </div>

            <div class="p-4">
              <div class="alert alert-info fs-xs mb-3">
                <i class="bi bi-info-circle-fill"></i> Nhân viên báo cáo sự cố trực tiếp qua trình duyệt web khi phát hiện sự cố ngoài hiện trường. Dữ liệu sẽ đồng bộ tức thời sang <strong>Bàn làm việc của Cán bộ Admin</strong>.
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">Tiêu đề sự cố phát hiện (*):</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Ví dụ: Đèn chiếu sáng bị chập cháy, Cây gãy cành to..."
                  [(ngModel)]="reportForm.title"
                />
              </div>

              <div class="row g-2 mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-bold">Loại vấn đề hạ tầng (*):</label>
                  <select class="form-select form-select-sm" [(ngModel)]="reportForm.categoryId">
                    <option *ngFor="let cat of patrolService.categories()" [value]="cat.id">
                      [{{ cat.code }}] {{ cat.name }}
                    </option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-bold">Tài sản GIS gần nhất (nếu có):</label>
                  <select class="form-select form-select-sm" [(ngModel)]="reportForm.assetId" (ngModelChange)="onSelectAsset()">
                    <option value="">-- Không xác định mã tài sản --</option>
                    <option *ngFor="let ast of projectService.masterAssets().slice(0, 12)" [value]="ast.id">
                      [{{ ast.code }}] {{ ast.name }}
                    </option>
                  </select>
                </div>

                <div class="col-md-6" *ngIf="reportForm.assetId">
                  <label class="form-label fw-bold">Đánh giá hiện trạng tài sản (*):</label>
                  <select class="form-select form-select-sm" [(ngModel)]="reportForm.assetCondition">
                    <option value="DAMAGED">🔴 Hư hỏng (Cần xử lý)</option>
                    <option value="NEEDS_REPLACEMENT">🟠 Cần thay thế mới</option>
                    <option value="NORMAL">🔵 Bình thường (Cần theo dõi)</option>
                    <option value="GOOD">🟢 Hoạt động tốt</option>
                  </select>
                </div>
              </div>

              <div class="row g-2 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Tọa độ GPS hiện trường:</label>
                  <div class="input-group input-group-sm">
                    <input type="text" class="form-control font-monospace" [value]="reportForm.lat.toFixed(5) + ', ' + reportForm.lng.toFixed(5)" readonly />
                    <button class="btn btn-outline-secondary" type="button" (click)="refreshGPS()" title="Cập nhật GPS">
                      <i class="bi bi-arrow-clockwise"></i> GPS
                    </button>
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Tuyến đường:</label>
                  <input type="text" class="form-control form-control-sm" [(ngModel)]="reportForm.routeName" />
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Địa chỉ số nhà cụ thể:</label>
                <input type="text" class="form-control form-control-sm" [(ngModel)]="reportForm.address" />
              </div>

              <!-- Chọn ảnh chụp hiện trường -->
              <div class="mb-3">
                <label class="form-label fw-bold">Ảnh chụp hiện trường sự cố (*):</label>
                <div class="d-flex gap-2 mb-2">
                  <div
                    *ngFor="let sample of samplePhotos"
                    class="sample-photo-btn"
                    [class.active]="reportForm.photoUrl === sample.url"
                    (click)="reportForm.photoUrl = sample.url"
                  >
                    <img [src]="sample.url" alt="" />
                    <span>{{ sample.title }}</span>
                  </div>
                </div>
                <div class="current-photo-view" *ngIf="reportForm.photoUrl">
                  <img [src]="reportForm.photoUrl" alt="Ảnh hiện trường" />
                  <span class="tag-attached"><i class="bi bi-check2"></i> Đã đính kèm ảnh</span>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Mô tả hiện trạng chi tiết:</label>
                <textarea class="form-control form-control-sm" rows="2" [(ngModel)]="reportForm.description" placeholder="Ghi chú mức độ nguy hiểm, kích thước sự cố..."></textarea>
              </div>

              <button
                class="btn btn-primary w-100 py-3 fw-bold fs-6"
                [disabled]="!reportForm.title.trim()"
                (click)="submitPatrolReport()"
              >
                <i class="bi bi-send-fill me-1"></i>
                <span>GỬI BÁO CÁO SỰ CỐ VỀ TRUNG TÂM ADMIN</span>
              </button>
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
    }

    .fs-xs { font-size: 11.5px; }

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
      max-width: 520px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--shadow-xl);

      .modal-header { padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; }
      .modal-body { padding: 18px; }
      .modal-footer { padding: 12px 18px; background: #f8fafc; border-top: 1px solid var(--gray-200); display: flex; justify-content: flex-end; gap: 8px; }
    }
  `]
})
export class FieldPortalComponent implements OnInit {
  patrolService = inject(PatrolService);
  projectService = inject(ProjectService);
  route = inject(ActivatedRoute);

  // Persona: TUAN_NAM | THO_HAI
  currentPersona: 'TUAN_NAM' | 'THO_HAI' = 'TUAN_NAM';

  // 3 Distinct Tabs: ATTENDANCE | TASKS | REPORT
  activeTab: 'ATTENDANCE' | 'TASKS' | 'REPORT' = 'ATTENDANCE';

  taskStatusFilter = 'ALL';

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

  // Form Báo cáo sự cố trên Web của nhân viên tuần tra
  samplePhotos = [
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

    // Hỗ trợ query params: /field-portal?tab=ATTENDANCE
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
      this.activeTab = 'ATTENDANCE';
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

  // BÁO CÁO SỰ CỐ TRÊN WEB (UC 7)
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
    this.patrolService.simulateReportFromMobile({
      title: this.reportForm.title,
      description: this.reportForm.description,
      categoryId: this.reportForm.categoryId,
      assetId: this.reportForm.assetId || undefined,
      assetCondition: this.reportForm.assetCondition,
      photoUrl: this.reportForm.photoUrl,
      lat: this.reportForm.lat,
      lng: this.reportForm.lng,
      address: this.reportForm.address,
      routeName: this.reportForm.routeName,
      reportedByName: 'Trần Đình Nam (Tuần tra viên)'
    });
  }
}
