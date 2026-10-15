import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatrolService } from '../../../../core/services/patrol.service';
import { IssueCategory, PatrolTeam, PatrolPersonnel, AttendanceStatus, IssuePriority } from '../../../../core/models/patrol.model';
import { LayerId } from '../../../../core/models/maintenance.model';

@Component({
  selector: 'app-config-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="config-catalog-container">
      <!-- Sub-tabs Navigation -->
      <div class="sub-nav-bar">
        <div class="sub-tabs-list">
          <button
            class="sub-tab-item"
            [class.active]="activeSubTab === 'CATEGORIES'"
            (click)="activeSubTab = 'CATEGORIES'"
          >
            <i class="bi bi-tags-fill"></i>
            <span>1. Danh Mục Loại Vấn Đề (UC 2)</span>
            <span class="badge bg-secondary">{{ patrolService.categories().length }}</span>
          </button>

          <button
            class="sub-tab-item"
            [class.active]="activeSubTab === 'TEAMS'"
            (click)="activeSubTab = 'TEAMS'"
          >
            <i class="bi bi-shield-lock-fill"></i>
            <span>2. Cụm Nhân Sự & Phân Quyền (UC 1)</span>
            <span class="badge bg-secondary">{{ patrolService.teams().length }}</span>
          </button>

          <button
            class="sub-tab-item"
            [class.active]="activeSubTab === 'PERSONNEL'"
            (click)="activeSubTab = 'PERSONNEL'"
          >
            <i class="bi bi-person-badge-fill"></i>
            <span>3. Quản Lý Nhân Viên & Điểm Danh (UC 5)</span>
            <span class="badge bg-secondary">{{ patrolService.personnel().length }}</span>
          </button>
        </div>
      </div>

      <!-- CONTENT AREA -->
      <div class="catalog-content-wrapper">
        <!-- ==================== SUB-TAB 1: DANH MỤC LOẠI VẤN ĐỀ (UC 2) ==================== -->
        <div *ngIf="activeSubTab === 'CATEGORIES'" class="catalog-panel">
          <div class="panel-toolbar">
            <div class="search-filter-group">
              <div class="search-box">
                <i class="bi bi-search"></i>
                <input
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="Tìm kiếm mã hoặc tên loại sự cố..."
                  [(ngModel)]="categoryKeyword"
                />
              </div>

              <select class="form-select form-select-sm layer-filter" [(ngModel)]="categoryLayerFilter">
                <option value="ALL">Tất cả lớp hạ tầng</option>
                <option value="LIGHTING">Chiếu sáng đô thị</option>
                <option value="GREENERY">Cây xanh & Công viên</option>
                <option value="DRAINAGE">Thoát nước & Hố ga</option>
                <option value="ROADWAY">Mặt đường & Biển báo</option>
              </select>
            </div>

            <div class="action-btn-group">
              <button class="btn btn-sm btn-outline-secondary" (click)="exportCategoriesExcel()">
                <i class="bi bi-file-earmark-excel-fill text-success"></i> Xuất Excel
              </button>
              <button class="btn btn-sm btn-primary" (click)="openAddCategoryModal()">
                <i class="bi bi-plus-lg"></i> Thêm Loại Vấn Đề
              </button>
            </div>
          </div>

          <!-- Data Table Categories -->
          <div class="data-table-container">
            <table class="table table-hover table-bordered align-middle">
              <thead>
                <tr>
                  <th style="width: 100px;">Mã loại</th>
                  <th>Tên loại sự cố</th>
                  <th style="width: 160px;">Lớp hạ tầng</th>
                  <th style="width: 120px;">Độ ưu tiên</th>
                  <th style="width: 110px;">TG xử lý chuẩn</th>
                  <th style="width: 140px;">Định mức dự toán</th>
                  <th style="width: 100px;">Trạng thái</th>
                  <th style="width: 100px;" class="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cat of filteredCategories">
                  <td class="font-monospace fw-bold text-primary">{{ cat.code }}</td>
                  <td>
                    <div class="fw-semibold">{{ cat.name }}</div>
                    <div class="text-muted fs-xs">{{ cat.description }}</div>
                  </td>
                  <td>
                    <span class="layer-pill" [style.background-color]="getLayerColor(cat.layerId) + '20'" [style.color]="getLayerColor(cat.layerId)">
                      {{ getLayerName(cat.layerId) }}
                    </span>
                  </td>
                  <td>
                    <span class="priority-pill" [ngClass]="'priority-' + cat.defaultPriority.toLowerCase()">
                      {{ getPriorityLabel(cat.defaultPriority) }}
                    </span>
                  </td>
                  <td>{{ cat.estimatedFixHours }} giờ</td>
                  <td class="font-monospace">{{ cat.standardCostEstimate | number }} đ</td>
                  <td>
                    <span class="badge" [ngClass]="cat.isActive ? 'bg-success' : 'bg-secondary'">
                      {{ cat.isActive ? 'Đang áp dụng' : 'Khóa' }}
                    </span>
                  </td>
                  <td class="text-center">
                    <button class="btn btn-xs btn-ghost text-primary" (click)="openEditCategoryModal(cat)" title="Chỉnh sửa">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-xs btn-ghost text-danger ms-1" (click)="deleteCategory(cat)" title="Xóa">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredCategories.length === 0">
                  <td colspan="8" class="text-center p-4 text-muted">Không tìm thấy loại vấn đề nào phù hợp.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ==================== SUB-TAB 2: CỤM NHÂN SỰ & PHÂN QUYỀN (UC 1) ==================== -->
        <div *ngIf="activeSubTab === 'TEAMS'" class="catalog-panel">
          <div class="panel-toolbar">
            <div class="search-filter-group">
              <div class="search-box">
                <i class="bi bi-search"></i>
                <input
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="Tìm kiếm cụm nhân sự, khu vực..."
                  [(ngModel)]="teamKeyword"
                />
              </div>
            </div>

            <div class="action-btn-group">
              <button class="btn btn-sm btn-primary" (click)="openAddTeamModal()">
                <i class="bi bi-plus-lg"></i> Thêm Cụm Nhân Sự
              </button>
            </div>
          </div>

          <div class="data-table-container">
            <table class="table table-hover table-bordered align-middle">
              <thead>
                <tr>
                  <th style="width: 120px;">Mã cụm</th>
                  <th>Tên tổ đội tuần kiểm</th>
                  <th>Khu vực phụ trách</th>
                  <th style="width: 180px;">Cụm nhóm quyền</th>
                  <th style="width: 130px;" class="text-center">Quân số</th>
                  <th style="width: 120px;" class="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let team of filteredTeams">
                  <td class="font-monospace fw-bold text-primary">{{ team.code }}</td>
                  <td>
                    <div class="fw-semibold">{{ team.name }}</div>
                    <div class="text-muted fs-xs">{{ team.description }}</div>
                  </td>
                  <td>{{ team.assignedArea }}</td>
                  <td>
                    <span class="badge" [ngClass]="getRoleBadgeClass(team.permissionGroup)">
                      {{ team.permissionGroup }}
                    </span>
                  </td>
                  <td class="text-center">
                    <button
                      class="btn btn-xs btn-outline-primary d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-bold"
                      (click)="openTeamPersonnelModal(team)"
                      title="Nhấn để xem danh sách nhân sự của cụm này"
                    >
                      <i class="bi bi-people-fill"></i>
                      <span>{{ getPersonnelCount(team.id, team.memberCount) }} nhân sự</span>
                    </button>
                  </td>
                  <td class="text-center">
                    <button
                      class="btn btn-xs btn-ghost text-primary"
                      (click)="openTeamPersonnelModal(team)"
                      title="Xem danh sách nhân sự cụm"
                    >
                      <i class="bi bi-people-fill"></i>
                    </button>
                    <button class="btn btn-xs btn-ghost text-secondary ms-1" (click)="openEditTeamModal(team)" title="Chỉnh sửa thông tin cụm">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-xs btn-ghost text-danger ms-1" (click)="deleteTeam(team)" title="Xóa cụm">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ==================== SUB-TAB 3: QUẢN LÝ NHÂN VIÊN & ĐIỂM DANH (UC 5) ==================== -->
        <div *ngIf="activeSubTab === 'PERSONNEL'" class="catalog-panel">
          <div class="panel-toolbar">
            <div class="search-filter-group">
              <div class="search-box">
                <i class="bi bi-search"></i>
                <input
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="Tìm nhân viên theo tên, SĐT, tuyến..."
                  [(ngModel)]="personnelKeyword"
                />
              </div>

              <select class="form-select form-select-sm" [(ngModel)]="attendanceFilter">
                <option value="ALL">Tất cả trạng thái điểm danh</option>
                <option value="CHECKED_IN">Đã điểm danh</option>
                <option value="LATE">Điểm danh trễ</option>
                <option value="NOT_CHECKED_IN">Chưa điểm danh</option>
              </select>
            </div>

            <div class="action-btn-group">
              <button class="btn btn-sm btn-outline-secondary" (click)="exportPersonnelExcel()">
                <i class="bi bi-file-earmark-excel-fill text-success"></i> Xuất Báo Cáo Điểm Danh
              </button>
            </div>
          </div>

          <!-- Status Bar Điểm Danh Tập Trung -->
          <div class="px-3 py-2 bg-light border-bottom d-flex justify-content-between align-items-center fs-xs">
            <div>
              <i class="bi bi-arrow-down-up text-primary me-1"></i>
              <span class="text-secondary">Sắp xếp: <strong class="text-dark">Người mới điểm danh gần nhất lên đầu (Live Feed)</strong></span>
            </div>
            <div class="d-flex gap-2">
              <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                <i class="bi bi-check-circle-fill me-1"></i> Đã vào ca: {{ countCheckedIn }}
              </span>
              <span class="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25 px-2 py-1" *ngIf="countLate > 0">
                <i class="bi bi-clock-history me-1"></i> Trễ: {{ countLate }}
              </span>
              <span class="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1">
                <i class="bi bi-hourglass me-1"></i> Chưa vào ca: {{ countNotCheckedIn }}
              </span>
            </div>
          </div>

          <div class="data-table-container">
            <table class="table table-hover table-bordered align-middle">
              <thead>
                <tr>
                  <th>Họ và tên nhân sự</th>
                  <th style="width: 130px;">Số điện thoại</th>
                  <th>Thuộc cụm nhân sự</th>
                  <th>Ca trực & Tuyến phụ trách</th>
                  <th style="width: 140px;">Trạng thái hôm nay</th>
                  <th style="width: 210px;">Thời gian & Vị trí check-in</th>
                  <th style="width: 155px;" class="text-center">Định vị GPS (Hệ thống)</th>
                  <th style="width: 140px;" class="text-center">Đánh giá hợp lệ (Cán bộ)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of filteredPersonnel" [class.table-success]="p.todayAttendance === 'CHECKED_IN' && isRecentCheckIn(p)">
                  <td>
                    <div class="fw-semibold text-dark">{{ p.name }}</div>
                  </td>
                  <td class="font-monospace text-nowrap">
                    <a [href]="'tel:' + p.phone" class="text-decoration-none text-dark">
                      <i class="bi bi-telephone text-muted me-1"></i>{{ p.phone }}
                    </a>
                  </td>
                  <td>{{ p.teamName }}</td>
                  <td>
                    <div *ngIf="p.currentShift || p.currentRouteName" class="mb-1">
                      <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fs-xs">
                        <i class="bi bi-calendar-check me-1"></i>Ca {{ p.currentShift || 'SANG' }} • {{ p.currentRouteName || 'Tuyến được phân công' }}
                      </span>
                    </div>
                    <div class="d-flex flex-wrap gap-1">
                      <span *ngFor="let r of p.assignedRoutes" class="badge bg-light text-secondary border fs-xs">{{ r }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getAttendanceBadgeClass(p.todayAttendance)">
                      {{ getAttendanceLabel(p.todayAttendance) }}
                    </span>
                  </td>
                  <td>
                    <div *ngIf="p.todayAttendance !== 'NOT_CHECKED_IN'" class="fs-xs">
                      <div class="fw-bold text-dark"><i class="bi bi-clock-fill text-primary me-1"></i>{{ p.checkInTime }}</div>
                      <div class="text-muted mt-1" [title]="p.checkInLocation">
                        <i class="bi bi-geo-alt-fill text-danger me-1"></i>{{ p.checkInLocation || 'Hiện trường tuần kiểm' }}
                      </div>
                    </div>
                    <div *ngIf="p.todayAttendance === 'NOT_CHECKED_IN'" class="d-flex align-items-center gap-2">
                      <span class="text-muted fs-xs">Chưa vào ca</span>
                      <button
                        class="btn btn-xs btn-outline-primary d-inline-flex align-items-center gap-1"
                        (click)="quickCheckInFromTable(p)"
                        title="Xác nhận điểm danh nhanh cho nhân viên này"
                      >
                        <i class="bi bi-check2-circle"></i> Điểm danh ngay
                      </button>
                    </div>
                  </td>
                  <!-- CỘT ĐỊNH VỊ GPS HỆ THỐNG ĐỐI SOÁT -->
                  <td class="text-center">
                    <div *ngIf="p.todayAttendance !== 'NOT_CHECKED_IN'">
                      <span
                        *ngIf="p.isGpsValid !== false"
                        class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1"
                        title="Tọa độ GPS điểm danh hợp lệ trong phạm vi tuyến được giao"
                      >
                        <i class="bi bi-geo-alt-fill me-1"></i>Hợp lệ
                      </span>
                      <span
                        *ngIf="p.isGpsValid === false"
                        class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1"
                        title="Tọa độ GPS điểm danh lệch so với tuyến hoặc trạm xuất phát"
                      >
                        <i class="bi bi-exclamation-triangle-fill me-1"></i>Không hợp lệ
                      </span>
                    </div>
                    <div *ngIf="p.todayAttendance === 'NOT_CHECKED_IN'">
                      <span class="text-muted fs-xs">Chưa có GPS</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <button
                        class="btn btn-xs"
                        [class.btn-success]="p.isValidAttendance"
                        [class.btn-outline-success]="!p.isValidAttendance"
                        (click)="evaluateAttendance(p.id, true)"
                        title="Đánh giá hợp lệ"
                      >
                        <i class="bi bi-check-lg"></i> Hợp lệ
                      </button>
                      <button
                        class="btn btn-xs"
                        [class.btn-danger]="p.isValidAttendance === false && p.todayAttendance !== 'NOT_CHECKED_IN'"
                        [class.btn-outline-danger]="p.isValidAttendance !== false"
                        (click)="evaluateAttendance(p.id, false)"
                        title="Đánh giá không hợp lệ"
                      >
                        <i class="bi bi-x-lg"></i> K.Hợp lệ
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL THÊM / SỬA LOẠI VẤN ĐỀ (UC 2) -->
    <div class="custom-modal-backdrop" *ngIf="showCategoryModal">
      <div class="custom-modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="bi bi-tag-fill"></i> {{ editingCategoryId ? 'Cập Nhật Loại Vấn Đề' : 'Thêm Mới Loại Vấn Đề (UC 2)' }}
            </h5>
            <button class="btn-close btn-close-white" (click)="showCategoryModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-bold">Tên loại sự cố (*):</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="categoryForm.name" placeholder="Ví dụ: Đèn tín hiệu tắt..." />
            </div>

            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label fw-bold">Lớp hạ tầng (*):</label>
                <select class="form-select form-select-sm" [(ngModel)]="categoryForm.layerId">
                  <option value="LIGHTING">Chiếu sáng đô thị</option>
                  <option value="GREENERY">Cây xanh & Công viên</option>
                  <option value="DRAINAGE">Thoát nước & Hố ga</option>
                  <option value="ROADWAY">Mặt đường & Biển báo</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold">Độ ưu tiên mặc định:</label>
                <select class="form-select form-select-sm" [(ngModel)]="categoryForm.defaultPriority">
                  <option value="URGENT">Khẩn cấp</option>
                  <option value="HIGH">Cao</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="LOW">Thấp</option>
                </select>
              </div>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label">Thời gian chuẩn khắc phục (giờ):</label>
                <input type="number" class="form-control form-control-sm" [(ngModel)]="categoryForm.estimatedFixHours" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Định mức dự toán tham khảo (VNĐ):</label>
                <input type="number" class="form-control form-control-sm" [(ngModel)]="categoryForm.standardCostEstimate" />
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Mô tả chi tiết:</label>
              <textarea class="form-control form-control-sm" rows="3" [(ngModel)]="categoryForm.description" placeholder="Dấu hiệu nhận biết sự cố..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="showCategoryModal = false">Hủy</button>
            <button class="btn btn-primary btn-sm" (click)="saveCategory()">Lưu Thông Tin</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL THÊM / SỬA CỤM NHÂN SỰ (UC 1) -->
    <div class="custom-modal-backdrop" *ngIf="showTeamModal">
      <div class="custom-modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="bi bi-people-fill"></i> {{ editingTeamId ? 'Cập Nhật Cụm Nhân Sự' : 'Thêm Cụm Nhân Sự Mới (UC 1)' }}
            </h5>
            <button class="btn-close btn-close-white" (click)="showTeamModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-bold">Tên cụm / tổ đội (*):</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="teamForm.name" placeholder="Ví dụ: Đội Tuần kiểm Quận 1..." />
            </div>

            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label fw-bold">Đội trưởng phụ trách:</label>
                <input type="text" class="form-control form-control-sm" [(ngModel)]="teamForm.leaderName" placeholder="Tên đội trưởng..." />
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold">Cụm nhóm quyền:</label>
                <select class="form-select form-select-sm" [(ngModel)]="teamForm.permissionGroup">
                  <option value="QUẢN TRỊ VẬN HÀNH">QUẢN TRỊ VẬN HÀNH</option>
                  <option value="TRƯỞNG ĐỘI TUẦN KIỂM">TRƯỞNG ĐỘI TUẦN KIỂM</option>
                  <option value="NHÂN VIÊN HIỆN TRƯỜNG">NHÂN VIÊN HIỆN TRƯỜNG</option>
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Khu vực phân công:</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="teamForm.assignedArea" placeholder="Ví dụ: Phường Bến Nghé, Bến Thành..." />
            </div>

            <div class="mb-3">
              <label class="form-label">Mô tả chức năng cụm:</label>
              <textarea class="form-control form-control-sm" rows="2" [(ngModel)]="teamForm.description"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="showTeamModal = false">Hủy</button>
            <button class="btn btn-primary btn-sm" (click)="saveTeam()">Lưu Cụm Nhân Sự</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL THÊM NHÂN VIÊN MỚI (UC 5) -->
    <div class="custom-modal-backdrop" *ngIf="showPersonnelModal">
      <div class="custom-modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title"><i class="bi bi-person-plus-fill"></i> Thêm Nhân Viên Tuần Kiểm Mới (UC 5)</h5>
            <button class="btn-close btn-close-white" (click)="showPersonnelModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-bold">Họ và tên nhân viên (*):</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="personnelForm.name" placeholder="Nguyễn Văn A" />
            </div>

            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label">Số điện thoại liên hệ:</label>
                <input type="text" class="form-control form-control-sm" [(ngModel)]="personnelForm.phone" placeholder="0909..." />
              </div>
              <div class="col-md-6">
                <label class="form-label">Vai trò chức vụ:</label>
                <select class="form-select form-select-sm" [(ngModel)]="personnelForm.role">
                  <option value="INSPECTOR">Tuần tra viên</option>
                  <option value="TEAM_LEADER">Trưởng đội</option>
                  <option value="SUPERVISOR">Giám sát viên</option>
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Thuộc cụm nhân sự:</label>
              <select class="form-select form-select-sm" [(ngModel)]="personnelForm.teamId">
                <option *ngFor="let t of patrolService.teams()" [value]="t.id">{{ t.name }}</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Tuyến đường phụ trách (phân cách dấu phẩy):</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="personnelForm.routesString" placeholder="Tuyến Nguyễn Huệ, Tuyến Lê Lợi" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="showPersonnelModal = false">Hủy</button>
            <button class="btn btn-primary btn-sm" (click)="savePersonnel()">Thêm Nhân Viên</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL XEM DANH SÁCH NHÂN SỰ CỦA CỤM (UC 1) -->
    <div class="custom-modal-backdrop" *ngIf="showTeamPersonnelModal" (click)="showTeamPersonnelModal = false">
      <div class="custom-modal-dialog modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header bg-gradient-team text-white">
            <div class="d-flex align-items-center gap-2">
              <span class="team-modal-icon"><i class="bi bi-people-fill"></i></span>
              <div>
                <h5 class="modal-title m-0 fw-bold">Danh Sách Nhân Sự – {{ selectedTeamForPersonnel?.name }}</h5>
                <p class="m-0 fs-xs opacity-75">
                  Mã cụm: <span class="badge bg-light text-dark fw-bold me-1">{{ selectedTeamForPersonnel?.code }}</span>
                  <span class="me-2">• Khu vực: {{ selectedTeamForPersonnel?.assignedArea }}</span>
                  <span class="badge bg-white bg-opacity-25">{{ selectedTeamForPersonnel?.permissionGroup }}</span>
                </p>
              </div>
            </div>
            <button class="btn-close btn-close-white" (click)="showTeamPersonnelModal = false"></button>
          </div>

          <div class="modal-body p-3">
            <!-- Search & Filter bar inside modal -->
            <div class="d-flex justify-content-between align-items-center mb-3 gap-2">
              <div class="search-box flex-grow-1" style="max-width: 480px; position: relative;">
                <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"></i>
                <input
                  type="text"
                  class="form-control form-control-sm ps-4"
                  placeholder="Tìm kiếm nhân sự theo tên, số điện thoại, vai trò, tuyến đường..."
                  [(ngModel)]="teamPersonnelSearch"
                />
              </div>
              <div>
                <span class="badge bg-light text-secondary border px-3 py-2 fw-semibold">
                  <i class="bi bi-people me-1"></i> Hiển thị {{ filteredTeamPersonnel.length }} / {{ getTeamPersonnel(selectedTeamForPersonnel?.id).length }} nhân sự
                </span>
              </div>
            </div>

            <!-- Table of personnel in team -->
            <div class="team-personnel-table-container border rounded">
              <table class="table table-hover table-sm align-middle mb-0" *ngIf="filteredTeamPersonnel.length > 0">
                <thead class="table-light">
                  <tr>
                    <th>Họ và tên nhân sự</th>
                    <th style="width: 140px;">Số điện thoại</th>
                    <th>Tuyến đường phụ trách</th>
                    <th style="width: 140px;" class="text-center">Hôm nay</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of filteredTeamPersonnel">
                    <td>
                      <div class="fw-semibold text-dark">{{ p.name }}</div>
                      <div class="text-muted fs-xs" *ngIf="p.checkInLocation">
                        <i class="bi bi-geo-alt-fill text-danger me-1"></i>{{ p.checkInLocation }}
                      </div>
                    </td>
                    <td class="text-nowrap">
                      <a [href]="'tel:' + p.phone" class="text-decoration-none text-dark">
                        <i class="bi bi-telephone text-muted me-1"></i>{{ p.phone }}
                      </a>
                    </td>
                    <td>
                      <div class="d-flex flex-wrap gap-1">
                        <span *ngFor="let r of p.assignedRoutes" class="badge bg-light text-dark border fs-xs">
                          {{ r }}
                        </span>
                      </div>
                    </td>
                    <td class="text-center">
                      <span class="badge" [ngClass]="getAttendanceBadgeClass(p.todayAttendance)">
                        {{ getAttendanceLabel(p.todayAttendance) }}
                      </span>
                      <div class="fs-xs text-muted mt-1" *ngIf="p.checkInTime">
                        <i class="bi bi-clock me-1"></i>{{ p.checkInTime.split(' ')[0] }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Empty state inside modal -->
              <div *ngIf="filteredTeamPersonnel.length === 0" class="text-center py-4 text-muted">
                <i class="bi bi-person-x fs-2 text-warning mb-2 d-block"></i>
                <div class="fw-semibold">Không tìm thấy nhân sự nào!</div>
                <div class="fs-xs text-secondary mt-1" *ngIf="teamPersonnelSearch">
                  Không có nhân viên nào trong cụm này khớp với từ khóa "{{ teamPersonnelSearch }}".
                </div>
                <div class="fs-xs text-secondary mt-1" *ngIf="!teamPersonnelSearch">
                  Cụm nhân sự này hiện chưa được gán nhân viên.
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer d-flex justify-content-between align-items-center">
            <span class="fs-xs text-muted">
              <i class="bi bi-info-circle me-1"></i> Quản lý điểm danh chi tiết tại tab <strong>3. Quản Lý Nhân Viên & Điểm Danh</strong>
            </span>
            <button class="btn btn-secondary btn-sm" (click)="showTeamPersonnelModal = false">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .config-catalog-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 160px);
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .sub-nav-bar {
      background: #f8fafc;
      border-bottom: 1px solid var(--gray-200);
      padding: 0 16px;

      .sub-tabs-list {
        display: flex;
        gap: 8px;

        .sub-tab-item {
          padding: 12px 16px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          color: var(--gray-600);
          font-weight: 600;
          font-size: 13px;
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
            background: white;
          }
        }
      }
    }

    .catalog-content-wrapper {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .catalog-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .panel-toolbar {
      padding: 12px 18px;
      border-bottom: 1px solid var(--gray-200);
      display: flex;
      justify-content: space-between;
      align-items: center;

      .search-filter-group {
        display: flex;
        align-items: center;
        gap: 10px;

        .search-box {
          position: relative;
          width: 280px;

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

        .layer-filter {
          width: 200px;
        }
      }

      .action-btn-group {
        display: flex;
        gap: 8px;
      }
    }

    .data-table-container {
      flex: 1;
      overflow-y: auto;
      padding: 0;

      table {
        margin: 0;
        font-size: 13px;

        thead {
          position: sticky;
          top: 0;
          background: #f1f5f9;
          z-index: 10;

          th {
            font-size: 11.5px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: var(--gray-600);
            padding: 10px 12px;
          }
        }

        tbody td {
          padding: 10px 12px;
        }
      }
    }

    .layer-pill {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      display: inline-block;
    }

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

    .fs-xs { font-size: 11px; }
    .btn-xs { padding: 2px 6px; font-size: 11.5px; }

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

      &.modal-lg {
        max-width: 860px;
      }

      .modal-header { padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; }
      .modal-body { padding: 18px; }
      .modal-footer { padding: 12px 18px; background: #f8fafc; border-top: 1px solid var(--gray-200); display: flex; justify-content: flex-end; gap: 8px; }
    }

    .bg-gradient-team {
      background: linear-gradient(135deg, #1e3a8a, #2563eb);
    }

    .team-modal-icon {
      width: 36px;
      height: 36px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .team-personnel-table-container {
      max-height: 420px;
      overflow-y: auto;
    }
  `]
})
export class ConfigCatalogComponent {
  patrolService = inject(PatrolService);

  activeSubTab: 'CATEGORIES' | 'TEAMS' | 'PERSONNEL' = 'CATEGORIES';

  // Filters
  categoryKeyword = '';
  categoryLayerFilter = 'ALL';

  teamKeyword = '';

  personnelKeyword = '';
  attendanceFilter = 'ALL';

  // Modal Category
  showCategoryModal = false;
  editingCategoryId: string | null = null;
  categoryForm = {
    name: '',
    layerId: 'LIGHTING' as LayerId,
    defaultPriority: 'HIGH' as IssuePriority,
    estimatedFixHours: 4,
    standardCostEstimate: 4000000,
    description: ''
  };

  // Modal Team
  showTeamModal = false;
  editingTeamId: string | null = null;
  teamForm = {
    name: '',
    leaderName: '',
    permissionGroup: 'NHÂN VIÊN HIỆN TRƯỜNG' as any,
    assignedArea: '',
    description: ''
  };

  // Modal Personnel
  showPersonnelModal = false;
  personnelForm = {
    name: '',
    phone: '',
    role: 'INSPECTOR' as any,
    teamId: 'team-1',
    routesString: 'Tuyến Nguyễn Huệ'
  };

  // Modal Team Personnel (Xem danh sách nhân sự cụm)
  showTeamPersonnelModal = false;
  selectedTeamForPersonnel: PatrolTeam | null = null;
  teamPersonnelSearch = '';

  get filteredCategories(): IssueCategory[] {
    return this.patrolService.categories().filter(c => {
      if (this.categoryLayerFilter !== 'ALL' && c.layerId !== this.categoryLayerFilter) return false;
      if (this.categoryKeyword.trim()) {
        const q = this.categoryKeyword.toLowerCase();
        if (!c.code.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  get filteredTeams(): PatrolTeam[] {
    return this.patrolService.teams().filter(t => {
      if (this.teamKeyword.trim()) {
        const q = this.teamKeyword.toLowerCase();
        return (
          t.code.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.assignedArea.toLowerCase().includes(q) ||
          t.leaderName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }

  get countCheckedIn(): number {
    return this.patrolService.personnel().filter(p => p.todayAttendance === 'CHECKED_IN').length;
  }

  get countNotCheckedIn(): number {
    return this.patrolService.personnel().filter(p => p.todayAttendance === 'NOT_CHECKED_IN').length;
  }

  get countLate(): number {
    return this.patrolService.personnel().filter(p => p.todayAttendance === 'LATE').length;
  }

  isRecentCheckIn(p: PatrolPersonnel): boolean {
    if (!p.checkInTimestamp) return false;
    // Check-in trong vòng 15 phút gần đây
    return Date.now() - p.checkInTimestamp < 15 * 60 * 1000;
  }

  quickCheckInFromTable(p: PatrolPersonnel) {
    if (p.currentScheduleId) {
      this.patrolService.checkInSchedulePersonnel(p.currentScheduleId, p.id);
    } else {
      const schedule = this.patrolService.schedules().find(s => s.assignedPersonnel.some(ap => ap.id === p.id));
      if (schedule) {
        this.patrolService.checkInSchedulePersonnel(schedule.id, p.id);
      } else {
        const timeStr =
          new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
          ' ' +
          new Date().toLocaleDateString('vi-VN');
        const nowTs = Date.now();
        this.patrolService.personnel.update(list =>
          list.map(item => item.id === p.id ? {
            ...item,
            todayAttendance: 'CHECKED_IN',
            checkInTime: timeStr,
            checkInLocation: item.assignedRoutes[0] || 'Hiện trường tuần tra',
            isValidAttendance: true,
            checkInTimestamp: nowTs
          } : item)
        );
        this.patrolService.addLog({
          personnelName: p.name,
          action: 'CHECK_IN',
          title: `Cán bộ xác nhận điểm danh: ${p.name}`,
          details: `Xác nhận trực tiếp tại bảng Quản lý điểm danh. Giờ: ${timeStr}`,
          timestamp: timeStr,
          lat: 10.7745,
          lng: 106.7025,
          status: 'SUCCESS'
        });
      }
    }
  }

  private parseCheckInTimeString(str?: string): number {
    if (!str) return 0;
    try {
      const parts = str.split(' ');
      if (parts.length >= 2) {
        const timeParts = parts[0].split(':');
        const dateParts = parts[1].split('/');
        if (dateParts.length === 3 && timeParts.length >= 2) {
          const d = parseInt(dateParts[0], 10);
          const m = parseInt(dateParts[1], 10) - 1;
          const y = parseInt(dateParts[2], 10);
          const h = parseInt(timeParts[0], 10);
          const min = parseInt(timeParts[1], 10);
          return new Date(y, m, d, h, min).getTime();
        }
      }
    } catch {
      return 0;
    }
    return 0;
  }

  get filteredPersonnel(): PatrolPersonnel[] {
    const list = this.patrolService.personnel().filter(p => {
      if (this.attendanceFilter !== 'ALL' && p.todayAttendance !== this.attendanceFilter) return false;
      if (this.personnelKeyword.trim()) {
        const q = this.personnelKeyword.toLowerCase();
        return (
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.assignedRoutes.some(r => r.toLowerCase().includes(q)) ||
          (p.currentRouteName && p.currentRouteName.toLowerCase().includes(q))
        );
      }
      return true;
    });

    // Sắp xếp người mới điểm danh gần nhất lên đầu (Live Feed)
    return list.sort((a, b) => {
      const aChecked = a.todayAttendance === 'CHECKED_IN' || a.todayAttendance === 'LATE';
      const bChecked = b.todayAttendance === 'CHECKED_IN' || b.todayAttendance === 'LATE';

      if (aChecked && bChecked) {
        const tA = a.checkInTimestamp || this.parseCheckInTimeString(a.checkInTime);
        const tB = b.checkInTimestamp || this.parseCheckInTimeString(b.checkInTime);
        return tB - tA; // Giảm dần: mới nhất lên đầu
      }
      if (aChecked && !bChecked) return -1;
      if (!aChecked && bChecked) return 1;
      return 0;
    });
  }

  getLayerColor(layerId: string): string {
    switch (layerId) {
      case 'LIGHTING': return '#f59e0b';
      case 'GREENERY': return '#10b981';
      case 'DRAINAGE': return '#06b6d4';
      default: return '#8b5cf6';
    }
  }

  getLayerName(layerId: string): string {
    switch (layerId) {
      case 'LIGHTING': return 'Chiếu sáng đô thị';
      case 'GREENERY': return 'Cây xanh & Công viên';
      case 'DRAINAGE': return 'Thoát nước & Hố ga';
      default: return 'Mặt đường & Biển báo';
    }
  }

  getPriorityLabel(p: IssuePriority): string {
    switch (p) {
      case 'URGENT': return 'Khẩn cấp';
      case 'HIGH': return 'Cao';
      case 'MEDIUM': return 'Trung bình';
      case 'LOW': return 'Thấp';
    }
  }

  getRoleBadgeClass(perm: string): string {
    switch (perm) {
      case 'QUẢN TRỊ VẬN HÀNH': return 'bg-danger';
      case 'TRƯỞNG ĐỘI TUẦN KIỂM': return 'bg-primary';
      default: return 'bg-info text-dark';
    }
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

  // CRUD Category
  openAddCategoryModal() {
    this.editingCategoryId = null;
    this.categoryForm = {
      name: '',
      layerId: 'LIGHTING',
      defaultPriority: 'HIGH',
      estimatedFixHours: 4,
      standardCostEstimate: 4000000,
      description: ''
    };
    this.showCategoryModal = true;
  }

  openEditCategoryModal(cat: IssueCategory) {
    this.editingCategoryId = cat.id;
    this.categoryForm = {
      name: cat.name,
      layerId: cat.layerId,
      defaultPriority: cat.defaultPriority,
      estimatedFixHours: cat.estimatedFixHours,
      standardCostEstimate: cat.standardCostEstimate,
      description: cat.description
    };
    this.showCategoryModal = true;
  }

  saveCategory() {
    if (!this.categoryForm.name.trim()) return;

    if (this.editingCategoryId) {
      this.patrolService.updateCategory(this.editingCategoryId, this.categoryForm);
    } else {
      this.patrolService.addCategory(this.categoryForm);
    }
    this.showCategoryModal = false;
  }

  deleteCategory(cat: IssueCategory) {
    if (confirm(`Bạn có chắc muốn xóa loại vấn đề "${cat.name}"?`)) {
      this.patrolService.deleteCategory(cat.id);
    }
  }

  exportCategoriesExcel() {
    const rows = this.filteredCategories.map(c => [
      c.code,
      c.name,
      this.getLayerName(c.layerId),
      this.getPriorityLabel(c.defaultPriority),
      `${c.estimatedFixHours} giờ`,
      c.standardCostEstimate,
      c.isActive ? 'Đang áp dụng' : 'Khóa'
    ]);
    this.patrolService.exportToCsv(
      'Danh_Muc_Loai_Van_De',
      ['Mã Loại', 'Tên Loại Sự Cố', 'Lớp Hạ Tầng', 'Độ Ưu Tiên', 'TG Khắc Phục Chuẩn', 'Định Mức Dự Toán (VNĐ)', 'Trạng Thái'],
      rows
    );
  }

  // CRUD Team
  openAddTeamModal() {
    this.editingTeamId = null;
    this.teamForm = {
      name: '',
      leaderName: '',
      permissionGroup: 'NHÂN VIÊN HIỆN TRƯỜNG',
      assignedArea: '',
      description: ''
    };
    this.showTeamModal = true;
  }

  openEditTeamModal(team: PatrolTeam) {
    this.editingTeamId = team.id;
    this.teamForm = {
      name: team.name,
      leaderName: team.leaderName,
      permissionGroup: team.permissionGroup,
      assignedArea: team.assignedArea,
      description: team.description
    };
    this.showTeamModal = true;
  }

  saveTeam() {
    if (!this.teamForm.name.trim()) return;

    if (this.editingTeamId) {
      this.patrolService.updateTeam(this.editingTeamId, this.teamForm);
    } else {
      this.patrolService.addTeam(this.teamForm);
    }
    this.showTeamModal = false;
  }

  deleteTeam(team: PatrolTeam) {
    if (confirm(`Bạn có chắc muốn xóa cụm nhân sự "${team.name}"?`)) {
      this.patrolService.deleteTeam(team.id);
    }
  }

  // --- MODAL XEM DANH SÁCH NHÂN SỰ CỦA CỤM (UC 1) ---
  openTeamPersonnelModal(team: PatrolTeam) {
    this.selectedTeamForPersonnel = team;
    this.teamPersonnelSearch = '';
    this.showTeamPersonnelModal = true;
  }

  getTeamPersonnel(teamId?: string): PatrolPersonnel[] {
    if (!teamId) return [];
    return this.patrolService.personnel().filter(p => p.teamId === teamId);
  }

  get filteredTeamPersonnel(): PatrolPersonnel[] {
    if (!this.selectedTeamForPersonnel) return [];
    const list = this.getTeamPersonnel(this.selectedTeamForPersonnel.id);
    if (!this.teamPersonnelSearch.trim()) return list;
    const q = this.teamPersonnelSearch.toLowerCase();
    return list.filter(p =>
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      this.getPersonnelRoleLabel(p.role).toLowerCase().includes(q) ||
      p.assignedRoutes.some(r => r.toLowerCase().includes(q))
    );
  }

  getPersonnelRoleLabel(role: string): string {
    switch (role) {
      case 'TEAM_LEADER': return 'Trưởng đội';
      case 'SUPERVISOR': return 'Giám sát viên';
      default: return 'Tuần tra viên';
    }
  }

  getPersonnelRoleBadgeClass(role: string): string {
    switch (role) {
      case 'TEAM_LEADER': return 'bg-primary text-white';
      case 'SUPERVISOR': return 'bg-warning text-dark';
      default: return 'bg-secondary text-white';
    }
  }

  getPersonnelCount(teamId: string, fallbackCount: number = 0): number {
    const list = this.getTeamPersonnel(teamId);
    return list.length > 0 ? list.length : fallbackCount;
  }

  // CRUD Personnel & Attendance
  openAddPersonnelModal() {
    this.personnelForm = {
      name: '',
      phone: '',
      role: 'INSPECTOR',
      teamId: this.patrolService.teams()[0]?.id || 'team-1',
      routesString: 'Tuyến Nguyễn Huệ'
    };
    this.showPersonnelModal = true;
  }

  savePersonnel() {
    if (!this.personnelForm.name.trim()) return;

    const team = this.patrolService.teams().find(t => t.id === this.personnelForm.teamId);
    const routes = this.personnelForm.routesString.split(',').map(s => s.trim()).filter(s => !!s);

    this.patrolService.addPersonnel({
      name: this.personnelForm.name,
      phone: this.personnelForm.phone,
      role: this.personnelForm.role,
      teamId: this.personnelForm.teamId,
      teamName: team?.name || 'Đội tuần kiểm',
      assignedRoutes: routes
    });
    this.showPersonnelModal = false;
  }

  evaluateAttendance(id: string, isValid: boolean) {
    this.patrolService.evaluateAttendance(id, isValid);
  }

  exportPersonnelExcel() {
    const rows = this.filteredPersonnel.map(p => [
      p.name,
      p.phone,
      p.teamName,
      p.currentShift ? `Ca ${p.currentShift} - ${p.currentRouteName || ''}` : p.assignedRoutes.join('; '),
      this.getAttendanceLabel(p.todayAttendance),
      p.checkInTime || 'Chưa điểm danh',
      p.checkInLocation || 'N/A',
      p.todayAttendance === 'NOT_CHECKED_IN' ? 'Chưa có GPS' : (p.isGpsValid !== false ? 'Hợp lệ' : 'Không hợp lệ'),
      p.isValidAttendance ? 'Hợp lệ' : p.isValidAttendance === false ? 'Không hợp lệ' : 'Chưa đánh giá'
    ]);

    this.patrolService.exportToCsv(
      'Bao_Cao_Diem_Danh_Nhan_Su',
      ['Họ Và Tên', 'Số Điện Thoại', 'Tổ Đội', 'Ca & Tuyến Phụ Trách', 'Trạng Thái Hôm Nay', 'Giờ Điểm Danh', 'Vị Trí Check-in', 'Định Vị GPS (Hệ Thống)', 'Cán Bộ Đánh Giá'],
      rows
    );
  }
}
