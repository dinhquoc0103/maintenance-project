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
                  <th style="width: 160px;">Đội trưởng</th>
                  <th>Khu vực phụ trách</th>
                  <th style="width: 180px;">Cụm nhóm quyền</th>
                  <th style="width: 100px;" class="text-center">Quân số</th>
                  <th style="width: 100px;" class="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let team of filteredTeams">
                  <td class="font-monospace fw-bold text-primary">{{ team.code }}</td>
                  <td>
                    <div class="fw-semibold">{{ team.name }}</div>
                    <div class="text-muted fs-xs">{{ team.description }}</div>
                  </td>
                  <td>
                    <i class="bi bi-person-fill text-primary"></i> {{ team.leaderName }}
                  </td>
                  <td>{{ team.assignedArea }}</td>
                  <td>
                    <span class="badge" [ngClass]="getRoleBadgeClass(team.permissionGroup)">
                      {{ team.permissionGroup }}
                    </span>
                  </td>
                  <td class="text-center fw-bold">{{ team.memberCount }} nhân sự</td>
                  <td class="text-center">
                    <button class="btn btn-xs btn-ghost text-primary" (click)="openEditTeamModal(team)" title="Chỉnh sửa">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-xs btn-ghost text-danger ms-1" (click)="deleteTeam(team)" title="Xóa">
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
              <button class="btn btn-sm btn-primary" (click)="openAddPersonnelModal()">
                <i class="bi bi-plus-lg"></i> Thêm Nhân Viên
              </button>
            </div>
          </div>

          <div class="data-table-container">
            <table class="table table-hover table-bordered align-middle">
              <thead>
                <tr>
                  <th style="width: 100px;">Mã NV</th>
                  <th>Họ và tên nhân sự</th>
                  <th style="width: 130px;">Số điện thoại</th>
                  <th>Thuộc cụm nhân sự</th>
                  <th>Tuyến đường phụ trách</th>
                  <th style="width: 140px;">Trạng thái hôm nay</th>
                  <th style="width: 180px;">Thời gian & Vị trí check-in</th>
                  <th style="width: 140px;" class="text-center">Đánh giá hợp lệ (Cán bộ)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of filteredPersonnel">
                  <td class="font-monospace fw-bold text-primary">{{ p.code }}</td>
                  <td>
                    <div class="fw-semibold">{{ p.name }}</div>
                    <span class="badge bg-light text-dark fs-xs">{{ p.role === 'TEAM_LEADER' ? 'Trưởng đội' : p.role === 'SUPERVISOR' ? 'Giám sát viên' : 'Tuần tra viên' }}</span>
                  </td>
                  <td class="font-monospace">{{ p.phone }}</td>
                  <td>{{ p.teamName }}</td>
                  <td>
                    <div class="d-flex flex-wrap gap-1">
                      <span *ngFor="let r of p.assignedRoutes" class="badge bg-light text-primary border fs-xs">{{ r }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getAttendanceBadgeClass(p.todayAttendance)">
                      {{ getAttendanceLabel(p.todayAttendance) }}
                    </span>
                  </td>
                  <td>
                    <div *ngIf="p.checkInTime" class="fs-xs">
                      <div><i class="bi bi-clock"></i> {{ p.checkInTime }}</div>
                      <div class="text-muted"><i class="bi bi-geo-alt"></i> {{ p.checkInLocation }}</div>
                    </div>
                    <span *ngIf="!p.checkInTime" class="text-muted fs-xs">Chưa có dữ liệu</span>
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

      .modal-header { padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; }
      .modal-body { padding: 18px; }
      .modal-footer { padding: 12px 18px; background: #f8fafc; border-top: 1px solid var(--gray-200); display: flex; justify-content: flex-end; gap: 8px; }
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

  get filteredPersonnel(): PatrolPersonnel[] {
    return this.patrolService.personnel().filter(p => {
      if (this.attendanceFilter !== 'ALL' && p.todayAttendance !== this.attendanceFilter) return false;
      if (this.personnelKeyword.trim()) {
        const q = this.personnelKeyword.toLowerCase();
        return (
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.assignedRoutes.some(r => r.toLowerCase().includes(q))
        );
      }
      return true;
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
      p.code,
      p.name,
      p.phone,
      p.teamName,
      p.assignedRoutes.join('; '),
      this.getAttendanceLabel(p.todayAttendance),
      p.checkInTime || 'Chưa điểm danh',
      p.checkInLocation || 'N/A',
      p.isValidAttendance ? 'Hợp lệ' : p.isValidAttendance === false ? 'Không hợp lệ' : 'Chưa đánh giá'
    ]);

    this.patrolService.exportToCsv(
      'Bao_Cao_Diem_Danh_Nhan_Su',
      ['Mã NV', 'Họ Và Tên', 'Số Điện Thoại', 'Tổ Đội', 'Tuyến Phụ Trách', 'Trạng Thái Hôm Nay', 'Giờ Điểm Danh', 'Vị Trí Check-in GPS', 'Cán Bộ Đánh Giá'],
      rows
    );
  }
}
