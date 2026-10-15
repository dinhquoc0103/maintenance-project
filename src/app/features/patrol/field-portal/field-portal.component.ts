import {
  Component,
  inject,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { PatrolService } from '../../../core/services/patrol.service';
import { ProjectService } from '../../../core/services/project.service';
import {
  PatrolIssue,
  PatrolSchedule,
  PatrolPersonnel,
  AttendanceStatus,
  AssetCondition,
} from '../../../core/models/patrol.model';
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
              <span
                >CỔNG THÔNG TIN NHÂN VIÊN HIỆN TRƯỜNG (WEB FIELD PORTAL)</span
              >
            </div>
            <h1 class="portal-heading">
              Cổng Tác Nghiệp Tuần Kiểm & Khắc Phục Hiện Trường
            </h1>
            <p class="portal-sub">
              Điểm danh ca trực trực tiếp trên Web (UC 8), Báo cáo sự cố (UC 7)
              & Tiếp nhận khắc phục (UC 10)
            </p>
          </div>

          <!-- Persona Selector & Actions -->
          <div class="header-actions">
            <!-- Đóng vai người dùng khi demo -->
            <div class="persona-selector-box">
              <span class="persona-label text-muted fs-xs">Đang đóng vai:</span>
              <select
                class="form-select form-select-sm persona-select"
                [(ngModel)]="currentPersona"
                (ngModelChange)="onPersonaChange()"
              >
                <option value="TUAN_NAM">
                  👮‍♂️ Trần Đình Nam (Đội 1 • Đủ 4 trạng thái ca trực)
                </option>
                <option value="TUAN_HANG">
                  👩‍💼 Phạm Thị Thúy Hằng (Đội 2 • Điểm danh KHÔNG HỢP LỆ)
                </option>
                <option value="TUAN_TUNG">
                  👷 Đặng Thanh Tùng (Đội 3 • CHƯA ĐIỂM DANH)
                </option>
                <option value="THO_HAI">
                  👨‍🔧 Nguyễn Văn Hải (Thợ Khắc Phục Sự Cố Nhanh)
                </option>
              </select>
            </div>

            <a
              routerLink="/patrol"
              class="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
            >
              <i class="bi bi-box-arrow-left"></i>
              <span>Về Admin</span>
            </a>
          </div>
        </div>

        <!-- Role Banner Alert -->
        <div
          class="role-welcome-banner"
          [ngClass]="
            currentPersona === 'THO_HAI' ? 'banner-worker' : 'banner-patrol'
          "
        >
          <div class="d-flex align-items-center gap-2">
            <i
              class="bi fs-5"
              [ngClass]="
                currentPersona === 'THO_HAI'
                  ? 'bi-tools text-warning'
                  : currentPersona === 'TUAN_HANG'
                    ? 'bi-exclamation-triangle-fill text-danger'
                    : 'bi-shield-check text-primary'
              "
            ></i>
            <div>
              <strong class="d-block">
                {{
                  currentPersona === 'THO_HAI'
                    ? 'Tài khoản: Nguyễn Văn Hải • Đội Phản ứng nhanh Duy tu Quận 1'
                    : currentPersona === 'TUAN_HANG'
                      ? 'Tài khoản: Phạm Thị Thúy Hằng • Đội Tuần kiểm Ven Sông (Bị đánh giá Không hợp lệ)'
                      : currentPersona === 'TUAN_TUNG'
                        ? 'Tài khoản: Đặng Thanh Tùng • Tổ Phản ứng nhanh Thoát nước (Chưa điểm danh)'
                        : 'Tài khoản: Trần Đình Nam • Đội Tuần kiểm Trung tâm Quận 1'
                }}
              </strong>
              <span class="fs-xs text-muted">
                {{
                  currentPersona === 'THO_HAI'
                    ? 'Nhiệm vụ: Tiếp nhận danh sách nhiệm vụ sửa chữa được giao (UC 10), đến hiện trường và báo cáo hoàn thành sau khi khắc phục.'
                    : 'Nhiệm vụ: Xem danh sách ca tuần được phân công, vào ca thực hiện Điểm danh (UC 8) & Báo cáo sự cố phát hiện dọc tuyến (UC 7).'
                }}
              </span>
            </div>
          </div>

          <div class="quick-status-chip">
            <ng-container [ngSwitch]="getAttendanceEvaluation(currentSchedule)">
              <span *ngSwitchCase="'VALID'" class="badge bg-success">
                <i class="bi bi-check-circle-fill me-1"></i> Điểm danh Hợp lệ
              </span>
              <span *ngSwitchCase="'INVALID'" class="badge bg-danger">
                <i class="bi bi-exclamation-triangle-fill me-1"></i> Điểm danh K.Hợp lệ (Cần giải trình)
              </span>
              <span *ngSwitchCase="'PENDING'" class="badge bg-info text-dark">
                <i class="bi bi-clock-history me-1"></i> Đã check-in (Chờ Cán bộ duyệt)
              </span>
              <span *ngSwitchDefault class="badge bg-warning text-dark">
                <i class="bi bi-clock me-1"></i> Chưa điểm danh ca trực này
              </span>
            </ng-container>
          </div>
        </div>

        <!-- 3 TABS NGHIỆP VỤ RÕ RÀNG -->
        <div class="portal-nav-tabs">
          <button
            class="tab-btn tab-highlight"
            [class.active]="activeTab === 'MY_SCHEDULE'"
            (click)="switchTab('MY_SCHEDULE')"
          >
            <i class="bi bi-calendar2-week-fill text-primary"></i>
            <span>1. Lịch Tuần Tra & Ca Của Tôi</span>
            <span
              class="badge bg-primary ms-1"
              *ngIf="myAssignedSchedules.length > 0"
              >{{ myAssignedSchedules.length }} ca</span
            >
          </button>

          <button
            class="tab-btn"
            [class.active]="activeTab === 'MY_ISSUES'"
            (click)="switchTab('MY_ISSUES')"
          >
            <i class="bi bi-journal-check"></i>
            <span>2. Sổ Sự Cố Của Tôi & Ghi Nhận Mới (UC 7)</span>
            <span class="badge bg-danger ms-1" *ngIf="myRejectedIssuesCount > 0"
              >{{ myRejectedIssuesCount }} bị từ chối</span
            >
            <span
              class="badge bg-primary ms-1"
              *ngIf="myRejectedIssuesCount === 0"
              >{{ myReportedIssues.length }} vụ</span
            >
          </button>

          <button
            class="tab-btn"
            [class.active]="activeTab === 'TASKS'"
            (click)="switchTab('TASKS')"
          >
            <i class="bi bi-tools"></i>
            <span>3. Nhiệm Vụ Khắc Phục Được Giao (UC 10)</span>
            <span class="badge bg-warning text-dark ms-1">{{
              myAssignedTasks.length
            }}</span>
          </button>
        </div>
      </header>

      <!-- BODY CONTENT -->
      <main class="portal-body">
        <!-- ==================== TAB 1: LỊCH TUẦN TRA & CA CỦA TÔI (UC 3, UC 8, UC 7) ==================== -->
        <div *ngIf="activeTab === 'MY_SCHEDULE'" class="schedule-portal-panel">
          <!-- ==================== MÀN HÌNH 1: DANH SÁCH CA TUẦN TRA (KHI CHƯA CHỌN VÀO CHI TIẾT) ==================== -->
          <div *ngIf="!viewingScheduleDetail" class="portal-box-card">
            <div
              class="card-title-bar bg-light d-flex justify-content-between align-items-center flex-wrap gap-2"
            >
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-calendar3-range text-primary fs-5"></i>
                <div>
                  <h4 class="m-0 fw-bold fs-6">
                    Danh Sách Ca Tuần Tra Được Phân Công Cho Bạn
                  </h4>
                  <p class="m-0 fs-xxs text-muted">
                    Bấm vào bất kỳ ca nào để vào chi tiết tác nghiệp, điểm danh
                    nhận ca (UC 8) và báo cáo sự cố (UC 7)
                  </p>
                </div>
              </div>

              <!-- BỘ LỌC TRẠNG THÁI CA -->
              <div class="d-flex align-items-center gap-2">
                <span class="fs-xs text-muted">Lọc ca:</span>
                <div class="btn-group btn-group-sm">
                  <button
                    class="btn btn-outline-secondary"
                    [class.active]="scheduleFilter === 'ALL'"
                    (click)="scheduleFilter = 'ALL'"
                  >
                    Tất cả ({{ myAssignedSchedules.length }})
                  </button>
                  <button
                    class="btn btn-outline-secondary"
                    [class.active]="scheduleFilter === 'TODAY'"
                    (click)="scheduleFilter = 'TODAY'"
                  >
                    Hôm nay
                  </button>
                  <button
                    class="btn btn-outline-secondary"
                    [class.active]="scheduleFilter === 'IN_PROGRESS'"
                    (click)="scheduleFilter = 'IN_PROGRESS'"
                  >
                    Đang đi tuần
                  </button>
                  <button
                    class="btn btn-outline-secondary"
                    [class.active]="scheduleFilter === 'PLANNED'"
                    (click)="scheduleFilter = 'PLANNED'"
                  >
                    Chờ bắt đầu
                  </button>
                </div>
              </div>
            </div>

            <!-- DANH SÁCH CA DẠNG SCHEDULE CARDS LIST -->
            <div class="p-3">
              <div class="schedule-list-stack">
                <div
                  class="schedule-row-card p-3 rounded border mb-3 shadow-2xs"
                  *ngFor="let sch of filteredMyAssignedSchedules"
                  (click)="openScheduleDetail(sch)"
                >
                  <div
                    class="d-flex justify-content-between align-items-center flex-wrap gap-3"
                  >
                    <!-- KHỐI 1: NGÀY & CA -->
                    <div
                      class="shift-date-block d-flex align-items-center gap-3"
                    >
                      <div
                        class="shift-calendar-badge"
                        [ngClass]="
                          sch.shift === 'SANG'
                            ? 'badge-morning'
                            : sch.shift === 'CHIEU'
                              ? 'badge-afternoon'
                              : 'badge-night'
                        "
                      >
                        <div class="cal-month">
                          {{
                            sch.shift === 'SANG'
                              ? 'CA SÁNG'
                              : sch.shift === 'CHIEU'
                                ? 'CA CHIỀU'
                                : 'CA TỐI'
                          }}
                        </div>
                        <div class="cal-day">{{ sch.date.split('-')[2] }}</div>
                        <div class="cal-year">
                          {{ sch.date.split('-')[1] }}/{{
                            sch.date.split('-')[0]
                          }}
                        </div>
                      </div>

                      <div>
                        <div
                          class="d-flex align-items-center gap-2 mb-1 flex-wrap"
                        >
                          <span
                            class="badge bg-light text-dark border font-monospace fs-xxs"
                            >{{ sch.id }}</span
                          >
                          <span
                            class="badge bg-primary-subtle text-primary fw-bold fs-xxs"
                            *ngIf="sch.id === todaySchedule?.id"
                          >
                            <i class="bi bi-star-fill text-warning me-1"></i>Hôm
                            nay
                          </span>
                          <span class="text-muted fs-xxs font-monospace">
                            <i class="bi bi-clock me-1"></i
                            >{{
                              sch.shift === 'SANG'
                                ? '06:00 - 11:30'
                                : sch.shift === 'CHIEU'
                                  ? '13:00 - 17:30'
                                  : '18:00 - 22:00'
                            }}
                          </span>
                        </div>
                        <h4
                          class="m-0 fw-bold fs-6 text-dark route-hover-title"
                        >
                          {{ sch.routeName }}
                        </h4>
                        <div class="text-muted fs-xs mt-1">
                          <i class="bi bi-geo-alt text-danger me-1"></i>
                          <span
                            >{{ sch.startPointName }} &rarr;
                            {{ sch.endPointName }}</span
                          >
                        </div>
                      </div>
                    </div>

                    <!-- KHỐI 2: TỔ ĐỘI & SỰ CỐ -->
                    <div
                      class="shift-meta-block d-flex align-items-center gap-4"
                    >
                      <div>
                        <div class="fs-xxs text-muted">Tổ đội tuần kiểm:</div>
                        <div class="fw-semibold fs-xs text-dark">
                          <i class="bi bi-people text-primary me-1"></i
                          >{{ sch.teamName }}
                        </div>
                        <div class="fs-xxs text-muted mt-1">
                          {{ sch.assignedPersonnel.length }} nhân sự phân công
                        </div>
                      </div>

                      <div class="text-center px-2">
                        <div class="fs-xxs text-muted">Sự cố trong ca:</div>
                        <span
                          class="badge mt-1"
                          [ngClass]="
                            getIssuesCountForSchedule(sch.id) > 0
                              ? 'bg-danger'
                              : 'bg-secondary'
                          "
                        >
                          {{ getIssuesCountForSchedule(sch.id) }} vụ việc
                        </span>
                      </div>
                    </div>

                    <!-- KHỐI 3: TRẠNG THÁI & NÚT HÀNH ĐỘNG -->
                    <div
                      class="shift-action-block d-flex align-items-center gap-3"
                    >
                      <div class="text-end">
                        <span
                          class="badge py-1 px-2 d-block mb-1"
                          [ngClass]="
                            sch.status === 'IN_PROGRESS'
                              ? 'bg-success'
                              : sch.status === 'PLANNED'
                                ? 'bg-secondary'
                                : 'bg-primary'
                          "
                        >
                          <i
                            class="bi"
                            [ngClass]="
                              sch.status === 'IN_PROGRESS'
                                ? 'bi-broadcast'
                                : sch.status === 'PLANNED'
                                  ? 'bi-clock'
                                  : 'bi-check2-all'
                            "
                          ></i>
                          {{
                            sch.status === 'IN_PROGRESS'
                              ? 'Đang đi tuần'
                              : sch.status === 'PLANNED'
                                ? 'Chờ bắt đầu'
                                : 'Đã hoàn thành'
                          }}
                        </span>
                        <!-- BADGE TRẠNG THÁI ĐIỂM DANH ĐỦ 4 TRƯỜNG HỢP -->
                        <ng-container [ngSwitch]="getAttendanceEvaluation(sch)">
                          <span
                            *ngSwitchCase="'VALID'"
                            class="badge fs-xxxs py-1 px-2 d-block bg-success-subtle text-success border border-success-subtle"
                          >
                            <i class="bi bi-check-circle-fill me-1"></i>Đã Điểm Danh • Hợp Lệ
                          </span>
                          <span
                            *ngSwitchCase="'INVALID'"
                            class="badge fs-xxxs py-1 px-2 d-block bg-danger-subtle text-danger border border-danger-subtle"
                          >
                            <i class="bi bi-exclamation-triangle-fill me-1"></i>Điểm Danh K.Hợp Lệ (Giải trình)
                          </span>
                          <span
                            *ngSwitchCase="'PENDING'"
                            class="badge fs-xxxs py-1 px-2 d-block bg-info-subtle text-info-emphasis border border-info-subtle"
                          >
                            <i class="bi bi-clock-history me-1"></i>Đã Check-in • Chờ Duyệt
                          </span>
                          <span
                            *ngSwitchDefault
                            class="badge fs-xxxs py-1 px-2 d-block bg-warning-subtle text-warning-emphasis border border-warning-subtle"
                          >
                            <i class="bi bi-clock me-1"></i>Chưa Điểm Danh
                          </span>
                        </ng-container>
                      </div>

                      <div>
                        <button
                          class="btn btn-sm btn-success fw-bold d-flex align-items-center gap-1 shadow-sm px-3"
                          *ngIf="sch.status === 'IN_PROGRESS'"
                        >
                          <span>Vào Ca Tác Nghiệp</span>
                          <i class="bi bi-arrow-right-short fs-5"></i>
                        </button>
                        <button
                          class="btn btn-sm btn-primary fw-bold d-flex align-items-center gap-1 px-3"
                          *ngIf="sch.status === 'PLANNED'"
                        >
                          <span>Chi Tiết & Bắt Đầu</span>
                          <i class="bi bi-arrow-right-short fs-5"></i>
                        </button>
                        <button
                          class="btn btn-sm btn-outline-secondary fw-semibold d-flex align-items-center gap-1 px-3"
                          *ngIf="sch.status === 'COMPLETED'"
                        >
                          <span>Xem Nhật Ký</span>
                          <i class="bi bi-journal-text"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- EMPTY STATE -->
                <div
                  class="p-5 text-center text-muted"
                  *ngIf="filteredMyAssignedSchedules.length === 0"
                >
                  <i class="bi bi-calendar-x fs-1"></i>
                  <h5 class="mt-2 fs-6">Không có ca tuần tra nào phù hợp</h5>
                  <p class="fs-xs">
                    Hãy thử chọn bộ lọc khác hoặc kiểm tra lại lịch phân công từ
                    Cán bộ.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== MÀN HÌNH 2: CHI TIẾT CA TUẦN TRA & TÁC NGHIỆP (KHI viewingScheduleDetail === true) ==================== -->
          <div
            *ngIf="viewingScheduleDetail && currentSchedule"
            class="schedule-detail-view"
          >
            <!-- TOP BREADCRUMB & ACTION BAR -->
            <div
              class="detail-top-nav mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 bg-white rounded border shadow-sm"
            >
              <div class="d-flex align-items-center gap-3">
                <button
                  class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  (click)="closeScheduleDetail()"
                >
                  <i class="bi bi-arrow-left"></i>
                  <span>Quay lại Danh Sách Ca</span>
                </button>
                <div class="vr"></div>
                <div>
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="badge bg-primary font-monospace">{{
                      currentSchedule.id
                    }}</span>
                    <h3 class="m-0 fw-bold fs-5 text-dark">
                      {{ currentSchedule.routeName }}
                    </h3>
                    <span
                      class="shift-status-badge ms-2"
                      [ngClass]="
                        'status-' + currentSchedule.status.toLowerCase()
                      "
                    >
                      <i
                        class="bi"
                        [ngClass]="
                          currentSchedule.status === 'IN_PROGRESS'
                            ? 'bi-broadcast-pin'
                            : currentSchedule.status === 'PLANNED'
                              ? 'bi-clock-history'
                              : 'bi-check-all'
                        "
                      ></i>
                      {{
                        currentSchedule.status === 'IN_PROGRESS'
                          ? 'ĐANG ĐI TUẦN'
                          : currentSchedule.status === 'PLANNED'
                            ? 'CHỜ BẮT ĐẦU'
                            : 'ĐÃ HOÀN THÀNH'
                      }}
                    </span>
                  </div>
                  <div class="fs-xxs text-muted mt-1">
                    <i class="bi bi-calendar-check text-primary"></i>
                    {{ currentSchedule.date }} ({{
                      currentSchedule.shift === 'SANG'
                        ? 'Ca Sáng: 06:00 - 11:30'
                        : currentSchedule.shift === 'CHIEU'
                          ? 'Ca Chiều: 13:00 - 17:30'
                          : 'Ca Tối: 18:00 - 22:00'
                    }})
                  </div>
                </div>
              </div>

              <!-- CỤM NÚT TRẠNG THÁI CA -->
              <div class="d-flex align-items-center gap-2">
                <button
                  class="btn btn-sm btn-success fw-bold d-flex align-items-center gap-1 shadow-sm px-3"
                  *ngIf="currentSchedule.status === 'PLANNED'"
                  (click)="startPatrolShift(currentSchedule)"
                >
                  <i class="bi bi-play-circle-fill"></i>
                  <span>Bắt Đầu Đi Tuần</span>
                </button>

                <button
                  class="btn btn-sm btn-outline-danger fw-bold d-flex align-items-center gap-1 px-3"
                  *ngIf="currentSchedule.status === 'IN_PROGRESS'"
                  (click)="completePatrolShift(currentSchedule)"
                >
                  <i class="bi bi-check-circle-fill text-success"></i>
                  <span>Kết Thúc Ca Tuần</span>
                </button>

                <span
                  class="badge bg-success-subtle text-success border border-success-subtle p-2 px-3 fs-xs"
                  *ngIf="currentSchedule.status === 'COMPLETED'"
                >
                  <i class="bi bi-check-all fs-6"></i> Ca Đã Hoàn Thành
                </span>
              </div>
            </div>

            <!-- NỘI DUNG 1 CỘT RỘNG RÃI THOÁNG MẮT -->
            <div class="row g-3">
              <div class="col-12">
                <!-- CARD 1: LỘ TRÌNH, TỔ ĐỘI & BẢN ĐỒ TOGGLE -->
                <div class="portal-box-card p-3 mb-3 bg-white border rounded">
                  <div
                    class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3"
                  >
                    <div class="d-flex align-items-center gap-2">
                      <i class="bi bi-signpost-2-fill text-primary fs-5"></i>
                      <h4 class="m-0 fw-bold fs-6">
                        Thông Tin Tuyến Đường & Lệnh Công Tác
                      </h4>
                    </div>

                    <!-- NÚT TOGGLE BẢN ĐỒ LỘ TRÌNH -->
                    <button
                      class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 fw-semibold"
                      (click)="toggleRouteMap()"
                    >
                      <i
                        class="bi"
                        [ngClass]="
                          showRouteMap ? 'bi-eye-slash-fill' : 'bi-map-fill'
                        "
                      ></i>
                      <span>{{
                        showRouteMap
                          ? 'Ẩn Bản Đồ Lộ Trình'
                          : '🗺️ Xem Bản Đồ Lộ Trình Tuyến'
                      }}</span>
                    </button>
                  </div>

                  <!-- LỘ TRÌNH & CHỈ ĐẠO -->
                  <div class="row g-3 align-items-stretch">
                    <div class="col-md-7">
                      <div
                        class="route-endpoints-box p-3 rounded bg-light border h-100 d-flex flex-column justify-content-center"
                      >
                        <div class="d-flex align-items-center gap-2 mb-2">
                          <span class="point-badge-dot bg-success"></span>
                          <span class="fs-xs text-muted">Điểm xuất phát:</span>
                          <strong class="fs-xs text-dark">{{
                            currentSchedule.startPointName
                          }}</strong>
                        </div>
                        <div class="route-dash-connector ms-2 my-1"></div>
                        <div class="d-flex align-items-center gap-2">
                          <span class="point-badge-dot bg-danger"></span>
                          <span class="fs-xs text-muted">Điểm kết thúc:</span>
                          <strong class="fs-xs text-dark">{{
                            currentSchedule.endPointName
                          }}</strong>
                        </div>
                      </div>
                    </div>

                    <div class="col-md-5">
                      <div
                        class="instructions-alert p-3 rounded bg-warning-subtle border border-warning-subtle fs-xs h-100"
                      >
                        <div
                          class="d-flex align-items-center gap-1 text-warning-emphasis fw-bold mb-1"
                        >
                          <i class="bi bi-pin-angle-fill"></i>
                          <span>Nhiệm vụ trọng tâm ca trực:</span>
                        </div>
                        <p class="m-0 text-dark">
                          {{
                            currentSchedule.notes ||
                              'Tuần kiểm kỹ lưỡng toàn tuyến, đặc biệt chú ý vỉa hè sụt lún và hố ga mất nắp.'
                          }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- THÀNH VIÊN ĐI CÙNG TRONG CA -->
                  <div class="mt-3 pt-3 border-top">
                    <div
                      class="d-flex align-items-center justify-content-between mb-2"
                    >
                      <label class="form-label fw-bold fs-xs text-muted m-0">
                        <i class="bi bi-people-fill text-primary me-1"></i>
                        Tổ đội phụ trách:
                        <strong>{{ currentSchedule.teamName }}</strong> ({{
                          currentSchedule.assignedPersonnel.length
                        }}
                        người)
                      </label>
                    </div>
                    <div class="d-flex flex-wrap gap-2">
                      <div
                        class="member-badge-chip"
                        *ngFor="let p of currentSchedule.assignedPersonnel"
                        [class.is-current]="p.id === checkInForm.personnelId"
                      >
                        <i
                          class="bi bi-person-circle fs-5"
                          [ngClass]="
                            p.checkedIn ? 'text-success' : 'text-secondary'
                          "
                        ></i>
                        <div>
                          <div class="fw-bold fs-xs text-dark">
                            {{ p.name }}
                            {{
                              p.id === checkInForm.personnelId ? '(Bạn)' : ''
                            }}
                          </div>
                          <div class="text-muted fs-xxs">
                            <i class="bi bi-telephone"></i> {{ p.phone }}
                          </div>
                        </div>
                        <span
                          class="badge ms-1"
                          [ngClass]="
                            p.checkedIn
                              ? (p.isValidAttendance === false
                                  ? 'bg-danger-subtle text-danger border border-danger-subtle'
                                  : p.isValidAttendance
                                    ? 'bg-success-subtle text-success'
                                    : 'bg-info-subtle text-info-emphasis')
                              : 'bg-secondary-subtle text-secondary'
                          "
                        >
                          {{
                            p.checkedIn
                              ? (p.isValidAttendance === false
                                  ? 'K.Hợp Lệ'
                                  : p.isValidAttendance
                                    ? 'Đã duyệt'
                                    : 'Chờ duyệt')
                              : 'Chưa Check-in'
                          }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- BẢN ĐỒ LỘ TRÌNH MINI (CHỈ HIỂN THỊ KHI BẤM NÚT TOGGLE, KHÔNG RƯỜM RÀ TEXT) -->
                  <div
                    class="mini-route-map-panel mt-3 pt-3 border-top"
                    *ngIf="showRouteMap"
                  >
                    <div
                      class="d-flex justify-content-between align-items-center mb-2"
                    >
                      <span class="fs-xs fw-bold text-dark"
                        ><i class="bi bi-map text-primary me-1"></i>Bản đồ Lộ
                        trình ca tuần tra:
                        <strong>{{ currentSchedule.routeName }}</strong></span
                      >
                      <div class="d-flex gap-1">
                        <button
                          class="btn btn-xs btn-outline-primary"
                          type="button"
                          (click)="fitRouteMap()"
                        >
                          <i class="bi bi-arrows-fullscreen"></i> Toàn tuyến
                        </button>
                        <button
                          class="btn btn-xs btn-outline-success"
                          type="button"
                          (click)="centerOnMyPosition()"
                        >
                          <i class="bi bi-crosshair"></i> Vị trí tôi
                        </button>
                      </div>
                    </div>
                    <div
                      class="route-map-wrapper position-relative"
                      style="height: 280px; width: 100%; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1;"
                    >
                      <div
                        #patrolRouteMapContainer
                        id="patrolRouteMapElement"
                        style="height: 280px; width: 100%; background: #f8fafc;"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- CARD 2: BƯỚC 1: ĐIỂM DANH NHẬN CA (UC 8) - ĐỦ 4 TRẠNG THÁI RÕ RÀNG -->
                
                <!-- TRƯỜNG HỢP 1: CHƯA ĐIỂM DANH (NOT_CHECKED_IN) -->
                <div
                  class="shift-step-box step-checkin-pending p-3 rounded mb-3"
                  *ngIf="getAttendanceEvaluation(currentSchedule) === 'NOT_CHECKED_IN'"
                >
                  <div
                    class="d-flex justify-content-between align-items-center flex-wrap gap-2"
                  >
                    <div>
                      <div
                        class="fw-bold text-warning-emphasis d-flex align-items-center gap-1 fs-sm"
                      >
                        <i class="bi bi-geo-alt-fill text-warning fs-5"></i>
                        <span
                          >BƯỚC 1: ĐIỂM DANH NHẬN CA TẠI HIỆN TRƯỜNG (UC 8)</span
                        >
                      </div>
                      <div class="fs-xs text-muted mt-1">
                        Xác nhận bạn có mặt tại điểm xuất phát:
                        <strong>{{ currentSchedule.startPointName }}</strong>
                      </div>
                      <div class="fs-xxs text-dark font-monospace mt-1">
                        <i class="bi bi-broadcast text-success"></i> Trạm
                        check-in: {{ checkInForm.location }}
                      </div>
                    </div>

                    <button
                      class="btn btn-success fw-bold d-flex align-items-center gap-2 shadow-sm px-4 py-2 pulse-btn"
                      (click)="executeScheduleCheckIn(currentSchedule)"
                    >
                      <i class="bi bi-fingerprint fs-5"></i>
                      <span>ĐIỂM DANH CA NÀY (CHECK-IN)</span>
                    </button>
                  </div>
                </div>

                <!-- TRƯỜNG HỢP 2: ĐÃ ĐIỂM DANH & CÁN BỘ DUYỆT HỢP LỆ (VALID) -->
                <div
                  class="shift-step-box step-checkin-done p-3 rounded mb-3 border border-success bg-success bg-opacity-10"
                  *ngIf="getAttendanceEvaluation(currentSchedule) === 'VALID'"
                >
                  <div
                    class="d-flex justify-content-between align-items-center flex-wrap gap-2"
                  >
                    <div class="d-flex align-items-center gap-3">
                      <i class="bi bi-check-circle-fill text-success fs-3"></i>
                      <div>
                        <div class="fw-bold text-success fs-xs d-flex align-items-center gap-2">
                          <span>BẠN ĐÃ ĐIỂM DANH CA TRỰC NÀY THÀNH CÔNG</span>
                          <span class="badge bg-success">Hợp lệ</span>
                        </div>
                        <div class="fs-xxs text-muted mt-1">
                          Địa điểm: <strong>{{ getCheckInLocationForSchedule(currentSchedule) }}</strong> • 
                          Thời gian: <strong>{{ getCheckInTimeForSchedule(currentSchedule) }}</strong>
                        </div>
                      </div>
                    </div>
                    <div class="d-flex gap-2 align-items-center">
                      <span class="badge bg-success bg-opacity-25 text-success border border-success">
                        <i class="bi bi-geo-alt-fill me-1"></i>Đã xác thực GPS
                      </span>
                      <span class="badge bg-success text-white">
                        <i class="bi bi-shield-check me-1"></i>Cán bộ đã duyệt
                      </span>
                    </div>
                  </div>
                </div>

                <!-- TRƯỜNG HỢP 3: ĐIỂM DANH BỊ ĐÁNH GIÁ KHÔNG HỢP LỆ (INVALID - CẦN GIẢI TRÌNH) -->
                <div
                  class="shift-step-box p-3 rounded mb-3 border border-danger bg-danger bg-opacity-10"
                  *ngIf="getAttendanceEvaluation(currentSchedule) === 'INVALID'"
                >
                  <div class="d-flex align-items-start gap-3">
                    <div class="p-2 bg-danger bg-opacity-25 rounded-circle text-danger flex-shrink-0 mt-1">
                      <i class="bi bi-exclamation-triangle-fill fs-4"></i>
                    </div>
                    <div class="flex-grow-1">
                      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div class="fw-bold text-danger fs-sm">
                          ĐIỂM DANH BỊ ĐÁNH GIÁ KHÔNG HỢP LỆ (CẦN GIẢI TRÌNH)
                        </div>
                        <span class="badge bg-danger text-white px-2 py-1">
                          <i class="bi bi-x-circle me-1"></i>Chưa duyệt chấm công
                        </span>
                      </div>
                      
                      <div class="fs-xs text-secondary mt-1">
                        <i class="bi bi-clock me-1"></i>Thời gian: <strong>{{ getCheckInTimeForSchedule(currentSchedule) }}</strong> • 
                        <i class="bi bi-geo-alt me-1"></i>Vị trí: <strong>{{ getCheckInLocationForSchedule(currentSchedule) }}</strong>
                      </div>

                      <!-- Hộp chi tiết lý do Cán bộ đánh giá không hợp lệ -->
                      <div class="p-2 px-3 mt-2 rounded bg-white border border-danger border-opacity-25 fs-xs text-danger">
                        <div class="fw-bold mb-1">
                          <i class="bi bi-chat-left-dots-fill me-1"></i>Lý do từ Cán bộ quản lý:
                        </div>
                        <div>{{ getInvalidReasonForSchedule(currentSchedule) }}</div>
                      </div>

                      <!-- Thông điệp làm rõ quyền nghiệp vụ tuần tra & báo cáo sự cố vẫn bảo lưu -->
                      <div class="d-flex align-items-center gap-2 p-2 mt-2 rounded bg-white bg-opacity-75 border border-warning text-dark fs-xxs">
                        <i class="bi bi-info-circle-fill text-primary fs-6 flex-shrink-0"></i>
                        <span>
                          <strong>Lưu ý nghiệp vụ:</strong> Việc điểm danh chưa hợp lệ <u>không chặn</u> quyền tác nghiệp hiện trường. 
                          Bạn vẫn đi tuần và bấm nút <strong>"+ BÁO CÁO SỰ CỐ TRONG CA"</strong> ở Bước 3 bình thường để ghi nhận sự cố. 
                          Cán bộ sẽ xem xét đối soát lại kết quả điểm danh sau ca trực.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- TRƯỜNG HỢP 4: ĐÃ CHECK-IN • ĐANG CHỜ CÁN BỘ XÁC NHẬN (PENDING) -->
                <div
                  class="shift-step-box p-3 rounded mb-3 border border-info bg-info bg-opacity-10"
                  *ngIf="getAttendanceEvaluation(currentSchedule) === 'PENDING'"
                >
                  <div
                    class="d-flex justify-content-between align-items-center flex-wrap gap-2"
                  >
                    <div class="d-flex align-items-center gap-3">
                      <i class="bi bi-clock-history text-primary fs-3"></i>
                      <div>
                        <div class="fw-bold text-primary-emphasis fs-xs d-flex align-items-center gap-2">
                          <span>ĐÃ GHI NHẬN CHECK-IN • ĐANG CHỜ CÁN BỘ DUYỆT</span>
                          <span class="badge bg-info text-dark">Chờ thẩm tra</span>
                        </div>
                        <div class="fs-xxs text-muted mt-1">
                          Địa điểm: <strong>{{ getCheckInLocationForSchedule(currentSchedule) }}</strong> • 
                          Thời gian: <strong>{{ getCheckInTimeForSchedule(currentSchedule) }}</strong>
                        </div>
                      </div>
                    </div>
                    <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">
                      <i class="bi bi-hourglass-split me-1"></i>Đang chờ Cán bộ duyệt
                    </span>
                  </div>
                </div>

                <!-- CARD 3: BƯỚC 3: BÁO CÁO SỰ CỐ PHÁT HIỆN TRÊN TUYẾN (UC 7) -->
                <div
                  class="shift-issue-cta-box p-3 rounded border border-danger-subtle bg-danger-subtle mb-3"
                  *ngIf="currentSchedule.status !== 'COMPLETED'"
                >
                  <div
                    class="d-flex justify-content-between align-items-center flex-wrap gap-2"
                  >
                    <div>
                      <div
                        class="fw-bold text-danger d-flex align-items-center gap-1 fs-sm"
                      >
                        <i class="bi bi-camera-fill fs-5"></i>
                        <span>Bước 3: Phát Hiện Sự Cố Trên Tuyến Này?</span>
                      </div>
                      <div class="fs-xxs text-muted mt-1">
                        Bấm nút bên để báo cáo ngay. Hệ thống tự động gán mã ca
                        <strong>[{{ currentSchedule.id }}]</strong> và tuyến
                        <strong>{{ currentSchedule.routeName }}</strong
                        >.
                      </div>
                    </div>

                    <button
                      class="btn btn-danger fw-bold d-flex align-items-center gap-2 shadow-sm px-3 py-2"
                      (click)="openCreateIssueFromSchedule(currentSchedule)"
                    >
                      <i class="bi bi-plus-circle-fill fs-5"></i>
                      <span>+ BÁO CÁO SỰ CỐ TRONG CA</span>
                    </button>
                  </div>

                  <!-- DANH SÁCH SỰ CỐ ĐÃ GHI NHẬN TRONG CA -->
                  <div class="mt-3 pt-2 border-top border-danger-subtle">
                    <div
                      class="d-flex justify-content-between align-items-center mb-1"
                    >
                      <span class="fs-xxs fw-bold text-dark">
                        <i class="bi bi-journal-text text-danger"></i>
                        Sự cố đã phát hiện trong ca này:
                      </span>
                      <span
                        class="badge"
                        [ngClass]="
                          getIssuesCountForSchedule(currentSchedule.id) > 0
                            ? 'bg-danger'
                            : 'bg-secondary'
                        "
                      >
                        {{ getIssuesCountForSchedule(currentSchedule.id) }} vụ
                        việc
                      </span>
                    </div>

                    <div
                      class="d-flex flex-wrap gap-2 mt-2"
                      *ngIf="getIssuesCountForSchedule(currentSchedule.id) > 0"
                    >
                      <div
                        class="shift-issue-pill"
                        *ngFor="
                          let iss of getIssuesForSchedule(currentSchedule.id)
                        "
                        (click)="openEditRejectedIssueModal(iss)"
                        title="Bấm để xem/sửa sự cố"
                      >
                        <span class="badge bg-dark font-monospace">{{
                          iss.code
                        }}</span>
                        <span class="title text-truncate max-w-180">{{
                          iss.title
                        }}</span>
                        <span class="badge bg-light text-dark border fs-xxxs">{{
                          getStatusLabel(iss.status)
                        }}</span>
                      </div>
                    </div>

                    <div
                      class="fs-xxs text-muted italic mt-1"
                      *ngIf="
                        getIssuesCountForSchedule(currentSchedule.id) === 0
                      "
                    >
                      Chưa phát hiện hư hỏng nào trong ca này. Tuyến đường đang
                      đảm bảo an toàn.
                    </div>
                  </div>
                </div>

                <!-- CARD 4: BƯỚC 4: TỔNG KẾT KHI CA ĐÃ HOÀN THÀNH -->
                <div
                  class="shift-summary-box mb-3"
                  *ngIf="currentSchedule.status === 'COMPLETED'"
                >
                  <div
                    class="d-flex justify-content-between align-items-center mb-2"
                  >
                    <div class="d-flex align-items-center gap-2">
                      <i class="bi bi-check-circle-fill text-primary fs-4"></i>
                      <div>
                        <h5 class="m-0 fw-bold fs-xs text-primary">
                          TỔNG KẾT CA TUẦN KIỂM ĐÃ HOÀN THÀNH
                        </h5>
                        <div class="fs-xxs text-muted">
                          Nhật ký ca trực đã được đóng và lưu trữ trên hệ thống
                        </div>
                      </div>
                    </div>
                    <span class="badge bg-primary">Đã Nghiệm Thu Ca</span>
                  </div>

                  <div class="row g-2 fs-xxs border-top pt-2 mt-1">
                    <div class="col-6">
                      <span class="text-muted">Lộ trình:</span>
                      <strong>{{ currentSchedule.routeName }}</strong>
                    </div>
                    <div class="col-6">
                      <span class="text-muted">Quân số:</span>
                      <strong
                        >{{ currentSchedule.assignedPersonnel.length }} nhân
                        sự</strong
                      >
                    </div>
                    <div class="col-6">
                      <span class="text-muted">Sự cố phát hiện:</span>
                      <strong class="text-danger"
                        >{{ getIssuesCountForSchedule(currentSchedule.id) }} vụ
                        việc</strong
                      >
                    </div>
                    <div class="col-6">
                      <span class="text-muted">Tình trạng:</span>
                      <span class="badge bg-success-subtle text-success"
                        >Đã hoàn thành</span
                      >
                    </div>
                  </div>

                  <div
                    class="mt-2 pt-2 border-top"
                    *ngIf="getIssuesCountForSchedule(currentSchedule.id) > 0"
                  >
                    <span class="fs-xxs fw-bold text-dark d-block mb-1"
                      >Các sự cố được ghi nhận trong ca:</span
                    >
                    <div class="d-flex flex-wrap gap-1">
                      <span
                        class="badge bg-light text-dark border font-monospace"
                        *ngFor="
                          let iss of getIssuesForSchedule(currentSchedule.id)
                        "
                      >
                        {{ iss.code }}: {{ iss.title }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== TAB 2: NHIỆM VỤ KHẮC PHỤC ĐƯỢC GIAO (UC 10) ==================== -->
        <div *ngIf="activeTab === 'TASKS'" class="tasks-portal-panel">
          <div class="panel-toolbar">
            <div class="d-flex align-items-center gap-2">
              <span class="fw-bold fs-6"
                ><i class="bi bi-list-task text-primary"></i> Danh Sách Sự Cố
                Phân Công Cho Thợ (UC 10):</span
              >
              <select
                class="form-select form-select-sm status-filter"
                [(ngModel)]="taskStatusFilter"
              >
                <option value="ALL">
                  Tất cả nhiệm vụ ({{ myAssignedTasks.length }})
                </option>
                <option value="QUICK_FIXING">
                  Đang xử lý ({{ countTasksByStatus('QUICK_FIXING') }})
                </option>
                <option value="NEW">
                  Mới giao / Chờ tiếp nhận ({{ countTasksByStatus('NEW') }})
                </option>
                <option value="RESOLVED">
                  Đã hoàn thành / Nghiệm thu ({{
                    countTasksByStatus('RESOLVED')
                  }})
                </option>
              </select>
            </div>

            <div class="d-flex gap-2">
              <button
                class="btn btn-sm btn-outline-secondary"
                (click)="exportMyTasksExcel()"
              >
                <i class="bi bi-file-earmark-excel-fill text-success"></i> Xuất
                Excel Nhiệm Vụ (UC 10)
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
                  <span
                    class="priority-pill"
                    [ngClass]="'priority-' + task.priority.toLowerCase()"
                  >
                    {{ task.priority }}
                  </span>
                </div>
                <span
                  class="status-badge"
                  [ngClass]="'status-' + task.status.toLowerCase()"
                >
                  {{
                    task.status === 'NEW'
                      ? 'Chờ thợ tiếp nhận'
                      : task.status === 'QUICK_FIXING'
                        ? 'Đang sửa chữa'
                        : 'Đã sửa xong'
                  }}
                </span>
              </div>

              <div class="task-card-body">
                <div class="task-img-wrapper">
                  <img
                    [src]="task.photoBeforeUrl"
                    alt="Hiện trường"
                    class="task-photo"
                  />
                  <span class="img-label">ẢNH SỰ CỐ</span>
                </div>

                <div class="task-info-content">
                  <h3 class="task-title">{{ task.title }}</h3>

                  <div class="task-meta-row">
                    <i class="bi bi-geo-alt-fill text-danger"></i>
                    <span
                      ><strong>{{ task.address }}</strong> ({{
                        task.routeName
                      }})</span
                    >
                  </div>

                  <div class="task-meta-row" *ngIf="task.assetCode">
                    <i class="bi bi-pin-angle-fill text-primary"></i>
                    <span
                      >Tài sản: <strong>[{{ task.assetCode }}]</strong>
                      {{ task.assetName }}</span
                    >
                  </div>

                  <div
                    class="task-instruction-box mt-2"
                    *ngIf="task.quickFixDetails"
                  >
                    <div class="instruction-header">
                      <i class="bi bi-info-circle-fill text-primary"></i>
                      <strong>Chỉ đạo kỹ thuật từ Cán bộ:</strong>
                    </div>
                    <p class="instruction-note m-0">
                      {{
                        task.quickFixDetails.resolutionNote ||
                          'Yêu cầu khắc phục an toàn'
                      }}
                    </p>
                    <div
                      class="d-flex justify-content-between mt-1 fs-xs text-muted"
                    >
                      <span
                        >Hạn chót:
                        <strong class="text-danger">{{
                          task.quickFixDetails.deadline
                        }}</strong></span
                      >
                      <span
                        >Dự toán:
                        <strong class="text-primary"
                          >{{
                            task.quickFixDetails.estimatedCost | number
                          }}
                          VNĐ</strong
                        ></span
                      >
                    </div>
                  </div>

                  <!-- Thợ đã sửa xong nếu có ảnh sau -->
                  <div
                    class="resolved-note-box mt-2"
                    *ngIf="task.photoAfterUrl"
                  >
                    <div
                      class="d-flex align-items-center gap-2 text-success fw-bold fs-xs"
                    >
                      <i class="bi bi-check-circle-fill"></i>
                      <span
                        >Đã nộp ảnh sau khi sửa xong & biên bản hoàn thành</span
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Bar của Thợ (UC 10) -->
              <div class="task-card-footer">
                <div class="assigned-worker-tag fs-xs text-muted">
                  <i class="bi bi-person-fill"></i> Thợ phụ trách:
                  <strong>{{
                    task.quickFixDetails?.assignedWorker || 'Nguyễn Văn Hải'
                  }}</strong>
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
                    <i class="bi bi-camera-fill"></i> Báo Cáo Hoàn Thành (Nộp
                    Ảnh)
                  </button>

                  <span
                    class="badge bg-success py-2 px-3 fs-xs"
                    *ngIf="task.status === 'RESOLVED'"
                  >
                    <i class="bi bi-check-lg"></i> Hoàn Thành Nghiệm Thu
                  </span>
                </div>
              </div>
            </div>

            <div
              *ngIf="filteredTasks.length === 0"
              class="empty-state text-center p-5 text-muted"
            >
              <i class="bi bi-check2-circle fs-1 text-success"></i>
              <h4 class="mt-2">Không có sự cố nào trong bộ lọc này!</h4>
              <p class="fs-xs">
                Tất cả nhiệm vụ được giao đã hoàn tất hoặc chưa có nhiệm vụ mới.
              </p>
            </div>
          </div>
        </div>

        <!-- ==================== TAB 2: SỔ SỰ CỐ TUẦN KIỂM CỦA TÔI & GHI NHẬN MỚI (UC 7) ==================== -->
        <div *ngIf="activeTab === 'MY_ISSUES'" class="my-issues-portal-panel">
          <!-- TOP TOOLBAR & KPI SUMMARY -->
          <div class="portal-box-card mb-3">
            <div
              class="card-title-bar bg-light d-flex justify-content-between align-items-center flex-wrap gap-2"
            >
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-journal-text fs-5 text-primary"></i>
                <div>
                  <h4 class="m-0 fw-bold fs-6">
                    Sổ Theo Dõi Sự Cố Tuần Kiểm Của Tôi (Hiện Trường - UC 7)
                  </h4>
                  <p class="m-0 fs-xxs text-muted">
                    Quản lý danh sách sự cố do bạn phát hiện. Theo dõi phê
                    duyệt, nhận phản hồi từ chối và cập nhật gửi lại thẩm tra.
                  </p>
                </div>
              </div>

              <!-- NÚT GHI NHẬN SỰ CỐ MỚI TO NỔI BẬT -->
              <button
                class="btn btn-primary d-flex align-items-center gap-2 fw-bold shadow-sm"
                (click)="openCreateIssueModal()"
              >
                <i class="bi bi-plus-circle-fill fs-5"></i>
                <span>GHI NHẬN SỰ CỐ MỚI TẠI HIỆN TRƯỜNG</span>
              </button>
            </div>

            <!-- KPI CHIPS BAR (LƯỚI 4 CỘT CHUẨN KHÔNG BỊ VỠ GIAO DIỆN) -->
            <div class="kpi-chips-container border-bottom bg-white p-3">
              <div class="kpi-mini-grid">
                <div class="kpi-mini-card bg-light">
                  <span class="label">Tổng sự cố đã ghi nhận</span>
                  <strong class="val text-dark"
                    >{{ myReportedIssues.length }} vụ</strong
                  >
                </div>
                <div class="kpi-mini-card bg-primary-subtle">
                  <span class="label">Mới gửi (Chờ duyệt)</span>
                  <strong class="val text-primary"
                    >{{ countMyIssuesByStatus('NEW') }} vụ</strong
                  >
                </div>
                <div class="kpi-mini-card bg-danger-subtle border-danger">
                  <span class="label text-danger"
                    >🔴 Bị từ chối (Cần sửa lại)</span
                  >
                  <strong class="val text-danger"
                    >{{ countMyIssuesByStatus('REJECTED') }} vụ</strong
                  >
                </div>
                <div class="kpi-mini-card bg-success-subtle">
                  <span class="label">Đang xử lý / Hoàn thành</span>
                  <strong class="val text-success"
                    >{{
                      countMyIssuesByStatus('QUICK_FIXING') +
                        countMyIssuesByStatus('RESOLVED') +
                        countMyIssuesByStatus('MOVED_TO_PROJECT')
                    }}
                    vụ</strong
                  >
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
                <select
                  class="form-select form-select-sm w-auto"
                  [(ngModel)]="myIssuesStatusFilter"
                >
                  <option value="ALL">
                    Tất cả ({{ myReportedIssues.length }})
                  </option>
                  <option value="REJECTED">
                    🔴 Bị từ chối tiếp nhận ({{
                      countMyIssuesByStatus('REJECTED')
                    }})
                  </option>
                  <option value="NEW">
                    Mới gửi (Chờ duyệt) ({{ countMyIssuesByStatus('NEW') }})
                  </option>
                  <option value="QUICK_FIXING">
                    Đang khắc phục ({{ countMyIssuesByStatus('QUICK_FIXING') }})
                  </option>
                  <option value="RESOLVED">
                    Đã hoàn thành / Nghiệm thu ({{
                      countMyIssuesByStatus('RESOLVED')
                    }})
                  </option>
                  <option value="MOVED_TO_PROJECT">
                    Đã chuyển Dự Án ({{
                      countMyIssuesByStatus('MOVED_TO_PROJECT')
                    }})
                  </option>
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
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <span class="issue-code font-monospace fw-bold">{{
                    iss.code
                  }}</span>
                  <span
                    class="priority-pill"
                    [ngClass]="'priority-' + iss.priority.toLowerCase()"
                    >{{ iss.priority }}</span
                  >
                  <span
                    class="layer-pill"
                    [style.background-color]="getLayerColor(iss.layerId) + '20'"
                    [style.color]="getLayerColor(iss.layerId)"
                  >
                    {{ iss.categoryName }}
                  </span>
                  <span
                    class="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace fs-xxs"
                    *ngIf="iss.scheduleId"
                    title="Sự cố phát hiện trong ca tuần tra {{
                      iss.scheduleId
                    }}"
                  >
                    <i class="bi bi-calendar2-check"></i> Ca:
                    {{ iss.scheduleId }}
                  </span>
                </div>

                <span
                  class="status-badge"
                  [ngClass]="'status-' + iss.status.toLowerCase()"
                >
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
                    <span
                      ><strong>{{ iss.address }}</strong> ({{
                        iss.routeName
                      }})</span
                    >
                  </div>

                  <!-- Danh sách nhiều tài sản cùng loại (Nguyên tắc 2) -->
                  <div
                    class="attached-assets-chips mt-2"
                    *ngIf="iss.attachedAssets && iss.attachedAssets.length > 0"
                  >
                    <span class="chip-title fs-xxs text-muted d-block mb-1">
                      <i class="bi bi-diagram-3-fill text-primary"></i> Đính kèm
                      {{ iss.attachedAssets.length }} tài sản cùng loại (Nguyên
                      tắc 2):
                    </span>
                    <div class="d-flex flex-wrap gap-1">
                      <span
                        class="badge bg-light text-dark border"
                        *ngFor="let a of iss.attachedAssets"
                      >
                        [{{ a.assetCode }}] {{ a.assetName }}
                      </span>
                    </div>
                  </div>

                  <div
                    class="single-asset-line mt-1 fs-xs text-muted"
                    *ngIf="
                      (!iss.attachedAssets ||
                        iss.attachedAssets.length === 0) &&
                      iss.assetCode
                    "
                  >
                    <i class="bi bi-pin-angle-fill text-primary"></i>
                    <span
                      >Tài sản: <strong>[{{ iss.assetCode }}]</strong>
                      {{ iss.assetName }}</span
                    >
                  </div>

                  <p class="issue-desc text-muted fs-xs mt-2 m-0">
                    {{ iss.description }}
                  </p>

                  <!-- ==================== KHUNG CẢNH BÁO BỊ TỪ CHỐI TIẾP NHẬN ==================== -->
                  <div
                    class="rejected-alert-card mt-3"
                    *ngIf="iss.status === 'REJECTED'"
                  >
                    <div class="d-flex align-items-start gap-2">
                      <i
                        class="bi bi-exclamation-octagon-fill text-danger fs-4 mt-0 flex-shrink-0"
                      ></i>
                      <div class="flex-grow-1">
                        <div
                          class="d-flex justify-content-between align-items-center flex-wrap"
                        >
                          <strong class="text-danger fs-xs"
                            >CÁN BỘ QUẢN LÝ TỪ CHỐI TIẾP NHẬN:</strong
                          >
                          <span class="fs-xxs text-muted"
                            >{{ iss.rejectedAt }} • {{ iss.rejectedBy }}</span
                          >
                        </div>
                        <div class="reject-reason-box mt-1">
                          "{{ iss.rejectReason }}"
                        </div>
                        <div
                          class="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2"
                        >
                          <span class="fs-xxs text-muted">
                            <i class="bi bi-info-circle"></i> Sự cố chưa đóng.
                            Vui lòng bấm nút bên để sửa và gửi lại thẩm tra.
                          </span>
                          <button
                            class="btn btn-sm btn-danger fw-bold d-flex align-items-center gap-1 shadow-sm"
                            (click)="openEditRejectedIssueModal(iss)"
                          >
                            <i class="bi bi-pencil-square"></i>
                            <span>CẬP NHẬT & GỬI LẠI THẨM TRA</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- ==================== KHUNG THÔNG BÁO VỪA GỬI LẠI ĐANG CHỜ DUYỆT ==================== -->
                  <div
                    class="resubmitted-alert-card mt-2 p-2 rounded"
                    *ngIf="iss.resubmittedAt && iss.status === 'NEW'"
                  >
                    <div class="d-flex align-items-center gap-2">
                      <i class="bi bi-arrow-repeat text-warning fs-5"></i>
                      <div class="fs-xs">
                        <strong>Bạn đã cập nhật & gửi lại:</strong>
                        <span class="text-muted ms-1"
                          >({{ iss.resubmittedAt }})</span
                        >
                        <div class="text-dark fs-xxs" *ngIf="iss.resubmitNotes">
                          <strong>Giải trình:</strong> {{ iss.resubmitNotes }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              *ngIf="filteredMyIssues.length === 0"
              class="empty-state text-center p-5 text-muted bg-white rounded border"
            >
              <i class="bi bi-inbox fs-1 text-muted"></i>
              <h5 class="mt-2">Không tìm thấy sự cố nào trong bộ lọc!</h5>
              <p class="fs-xs">
                Bấm nút "Ghi Nhận Sự Cố Mới Tại Hiện Trường" bên trên để tạo báo
                cáo đầu tiên.
              </p>
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
            <h5 class="modal-title">
              <i class="bi bi-camera-fill"></i> Báo Cáo Hoàn Thành Sự Cố (UC 10)
            </h5>
            <button
              class="btn-close btn-close-white"
              (click)="showCompletionModal = false"
            ></button>
          </div>
          <div class="modal-body">
            <div class="p-2 bg-light rounded fs-xs mb-3">
              <strong>[{{ completingTask?.code }}]</strong>
              {{ completingTask?.title }}
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold"
                >Ảnh chụp nghiệm thu sau khi sửa xong (*):</label
              >
              <input
                type="text"
                class="form-control form-control-sm"
                [(ngModel)]="completionForm.afterPhotoUrl"
              />
              <div
                class="mt-2 preview-box"
                *ngIf="completionForm.afterPhotoUrl"
              >
                <img
                  [src]="completionForm.afterPhotoUrl"
                  alt="Sau khi sửa"
                  style="height: 120px; width: 100%; object-fit: cover; border-radius: 6px;"
                />
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold"
                >Hiện trạng tài sản sau khắc phục (*):</label
              >
              <select
                class="form-select form-select-sm"
                [(ngModel)]="completionForm.finalCondition"
              >
                <option value="GOOD">🟢 Hoạt động tốt (Đạt yêu cầu)</option>
                <option value="NORMAL">🔵 Bình thường (Khắc phục tạm)</option>
                <option value="DAMAGED">🔴 Còn lỗi / Hư hỏng</option>
                <option value="NEEDS_REPLACEMENT">
                  🟠 Cần thay thế toàn bộ
                </option>
              </select>
              <div class="text-muted fs-xxs mt-1">
                Lưu vết hiện trạng kỹ thuật theo lần xử lý này • Không làm biến
                động hồ sơ tài sản gốc
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold"
                >Biên bản / Báo cáo kỹ thuật sửa chữa:</label
              >
              <textarea
                class="form-control form-control-sm"
                rows="3"
                [(ngModel)]="completionForm.note"
                placeholder="Mô tả các công việc đã thực hiện, vật tư thay thế..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-secondary btn-sm"
              (click)="showCompletionModal = false"
            >
              Hủy
            </button>
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
        <div
          class="custom-header-bar"
          [ngClass]="isEditingIssue ? 'header-rejected' : 'header-create'"
        >
          <div class="d-flex align-items-center gap-2">
            <i
              class="bi fs-5"
              [ngClass]="
                isEditingIssue ? 'bi-arrow-clockwise' : 'bi-camera-fill'
              "
            ></i>
            <div>
              <h5 class="modal-title m-0 fw-bold">
                {{
                  isEditingIssue
                    ? 'Cập Nhật & Gửi Lại Sự Cố [' +
                      editingIssue?.code +
                      '] (Sau Khi Bị Từ Chối)'
                    : 'Ghi Nhận Sự Cố Hạ Tầng Tại Hiện Trường (Chuẩn 3 Nguyên Tắc GIS)'
                }}
              </h5>
              <p class="m-0 fs-xxs opacity-75">
                {{
                  isEditingIssue
                    ? 'Sửa lại ảnh, vị trí hoặc bổ sung tài sản GIS để Quản lý thẩm tra lại'
                    : '1 báo cáo - 1 loại vấn đề - chọn nhiều tài sản cùng loại gắn vào sự cố'
                }}
              </p>
            </div>
          </div>
          <button
            class="btn-close btn-close-white"
            (click)="closeIssueModal()"
          ></button>
        </div>

        <!-- Banner 3 Nguyên Tắc Cốt Lõi -->
        <div class="principles-banner p-2 px-3 bg-light border-bottom">
          <div class="d-flex align-items-center gap-2 fs-xs flex-wrap">
            <span class="badge bg-dark">3 NGUYÊN TẮC NGHIỆP VỤ:</span>
            <span><strong>1:</strong> 1 báo cáo = 1 Layer.</span>
            <span class="text-muted">•</span>
            <span
              ><strong>2:</strong> Được chọn nhiều tài sản cùng loại (vd: các vị
              trí lún liên tiếp).</span
            >
            <span class="text-muted">•</span>
            <span
              ><strong>3:</strong> Người đi tuần tự đánh giá hiện trường, phần
              mềm quản lý dữ liệu.</span
            >
          </div>
        </div>

        <!-- Banner liên kết ca trực nếu sự cố được tạo từ ca tuần tra -->
        <div
          class="p-2 px-3 bg-primary-subtle border-bottom border-primary-subtle d-flex align-items-center justify-content-between flex-wrap gap-2"
          *ngIf="issueModalForm.scheduleId"
        >
          <div
            class="d-flex align-items-center gap-2 fs-xs text-primary-emphasis"
          >
            <i class="bi bi-calendar2-check-fill fs-5 text-primary"></i>
            <span>
              Đang gắn sự cố vào ca tuần tra:
              <strong class="font-monospace"
                >[{{ issueModalForm.scheduleId }}]</strong
              >
              • Tuyến: <strong>{{ issueModalForm.routeName }}</strong>
            </span>
          </div>
          <span class="badge bg-primary">LIÊN KẾT CA TUẦN KIỂM</span>
        </div>

        <!-- Modal Body Split Layout -->
        <div class="custom-modal-body p-3">
          <!-- Nếu đang sửa sự cố bị từ chối, hiển thị lý do từ chối -->
          <div
            class="alert alert-danger p-2 fs-xs mb-3 d-flex align-items-center gap-2"
            *ngIf="isEditingIssue"
          >
            <i
              class="bi bi-exclamation-octagon-fill fs-5 text-danger flex-shrink-0"
            ></i>
            <div>
              <strong>Lý do Quản lý từ chối trước đó:</strong>
              <span class="ms-1">{{ editingIssue?.rejectReason }}</span>
              <div class="text-muted fs-xxs mt-0">
                Từ chối bởi {{ editingIssue?.rejectedBy }} lúc
                {{ editingIssue?.rejectedAt }}
              </div>
            </div>
          </div>

          <div class="modal-split-layout">
            <!-- CỘT TRÁI (50%): FORM NHẬP LIỆU CÓ SPACING VÀ SECTION RÕ RÀNG -->
            <div class="modal-form-col">
              <!-- KHỐI 1: CHỌN LỚP HẠ TẦNG GIS & LOẠI VẤN ĐỀ (BƯỚC 1 & 2) -->
              <div class="modal-form-section mb-3">
                <div class="section-title-tag">
                  <i class="bi bi-diagram-3-fill text-primary"></i>
                  <span
                    >BƯỚC 1 & 2: PHÂN LOẠI HẠ TẦNG GIS & LOẠI VẤN ĐỀ SỰ CỐ</span
                  >
                </div>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label
                      class="form-label fw-bold fs-xs d-flex justify-content-between align-items-center mb-1"
                    >
                      <span>1. Lớp Dữ Liệu Hạ Tầng GIS (*):</span>
                      <span
                        class="badge bg-secondary-subtle text-secondary font-normal fs-xxs"
                        >1 Báo cáo = 1 Layer</span
                      >
                    </label>
                    <select
                      class="form-select form-select-sm fw-semibold"
                      [ngModel]="issueModalForm.layerId"
                      (ngModelChange)="onSelectLayer($event)"
                    >
                      <option value="ROADWAY">
                        🛣️ Mặt đường & Biển báo (Lớp ROADWAY)
                      </option>
                      <option value="LIGHTING">
                        💡 Chiếu sáng đô thị (Lớp LIGHTING)
                      </option>
                      <option value="GREENERY">
                        🌳 Cây xanh & Công viên (Lớp GREENERY)
                      </option>
                      <option value="DRAINAGE">
                        🚰 Thoát nước & Hố ga (Lớp DRAINAGE)
                      </option>
                    </select>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label fw-bold fs-xs mb-1"
                      >2. Loại Vấn Đề Hạ Tầng (* Lọc theo Lớp):</label
                    >
                    <select
                      class="form-select form-select-sm"
                      [(ngModel)]="issueModalForm.categoryId"
                    >
                      <option
                        *ngFor="let cat of availableCategories"
                        [value]="cat.id"
                      >
                        [{{ cat.code }}] {{ cat.name }} (Ưu tiên:
                        {{ cat.defaultPriority }})
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- KHỐI 2: CHỌN NHIỀU TÀI SẢN CÙNG LOẠI (NGUYÊN TẮC 2) -->
              <div class="modal-form-section mb-3">
                <div
                  class="d-flex justify-content-between align-items-center mb-1"
                >
                  <div class="section-title-tag m-0">
                    <i class="bi bi-geo-alt-fill text-primary"></i>
                    <span
                      >3. CHỌN TÀI SẢN GIS CÙNG LOẠI GẮN VÀO BÁO CÁO (*)</span
                    >
                  </div>
                  <span
                    class="badge"
                    [ngClass]="
                      issueModalForm.selectedAssetIds.length > 0
                        ? 'bg-success'
                        : 'bg-secondary'
                    "
                  >
                    Đã chọn {{ issueModalForm.selectedAssetIds.length }} tài sản
                  </span>
                </div>
                <p class="fs-xxs text-muted m-0 mb-2">
                  Nguyên tắc 2: Nếu có nhiều điểm hư hỏng cùng loại liên tiếp
                  (vd: 3 vị trí lún trên đoạn đường), tick chọn cả 3 tài sản vào
                  1 báo cáo.
                </p>

                <!-- Search & List assets -->
                <div class="assets-picker-box">
                  <div class="input-group input-group-sm mb-2">
                    <span class="input-group-text bg-white"
                      ><i class="bi bi-search"></i
                    ></span>
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Tìm mã hoặc tên tài sản trong lớp..."
                      [(ngModel)]="assetSearchKeyword"
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      *ngIf="assetSearchKeyword"
                      (click)="assetSearchKeyword = ''"
                    >
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
                          <strong class="font-monospace text-primary fs-xs">{{
                            ast.code
                          }}</strong>
                          <span class="badge bg-light text-muted fs-xxs">{{
                            ast.chainage || 'Đô thị'
                          }}</span>
                        </div>
                        <div class="text-truncate fw-semibold text-dark fs-xs">
                          {{ ast.name }}
                        </div>
                        <div class="text-truncate text-muted fs-xxs">
                          <i class="bi bi-geo-alt"></i> {{ ast.address }}
                        </div>
                      </div>
                    </div>

                    <div
                      *ngIf="filteredAvailableAssets.length === 0"
                      class="p-3 text-center text-muted fs-xs"
                    >
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
                  <label class="form-label fw-bold fs-xs mb-1"
                    >Tiêu Đề Sự Cố Phát Hiện (*):</label
                  >
                  <input
                    type="text"
                    class="form-control form-control-sm"
                    [(ngModel)]="issueModalForm.title"
                    placeholder="VD: Mặt đường sụt lún ổ gà 3 điểm liên tiếp..."
                  />
                </div>

                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label fs-xs mb-1 fw-semibold"
                      >Tọa độ GPS hiện trường:</label
                    >
                    <div class="input-group input-group-sm">
                      <input
                        type="text"
                        class="form-control font-monospace"
                        [value]="
                          issueModalForm.lat.toFixed(5) +
                          ', ' +
                          issueModalForm.lng.toFixed(5)
                        "
                        readonly
                      />
                      <button
                        class="btn btn-outline-secondary"
                        type="button"
                        (click)="refreshGPSInModal()"
                        title="Cập nhật GPS"
                      >
                        <i class="bi bi-arrow-clockwise"></i>
                      </button>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fs-xs mb-1 fw-semibold"
                      >Tuyến đường:</label
                    >
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      [(ngModel)]="issueModalForm.routeName"
                    />
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label fs-xs mb-1 fw-semibold"
                    >Địa chỉ số nhà cụ thể:</label
                  >
                  <input
                    type="text"
                    class="form-control form-control-sm"
                    [(ngModel)]="issueModalForm.address"
                  />
                </div>

                <!-- ẢNH HIỆN TRƯỜNG -->
                <div class="mb-3">
                  <label class="form-label fw-bold fs-xs mb-1"
                    >Ảnh Chụp Hiện Trường (*):</label
                  >
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
                  <div
                    class="current-photo-view"
                    *ngIf="issueModalForm.photoUrl"
                  >
                    <img
                      [src]="issueModalForm.photoUrl"
                      alt="Ảnh hiện trường"
                    />
                    <span class="tag-attached"
                      ><i class="bi bi-check2"></i> Đã đính kèm ảnh</span
                    >
                  </div>
                </div>

                <!-- MÔ TẢ HIỆN TRẠNG -->
                <div class="mb-2">
                  <label class="form-label fs-xs mb-1 fw-semibold"
                    >Mô tả hiện trạng chi tiết:</label
                  >
                  <textarea
                    class="form-control form-control-sm"
                    rows="3"
                    [(ngModel)]="issueModalForm.description"
                    placeholder="Mô tả mức độ hư hại, kích thước (rộng x sâu)..."
                  ></textarea>
                </div>

                <!-- NẾU RESUBMIT: GIẢI TRÌNH CẬP NHẬT -->
                <div
                  class="mt-3 p-3 bg-danger-subtle border border-danger-subtle rounded-3"
                  *ngIf="isEditingIssue"
                >
                  <label
                    class="form-label fw-bold fs-xs text-danger mb-1 d-flex align-items-center gap-1"
                  >
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    <span
                      >Nội Dung Giải Trình & Bổ Sung Gửi Lại Cho Quản Lý
                      (*):</span
                    >
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
                  <strong class="fs-xs"
                    >Bản Đồ Số GIS: Lớp
                    {{ getLayerName(issueModalForm.layerId) }}</strong
                  >
                </div>
                <div class="d-flex align-items-center gap-1">
                  <button
                    class="btn btn-xs btn-outline-primary"
                    type="button"
                    (click)="fitMapToSelected()"
                  >
                    <i class="bi bi-arrows-angle-expand"></i> Bao quát
                  </button>
                  <button
                    class="btn btn-xs btn-outline-success"
                    type="button"
                    (click)="centerMapOnUser()"
                  >
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
                  Bản đồ hiển thị các tài sản thuộc
                  <strong>Lớp {{ getLayerName(issueModalForm.layerId) }}</strong
                  >. Bấm trực tiếp vào điểm tài sản trên bản đồ để chọn/bỏ chọn.
                  Điểm số (1, 2, 3...) và đường nối thể hiện các tài sản được
                  gắn chung vào sự cố này.
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="custom-modal-footer">
          <button class="btn btn-secondary btn-sm" (click)="closeIssueModal()">
            Hủy bỏ
          </button>
          <button
            class="btn btn-sm fw-bold"
            [ngClass]="isEditingIssue ? 'btn-danger' : 'btn-primary'"
            [disabled]="
              !issueModalForm.title.trim() ||
              issueModalForm.selectedAssetIds.length === 0
            "
            (click)="submitIssueModal()"
          >
            <i
              class="bi"
              [ngClass]="isEditingIssue ? 'bi-send-check' : 'bi-send-fill'"
            ></i>
            <span>
              {{
                isEditingIssue
                  ? 'GỬI LẠI CHO QUẢN LÝ THẨM TRA'
                  : 'GỬI BÁO CÁO VỀ ADMIN (' +
                    issueModalForm.selectedAssetIds.length +
                    ' TÀI SẢN)'
              }}
            </span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
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
        0% {
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
        }
      }

      .role-welcome-banner {
        margin-top: 12px;
        padding: 10px 14px;
        border-radius: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        &.banner-worker {
          background: #fffbeb;
          border: 1px solid #fde68a;
        }
        &.banner-patrol {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
        }
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

          &:hover {
            color: var(--gray-900);
          }

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

          .label {
            color: var(--gray-500);
          }
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
        box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);
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

          .status-filter {
            width: 220px;
          }
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

        &.resolved {
          border-left: 5px solid #10b981;
        }

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

            .task-photo {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .img-label {
              position: absolute;
              bottom: 4px;
              left: 4px;
              background: rgba(0, 0, 0, 0.7);
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

              .instruction-header {
                font-size: 11.5px;
              }
              .instruction-note {
                font-size: 12.5px;
                color: var(--gray-800);
              }
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

        img {
          width: 100%;
          height: 55px;
          object-fit: cover;
        }
        span {
          font-size: 10px;
          display: block;
          padding: 2px;
        }
        &.active {
          border-color: var(--primary-600);
        }
      }

      .current-photo-view {
        position: relative;
        border-radius: 6px;
        overflow: hidden;
        height: 120px;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .tag-attached {
          position: absolute;
          bottom: 6px;
          right: 6px;
          background: rgba(16, 185, 129, 0.85);
          color: white;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 700;
        }
      }

      .max-w-800 {
        max-width: 800px;
      }
      .max-w-180 {
        max-width: 180px;
      }

      /* BADGES */
      .priority-pill {
        font-size: 10.5px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        &.priority-urgent {
          background: #fee2e2;
          color: #dc2626;
        }
        &.priority-high {
          background: #ffedd5;
          color: #ea580c;
        }
        &.priority-medium {
          background: #fef3c7;
          color: #d97706;
        }
        &.priority-low {
          background: #f1f5f9;
          color: #475569;
        }
      }

      .status-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 12px;
        &.status-new {
          background: #eff6ff;
          color: #1d4ed8;
        }
        &.status-quick_fixing {
          background: #fef3c7;
          color: #b45309;
        }
        &.status-resolved {
          background: #ecfdf5;
          color: #047857;
        }
        &.status-moved_to_project {
          background: #f3e8ff;
          color: #7e22ce;
        }
        &.status-rejected {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fca5a5;
          font-weight: 700;
        }
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

      .fs-xs {
        font-size: 11.5px;
      }
      .fs-xxs {
        font-size: 10px;
      }
      .max-w-400 {
        max-width: 400px;
      }

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
        background: rgba(0, 0, 0, 0.65);
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
        background: rgba(16, 185, 129, 0.9);
        color: white;
        font-size: 11px;
        padding: 3px 10px;
        border-radius: 4px;
        font-weight: 700;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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

      /* ==================== TAB 1: MY SCHEDULE & ROUTE STYLES ==================== */
      .schedule-portal-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .active-shift-hero-card {
        background: white;
        border: 1px solid var(--gray-200);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      }

      .shift-hero-header {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        padding: 12px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        border-bottom: 2px solid #3b82f6;
      }

      .shift-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 11.5px;
        font-weight: 700;
        letter-spacing: 0.3px;
        text-transform: uppercase;

        &.status-planned {
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fde68a;
        }
        &.status-in_progress {
          background: #10b981;
          color: white;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.35);
          animation: pulseGreen 2s infinite;
        }
        &.status-completed {
          background: #e2e8f0;
          color: #475569;
          border: 1px solid #cbd5e1;
        }
      }

      .shift-hero-body {
        background: white;
      }

      .route-endpoints-box {
        background: #f8fafc;
        border: 1px solid var(--gray-200);
        border-radius: 8px;

        .point-badge-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }

        .route-dash-connector {
          width: 2px;
          height: 14px;
          border-left: 2px dashed #94a3b8;
          margin-left: 4px;
        }
      }

      .member-badge-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        background: #f8fafc;
        border: 1px solid var(--gray-200);
        border-radius: 8px;
        transition: all 0.15s ease;

        &.is-current {
          background: #eff6ff;
          border-color: #93c5fd;
          box-shadow: 0 1px 3px rgba(59, 130, 246, 0.15);
        }
      }

      .instructions-alert {
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 8px;
      }

      .shift-issue-cta-box {
        background: #fff5f5;
        border: 1px dashed #fca5a5;
        border-radius: 10px;
      }

      .shift-issue-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        background: white;
        border: 1px solid var(--gray-300);
        border-radius: 6px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          border-color: #ef4444;
          background: #fef2f2;
          transform: translateY(-1px);
        }

        .title {
          color: var(--gray-800);
          font-weight: 500;
        }
      }

      .route-map-panel {
        border: 1px solid var(--gray-200);
        border-radius: 10px;
        overflow: hidden;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      .route-map-top-bar {
        padding: 10px 16px;
        background: #f8fafc;
        border-bottom: 1px solid var(--gray-200);
      }

      .route-map-wrapper {
        position: relative;
        width: 100%;
        height: 480px;
        min-height: 480px;
        background: #f1f5f9;
      }

      #patrolRouteMapElement {
        width: 100% !important;
        height: 480px !important;
        min-height: 480px !important;
        z-index: 1;
      }

      .map-live-overlay-chip {
        position: absolute;
        bottom: 12px;
        left: 12px;
        z-index: 1000;
        background: rgba(255, 255, 255, 0.94);
        backdrop-filter: blur(4px);
        padding: 5px 12px;
        border-radius: 6px;
        font-size: 11px;
        border: 1px solid var(--gray-300);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        display: flex;
        align-items: center;
        gap: 6px;
        pointer-events: none;
      }

      .pulse-indicator-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #10b981;
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        animation: pulse-dot 1.5s infinite;
      }

      @keyframes pulse-dot {
        0% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        }
        70% {
          transform: scale(1);
          box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
        }
        100% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
        }
      }

      @keyframes pulse-ring {
        0% {
          transform: scale(0.33);
          opacity: 0.8;
        }
        80%,
        100% {
          transform: scale(1.6);
          opacity: 0;
        }
      }

      .route-map-legend-bar {
        padding: 8px 14px;
        background: #f8fafc;
        border-top: 1px solid var(--gray-200);

        .legend-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 4px;
          vertical-align: middle;
        }
      }

      .upcoming-shift-card {
        border: 1px solid var(--gray-200);
        border-radius: 10px;
        background: white;
        transition: all 0.2s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
          border-color: #93c5fd;
        }
      }

      /* SHIFTS SELECTOR STRIP (DANH SÁCH CA PHÂN CÔNG) */
      .shifts-selector-strip {
        display: flex;
        gap: 12px;
        overflow-x: auto;
        padding: 4px 2px 12px 2px;
      }

      .shift-selector-chip {
        min-width: 260px;
        padding: 12px 14px;
        background: white;
        border: 2px solid var(--gray-200);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        &:hover {
          border-color: #93c5fd;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        &.is-selected {
          border-color: #2563eb;
          background: #f0f7ff;
          box-shadow: 0 0 0 1px #2563eb;
        }
      }

      /* STEP BOXES FOR SHIFT EXECUTION */
      .shift-step-box {
        border: 1px solid var(--gray-200);
        border-radius: 10px;
        background: white;
        padding: 14px;
        margin-bottom: 14px;

        &.step-checkin-pending {
          background: #fffbeb;
          border: 1px dashed #f59e0b;
        }

        &.step-checkin-done {
          background: #f0fdf4;
          border: 1px solid #86efac;
        }
      }

      .shift-summary-box {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 10px;
        padding: 14px;
      }

      /* SCHEDULE LIST ROW CARDS */
      .schedule-row-card {
        background: white;
        transition: all 0.2s ease;
        cursor: pointer;

        &:hover {
          border-color: #3b82f6 !important;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.12);
          transform: translateY(-2px);

          .route-hover-title {
            color: #2563eb !important;
          }
        }
      }

      .shift-calendar-badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 68px;
        height: 68px;
        border-radius: 8px;
        border: 1px solid var(--gray-200);
        background: #f8fafc;
        flex-shrink: 0;

        .cal-month {
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .cal-day {
          font-size: 18px;
          font-weight: 800;
          line-height: 1.1;
        }
        .cal-year {
          font-size: 8px;
          color: #64748b;
        }

        &.badge-morning {
          background: #fefce8;
          border-color: #fef08a;
          color: #854d0e;
        }
        &.badge-afternoon {
          background: #f0fdfa;
          border-color: #99f6e4;
          color: #0f766e;
        }
        &.badge-night {
          background: #faf5ff;
          border-color: #e9d5ff;
          color: #6b21a8;
        }
      }

      .fs-xxxs {
        font-size: 9px;
      }
    `,
  ],
})
export class FieldPortalComponent implements OnInit, AfterViewInit, OnDestroy {
  patrolService = inject(PatrolService);
  projectService = inject(ProjectService);
  route = inject(ActivatedRoute);

  // Persona: TUAN_NAM | TUAN_HANG | TUAN_TUNG | THO_HAI
  currentPersona: 'TUAN_NAM' | 'TUAN_HANG' | 'TUAN_TUNG' | 'THO_HAI' = 'TUAN_NAM';

  // 3 Distinct Tabs: MY_SCHEDULE | MY_ISSUES | TASKS
  activeTab: 'MY_SCHEDULE' | 'MY_ISSUES' | 'TASKS' = 'MY_SCHEDULE';

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
    description:
      'Khoảng 3m2 vỉa hè bị sụt lún mép tạo rãnh sâu nguy hiểm cho người đi bộ.',
    layerId: 'ROADWAY' as LayerId,
    categoryId: 'cat-4',
    selectedAssetIds: ['ast-24'] as string[],
    photoUrl:
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&q=80',
    lat: 10.7745,
    lng: 106.7032,
    address: 'Số 68 Phố đi bộ Nguyễn Huệ, P. Bến Nghé, Q.1',
    routeName: 'Tuyến Phố Đi Bộ Nguyễn Huệ',
    resubmitNote: '',
    scheduleId: undefined as string | undefined,
  };

  @ViewChild('issueModalMapContainer') issueModalMapContainer?: ElementRef;
  private modalMap?: L.Map;
  private modalMarkersGroup?: L.FeatureGroup;
  private modalPolyline?: L.Polyline;

  // Bản đồ Lộ trình ca tuần tra
  @ViewChild('patrolRouteMapContainer') patrolRouteMapContainer?: ElementRef;
  private routeMap?: L.Map;
  private routePolyline?: L.Polyline;
  private routeMarkersGroup?: L.FeatureGroup;

  // Form Điểm danh Web (Check-in)
  checkInForm = {
    personnelId: 'ns-1',
    location: 'Công viên Tượng đài Bác Hồ (GPS: 10.7762, 106.7022)',
  };

  // Trạng thái xem ca: false = xem Danh sách ca, true = xem Chi tiết ca tác nghiệp
  viewingScheduleDetail = false;
  selectedScheduleId?: string;
  showRouteMap = false;
  scheduleFilter: 'ALL' | 'TODAY' | 'IN_PROGRESS' | 'PLANNED' = 'ALL';

  currentTimeString = '';
  private clockInterval?: any;

  // Modal Báo cáo hoàn thành của Thợ
  showCompletionModal = false;
  completingTask?: PatrolIssue;
  completionForm = {
    afterPhotoUrl:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=700&q=80',
    finalCondition: 'GOOD' as AssetCondition,
    note: 'Đã hoàn tất thay thế bu lông neo và kiểm tra chịu lực an toàn.',
  };

  // Mẫu ảnh hiện trường tham khảo
  samplePhotos = [
    {
      title: 'Sụt lún vỉa hè',
      url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&q=80',
    },
    {
      title: 'Đèn chập cháy',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=700&q=80',
    },
    {
      title: 'Cây gãy cành',
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=700&q=80',
    },
    {
      title: 'Hố ga nứt vỡ',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=700&q=80',
    },
  ];

  reportForm = {
    title: 'Sụt lún mép vỉa hè lát đá hoa cương',
    categoryId: 'cat-4',
    assetId: 'ast-24',
    assetCondition: 'DAMAGED' as AssetCondition,
    description:
      'Khoảng 3m2 vỉa hè bị sụt lún mép tạo rãnh sâu nguy hiểm cho người đi bộ.',
    photoUrl:
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&q=80',
    lat: 10.7745,
    lng: 106.7032,
    address: 'Số 68 Phố đi bộ Nguyễn Huệ, P. Bến Nghé, Q.1',
    routeName: 'Tuyến Nguyễn Huệ',
  };

  ngOnInit() {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);

    // Hỗ trợ query params: /field-portal?tab=MY_SCHEDULE hoặc tab=MY_ISSUES
    this.route.queryParams.subscribe((params) => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
      if (params['scheduleId']) {
        this.selectedScheduleId = params['scheduleId'];
        this.viewingScheduleDetail = true;
      }
    });
  }

  ngAfterViewInit() {
    // Bản đồ chỉ khởi tạo khi showRouteMap = true
  }

  ngOnDestroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    if (this.routeMap) {
      this.routeMap.remove();
      this.routeMap = undefined;
    }
    if (this.modalMap) {
      this.modalMap.remove();
      this.modalMap = undefined;
    }
  }

  updateClock() {
    this.currentTimeString =
      new Date().toLocaleTimeString('vi-VN') + ' - 13/10/2026';
  }

  onPersonaChange() {
    this.viewingScheduleDetail = false;
    this.showRouteMap = false;
    this.selectedScheduleId = undefined;

    if (this.currentPersona === 'TUAN_NAM') {
      this.checkInForm.personnelId = 'ns-1';
      this.activeTab = 'MY_SCHEDULE';
    } else if (this.currentPersona === 'TUAN_HANG') {
      this.checkInForm.personnelId = 'ns-4';
      this.activeTab = 'MY_SCHEDULE';
    } else if (this.currentPersona === 'TUAN_TUNG') {
      this.checkInForm.personnelId = 'ns-6';
      this.activeTab = 'MY_SCHEDULE';
    } else {
      this.activeTab = 'TASKS';
    }
  }

  switchTab(tab: 'MY_SCHEDULE' | 'MY_ISSUES' | 'TASKS') {
    this.activeTab = tab;
  }

  onSelectCheckInPersonnel() {
    this.selectedScheduleId = undefined;
    this.viewingScheduleDetail = false;
    this.showRouteMap = false;
  }

  get selectedPersonnelRecord(): PatrolPersonnel | undefined {
    return this.patrolService
      .personnel()
      .find((p) => p.id === this.checkInForm.personnelId);
  }

  get isCurrentWorkerCheckedIn(): boolean {
    return this.selectedPersonnelRecord?.todayAttendance === 'CHECKED_IN';
  }

  // Ca trực hôm nay được phân công cho nhân viên này
  get todaySchedule(): PatrolSchedule | undefined {
    const pId = this.checkInForm.personnelId;
    return (
      this.patrolService
        .schedules()
        .find(
          (s) =>
            s.date === '2026-10-13' &&
            s.assignedPersonnel.some((p) => p.id === pId),
        ) ||
      this.patrolService
        .schedules()
        .find((s) => s.assignedPersonnel.some((p) => p.id === pId)) ||
      this.patrolService.schedules()[0]
    );
  }

  // Ca trực đang được chọn hiển thị chi tiết (hoặc mặc định là ca hôm nay)
  get currentSchedule(): PatrolSchedule | undefined {
    if (this.selectedScheduleId) {
      const found = this.patrolService
        .schedules()
        .find((s) => s.id === this.selectedScheduleId);
      if (found) return found;
    }
    return (
      this.todaySchedule ||
      this.myAssignedSchedules[0] ||
      this.patrolService.schedules()[0]
    );
  }

  // Chọn ca trực từ dải ca
  // Danh sách các ca trực được giao cho nhân viên này sau khi áp dụng bộ lọc
  get filteredMyAssignedSchedules(): PatrolSchedule[] {
    const list = this.myAssignedSchedules;
    if (this.scheduleFilter === 'TODAY') {
      return list.filter((s) => s.date === '2026-10-13');
    }
    if (this.scheduleFilter === 'IN_PROGRESS') {
      return list.filter((s) => s.status === 'IN_PROGRESS');
    }
    if (this.scheduleFilter === 'PLANNED') {
      return list.filter((s) => s.status === 'PLANNED');
    }
    return list;
  }

  // Mở màn hình chi tiết ca
  openScheduleDetail(sch: PatrolSchedule) {
    this.selectedScheduleId = sch.id;
    this.viewingScheduleDetail = true;
    this.showRouteMap = false;
    if (this.routeMap) {
      this.routeMap.remove();
      this.routeMap = undefined;
    }
  }

  // Quay lại danh sách ca
  closeScheduleDetail() {
    this.viewingScheduleDetail = false;
    this.showRouteMap = false;
    if (this.routeMap) {
      this.routeMap.remove();
      this.routeMap = undefined;
    }
  }

  // Bật/tắt bản đồ lộ trình tuyến mini
  toggleRouteMap() {
    this.showRouteMap = !this.showRouteMap;
    if (this.showRouteMap) {
      if (this.routeMap) {
        this.routeMap.remove();
        this.routeMap = undefined;
      }
      this.tryInitRouteMap(6);
    } else {
      if (this.routeMap) {
        this.routeMap.remove();
        this.routeMap = undefined;
      }
    }
  }

  // Chọn ca trực từ danh sách
  selectSchedule(sch: PatrolSchedule) {
    this.openScheduleDetail(sch);
  }

  // Kiểm tra nhân viên hiện tại đã điểm danh cho ca này chưa
  isCurrentWorkerCheckedInForSchedule(schedule?: PatrolSchedule): boolean {
    if (!schedule) return false;
    const pId = this.checkInForm.personnelId;
    const member = schedule.assignedPersonnel?.find((p) => p.id === pId);
    if (member && member.checkedIn) return true;
    if (
      schedule.id === this.todaySchedule?.id &&
      this.selectedPersonnelRecord?.todayAttendance === 'CHECKED_IN'
    ) {
      return true;
    }
    return false;
  }

  // Đánh giá trạng thái điểm danh cho ca trực (Đủ 4 trạng thái: HỢP LỆ, KHÔNG HỢP LỆ, CHỜ DUYỆT, CHƯA ĐIỂM DANH)
  getAttendanceEvaluation(
    schedule?: PatrolSchedule,
  ): 'VALID' | 'INVALID' | 'PENDING' | 'NOT_CHECKED_IN' {
    if (!schedule) return 'NOT_CHECKED_IN';
    if (!this.isCurrentWorkerCheckedInForSchedule(schedule)) {
      return 'NOT_CHECKED_IN';
    }
    const pId = this.checkInForm.personnelId;
    const member = schedule.assignedPersonnel?.find((p) => p.id === pId);

    if (member) {
      if (member.isValidAttendance === true) return 'VALID';
      if (member.isValidAttendance === false) return 'INVALID';
      if (member.isValidAttendance === undefined) {
        if (schedule.id === this.todaySchedule?.id && this.selectedPersonnelRecord) {
          if (this.selectedPersonnelRecord.isValidAttendance === true) return 'VALID';
          if (this.selectedPersonnelRecord.isValidAttendance === false) return 'INVALID';
        }
        return 'PENDING';
      }
    }

    if (schedule.id === this.todaySchedule?.id && this.selectedPersonnelRecord) {
      if (this.selectedPersonnelRecord.isValidAttendance === true) return 'VALID';
      if (this.selectedPersonnelRecord.isValidAttendance === false) return 'INVALID';
    }

    return 'PENDING';
  }

  getAssignedMemberForSchedule(schedule?: PatrolSchedule) {
    if (!schedule) return undefined;
    const pId = this.checkInForm.personnelId;
    return schedule.assignedPersonnel?.find((p) => p.id === pId);
  }

  getCheckInTimeForSchedule(schedule?: PatrolSchedule): string {
    const member = this.getAssignedMemberForSchedule(schedule);
    return (
      member?.checkInTime ||
      (schedule?.id === this.todaySchedule?.id ? this.selectedPersonnelRecord?.checkInTime : undefined) ||
      '06:45 13/10/2026'
    );
  }

  getCheckInLocationForSchedule(schedule?: PatrolSchedule): string {
    const member = this.getAssignedMemberForSchedule(schedule);
    return (
      member?.checkInLocation ||
      (schedule?.id === this.todaySchedule?.id ? this.selectedPersonnelRecord?.checkInLocation : undefined) ||
      this.checkInForm.location ||
      schedule?.startPointName ||
      'Hiện trường tuần kiểm'
    );
  }

  getInvalidReasonForSchedule(schedule?: PatrolSchedule): string {
    const member = this.getAssignedMemberForSchedule(schedule);
    return (
      member?.invalidReason ||
      'Tọa độ GPS điểm danh lệch >500m so với trạm xuất phát hoặc vào ca trễ hơn quy định. Cần liên hệ Cán bộ / Trưởng đội để đối soát giải trình thực tế.'
    );
  }

  // Điểm danh trực tiếp cho ca này (UC 8)
  executeScheduleCheckIn(schedule: PatrolSchedule) {
    const pId = this.checkInForm.personnelId;
    const checkInTimeStr =
      new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }) +
      ' ' +
      schedule.date;

    // Cập nhật trạng thái checkedIn trong assignedPersonnel của schedule
    this.patrolService.schedules.update((list) =>
      list.map((s) => {
        if (s.id !== schedule.id) return s;
        return {
          ...s,
          assignedPersonnel: s.assignedPersonnel.map((p) =>
            p.id === pId
              ? { ...p, checkedIn: true, checkInTime: checkInTimeStr }
              : p,
          ),
        };
      }),
    );

    // Cập nhật dịch vụ điểm danh hiện trường
    this.patrolService.workerSelfCheckIn(
      pId,
      schedule.id,
      this.checkInForm.location || schedule.startPointName,
    );
  }

  // Danh sách các ca trực được giao cho nhân viên này
  get myAssignedSchedules(): PatrolSchedule[] {
    const pId = this.checkInForm.personnelId;
    return this.patrolService
      .schedules()
      .filter((s) => s.assignedPersonnel.some((p) => p.id === pId));
  }

  // Các ca trực sắp tới (trừ ca đang chọn)
  get myUpcomingSchedules(): PatrolSchedule[] {
    const current = this.currentSchedule;
    return this.myAssignedSchedules.filter((s) => s.id !== current?.id);
  }

  // Đếm số sự cố phát hiện trong ca trực cụ thể
  getIssuesCountForSchedule(scheduleId?: string): number {
    if (!scheduleId) return 0;
    return this.patrolService
      .issues()
      .filter((i) => i.scheduleId === scheduleId).length;
  }

  getIssuesForSchedule(scheduleId?: string): PatrolIssue[] {
    if (!scheduleId) return [];
    return this.patrolService
      .issues()
      .filter((i) => i.scheduleId === scheduleId);
  }

  startPatrolShift(schedule: PatrolSchedule) {
    if (!this.isCurrentWorkerCheckedInForSchedule(schedule)) {
      this.executeScheduleCheckIn(schedule);
    }
    this.patrolService.updateScheduleStatus(schedule.id, 'IN_PROGRESS');
  }

  completePatrolShift(schedule: PatrolSchedule) {
    if (
      confirm(
        `Bạn có chắc chắn muốn kết thúc ca tuần tra [${schedule.routeName}]?`,
      )
    ) {
      this.patrolService.updateScheduleStatus(schedule.id, 'COMPLETED');
    }
  }

  openCreateIssueFromSchedule(schedule: PatrolSchedule) {
    this.openCreateIssueModal(schedule);
  }

  // Khởi tạo bản đồ Lộ trình tuần tra với cơ chế retry an toàn
  tryInitRouteMap(retries = 6) {
    if (!this.showRouteMap) return;
    setTimeout(() => {
      if (!this.showRouteMap) return;
      if (!this.patrolRouteMapContainer?.nativeElement) {
        if (retries > 0) {
          this.tryInitRouteMap(retries - 1);
        }
        return;
      }
      const el = this.patrolRouteMapContainer.nativeElement;
      if (el.offsetWidth === 0 || el.offsetHeight === 0) {
        if (retries > 0) {
          this.tryInitRouteMap(retries - 1);
        }
        return;
      }
      this.initRouteMap();
    }, 120);
  }

  reloadRouteMap() {
    if (this.routeMap) {
      this.routeMap.remove();
      this.routeMap = undefined;
    }
    this.tryInitRouteMap(4);
  }

  centerOnMyPosition() {
    const myPos: L.LatLngExpression = [10.7745, 106.7032];
    if (!this.routeMap) {
      this.tryInitRouteMap(4);
      return;
    }
    this.routeMap.setView(myPos, 18, { animate: true });
    this.routeMap.invalidateSize();
  }

  initRouteMap() {
    if (!this.patrolRouteMapContainer || !this.currentSchedule) return;
    const container = this.patrolRouteMapContainer.nativeElement;

    if (this.routeMap) {
      this.routeMap.remove();
      this.routeMap = undefined;
    }

    const coords = this.currentSchedule.routeCoordinates || [];
    const centerPoint: L.LatLngExpression =
      coords.length > 0 ? coords[0] : [10.7745, 106.7032];

    this.routeMap = L.map(container, {
      center: centerPoint,
      zoom: 16,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // CartoDB Voyager tile layer: Cực nhanh, ổn định 100%, không rate limit
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 20,
      },
    ).addTo(this.routeMap);

    this.routeMarkersGroup = L.featureGroup().addTo(this.routeMap);

    // Vẽ Polyline vệt đường tuần tra với 2 lớp (lớp viền đậm + lớp màu sáng)
    if (coords.length > 1) {
      L.polyline(coords, {
        color: '#1e3a8a',
        weight: 9,
        opacity: 0.7,
      }).addTo(this.routeMap);

      this.routePolyline = L.polyline(coords, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.95,
      }).addTo(this.routeMap);
    }

    // Marker Bắt đầu (Cờ xanh xuất phát)
    if (coords.length > 0) {
      const startIcon = L.divIcon({
        className: 'route-flag-start-marker',
        html: `<div style="background: #10b981; color: white; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 11px; white-space: nowrap; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 4px;">
          <span>🚩 Xuất phát:</span>
          <strong>${this.currentSchedule.startPointName}</strong>
        </div>`,
        iconAnchor: [0, 18],
      });
      L.marker(coords[0], { icon: startIcon })
        .bindTooltip(
          `Điểm xuất phát ca trực: ${this.currentSchedule.startPointName}`,
          { direction: 'top' },
        )
        .addTo(this.routeMarkersGroup);
    }

    // Marker Kết thúc (Cờ đỏ đích)
    if (coords.length > 1) {
      const endIcon = L.divIcon({
        className: 'route-flag-end-marker',
        html: `<div style="background: #ef4444; color: white; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 11px; white-space: nowrap; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 4px;">
          <span>🏁 Đích:</span>
          <strong>${this.currentSchedule.endPointName}</strong>
        </div>`,
        iconAnchor: [0, 18],
      });
      L.marker(coords[coords.length - 1], { icon: endIcon })
        .bindTooltip(
          `Điểm kết thúc ca trực: ${this.currentSchedule.endPointName}`,
          { direction: 'top' },
        )
        .addTo(this.routeMarkersGroup);
    }

    // Các điểm chốt kiểm tra trung gian
    if (coords.length > 2) {
      for (let i = 1; i < coords.length - 1; i++) {
        const wpIcon = L.divIcon({
          className: 'route-waypoint-dot',
          html: `<div style="background: #ffffff; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #2563eb; box-shadow: 0 1px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker(coords[i], { icon: wpIcon })
          .bindTooltip(
            `Điểm chốt kiểm tra #${i + 1} (${this.currentSchedule.routeName})`,
            { direction: 'top' },
          )
          .addTo(this.routeMarkersGroup);
      }
    }

    // Marker Vị trí GPS hiện trường của nhân viên (Trần Đình Nam)
    const myPosIcon = L.divIcon({
      className: 'my-current-pos-marker',
      html: `<div style="position: relative; width: 22px; height: 22px;">
        <div style="position: absolute; top: 0; left: 0; width: 22px; height: 22px; border-radius: 50%; background: rgba(59, 130, 246, 0.4); animation: pulse-ring 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;"></div>
        <div style="position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #2563eb; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>
      </div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    L.marker([10.7745, 106.7032], { icon: myPosIcon })
      .bindTooltip(
        '<strong>Vị trí của bạn: Trần Đình Nam</strong><br><span style="font-size:10px;color:#666;">GPS: 10.77450, 106.70320</span>',
        { direction: 'top' },
      )
      .addTo(this.routeMarkersGroup);

    this.fitRouteMap();

    // Invalidate size nhiều nhịp để đảm bảo kích thước Leaflet chuẩn 100% khi DOM ổn định
    setTimeout(() => {
      this.routeMap?.invalidateSize();
    }, 150);
    setTimeout(() => {
      this.routeMap?.invalidateSize();
    }, 450);
    setTimeout(() => {
      this.routeMap?.invalidateSize();
    }, 850);
  }

  fitRouteMap() {
    if (!this.routeMap) return;
    if (this.routePolyline) {
      this.routeMap.fitBounds(this.routePolyline.getBounds(), {
        padding: [35, 35],
      });
    }
  }

  get checkedInCount(): number {
    return this.patrolService
      .personnel()
      .filter((p) => p.todayAttendance === 'CHECKED_IN').length;
  }

  // THỰC HIỆN ĐIỂM DANH TRÊN WEB (CHECK-IN)
  executeWebCheckIn() {
    const schId = this.todaySchedule?.id || 'sch-1';
    this.patrolService.workerSelfCheckIn(
      this.checkInForm.personnelId,
      schId,
      this.checkInForm.location,
    );
  }

  executeCheckOut() {
    this.patrolService.personnel.update((list) =>
      list.map((p) =>
        p.id === this.checkInForm.personnelId
          ? { ...p, todayAttendance: 'NOT_CHECKED_IN', checkInTime: undefined }
          : p,
      ),
    );
  }

  quickCheckInUser(personnelId: string) {
    const schId = this.todaySchedule?.id || 'sch-1';
    this.patrolService.workerSelfCheckIn(
      personnelId,
      schId,
      'Điểm danh nhanh qua Web Portal',
    );
  }

  getAttendanceBadgeClass(att: AttendanceStatus): string {
    switch (att) {
      case 'CHECKED_IN':
        return 'bg-success';
      case 'LATE':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary';
    }
  }

  getAttendanceLabel(att: AttendanceStatus): string {
    switch (att) {
      case 'CHECKED_IN':
        return 'Đã điểm danh';
      case 'LATE':
        return 'Điểm danh trễ';
      default:
        return 'Chưa điểm danh';
    }
  }

  // SỔ SỰ CỐ CỦA TÔI (CỔNG HIỆN TRƯỜNG - UC 7)
  get myReportedIssues(): PatrolIssue[] {
    return this.patrolService.issues();
  }

  get myRejectedIssuesCount(): number {
    return this.myReportedIssues.filter((i) => i.status === 'REJECTED').length;
  }

  countMyIssuesByStatus(status: string): number {
    return this.myReportedIssues.filter((i) => i.status === status).length;
  }

  get filteredMyIssues(): PatrolIssue[] {
    return this.myReportedIssues.filter((iss) => {
      if (
        this.myIssuesStatusFilter !== 'ALL' &&
        iss.status !== this.myIssuesStatusFilter
      ) {
        return false;
      }
      if (this.myIssuesSearchKeyword.trim()) {
        const kw = this.myIssuesSearchKeyword.toLowerCase();
        const matchCode = iss.code?.toLowerCase().includes(kw);
        const matchTitle = iss.title?.toLowerCase().includes(kw);
        const matchAddr = iss.address?.toLowerCase().includes(kw);
        const matchRoute = iss.routeName?.toLowerCase().includes(kw);
        const matchAsset =
          iss.assetName?.toLowerCase().includes(kw) ||
          iss.assetCode?.toLowerCase().includes(kw);
        return matchCode || matchTitle || matchAddr || matchRoute || matchAsset;
      }
      return true;
    });
  }

  get availableCategories() {
    return this.patrolService
      .categories()
      .filter((c) => c.layerId === this.issueModalForm.layerId);
  }

  get availableAssetsForLayer(): Asset[] {
    return this.projectService
      .masterAssets()
      .filter((a) => a.layerId === this.issueModalForm.layerId);
  }

  get filteredAvailableAssets(): Asset[] {
    if (!this.assetSearchKeyword.trim()) {
      return this.availableAssetsForLayer;
    }
    const kw = this.assetSearchKeyword.toLowerCase();
    return this.availableAssetsForLayer.filter(
      (a) =>
        a.code.toLowerCase().includes(kw) ||
        a.name.toLowerCase().includes(kw) ||
        (a.address && a.address.toLowerCase().includes(kw)),
    );
  }

  isAssetSelected(assetId: string): boolean {
    return this.issueModalForm.selectedAssetIds.includes(assetId);
  }

  getLayerName(layerId: LayerId): string {
    switch (layerId) {
      case 'ROADWAY':
        return 'Mặt đường & Biển báo';
      case 'LIGHTING':
        return 'Chiếu sáng đô thị';
      case 'GREENERY':
        return 'Cây xanh & Công viên';
      case 'DRAINAGE':
        return 'Thoát nước & Hố ga';
      default:
        return layerId;
    }
  }

  getLayerColor(layerId: LayerId): string {
    switch (layerId) {
      case 'ROADWAY':
        return '#8b5cf6';
      case 'LIGHTING':
        return '#eab308';
      case 'GREENERY':
        return '#10b981';
      case 'DRAINAGE':
        return '#06b6d4';
      default:
        return '#6b7280';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'NEW':
        return 'Mới tiếp nhận (Chờ duyệt)';
      case 'QUICK_FIXING':
        return 'Đang khắc phục';
      case 'RESOLVED':
        return 'Đã hoàn thành';
      case 'MOVED_TO_PROJECT':
        return 'Đã chuyển Dự án Duy tu';
      case 'REJECTED':
        return 'Bị từ chối tiếp nhận';
      default:
        return status;
    }
  }

  // MODAL GHI NHẬN / SỬA SỰ CỐ
  openCreateIssueModal(schedule?: PatrolSchedule) {
    this.isEditingIssue = false;
    this.editingIssue = undefined;
    const targetSchedule =
      schedule || this.currentSchedule || this.todaySchedule;
    const coords = targetSchedule?.routeCoordinates?.[0];
    const initialLat = coords ? coords[0] : 10.7745;
    const initialLng = coords ? coords[1] : 106.7032;

    this.issueModalForm = {
      title: targetSchedule
        ? `Sự cố trên ${targetSchedule.routeName}`
        : 'Sụt lún mép vỉa hè lát đá hoa cương',
      description:
        'Ghi nhận hiện trường trong ca tuần tra kiểm tra hạ tầng kỹ thuật đô thị.',
      layerId: 'ROADWAY' as LayerId,
      categoryId: 'cat-4',
      selectedAssetIds: ['ast-24'],
      photoUrl:
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&q=80',
      lat: initialLat,
      lng: initialLng,
      address:
        targetSchedule?.startPointName ||
        'Số 68 Phố đi bộ Nguyễn Huệ, P. Bến Nghé, Q.1',
      routeName: targetSchedule?.routeName || 'Tuyến Phố Đi Bộ Nguyễn Huệ',
      resubmitNote: '',
      scheduleId: targetSchedule?.id,
    };
    this.showIssueModal = true;
    setTimeout(() => this.initModalMap(), 250);
  }

  openEditRejectedIssueModal(issue: PatrolIssue) {
    this.isEditingIssue = true;
    this.editingIssue = issue;
    const selectedIds =
      issue.attachedAssets && issue.attachedAssets.length > 0
        ? issue.attachedAssets.map((a) => a.assetId)
        : issue.assetId
          ? [issue.assetId]
          : [];

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
      resubmitNote: issue.resubmitNotes || '',
      scheduleId: issue.scheduleId,
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
      zoomControl: true,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; CARTO &copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 20,
      },
    ).addTo(this.modalMap);

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
    this.availableAssetsForLayer.forEach((ast) => {
      const isSelected = this.isAssetSelected(ast.id);
      const selectedIndex = this.issueModalForm.selectedAssetIds.indexOf(
        ast.id,
      );

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
          iconAnchor: [14, 14],
        });

        const marker = L.marker([ast.lat, ast.lng], {
          icon: selectedIcon,
        }).addTo(this.modalMarkersGroup!);
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
          iconAnchor: [7, 7],
        });

        const marker = L.marker([ast.lat, ast.lng], {
          icon: defaultIcon,
        }).addTo(this.modalMarkersGroup!);
        marker.bindTooltip(`[${ast.code}] ${ast.name}`, {
          direction: 'top',
          offset: [0, -8],
        });
        marker.on('click', () => this.toggleAssetSelection(ast));
      }
    });

    // Vẽ polyline nối các tài sản được chọn (Nguyên tắc 2: nhiều tài sản cùng loại liên tiếp)
    if (selectedPoints.length > 1) {
      this.modalPolyline = L.polyline(selectedPoints, {
        color: '#dc2626',
        weight: 3,
        dashArray: '6, 6',
        opacity: 0.8,
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
      iconAnchor: [9, 9],
    });
    L.marker([this.issueModalForm.lat, this.issueModalForm.lng], {
      icon: userIcon,
    })
      .bindTooltip('Vị trí hiện trường của bạn', { direction: 'bottom' })
      .addTo(this.modalMarkersGroup);
  }

  fitMapToSelected() {
    if (!this.modalMap) return;
    if (
      this.modalMarkersGroup &&
      this.modalMarkersGroup.getLayers().length > 0
    ) {
      this.modalMap.fitBounds(this.modalMarkersGroup.getBounds(), {
        padding: [30, 30],
      });
    }
  }

  centerMapOnUser() {
    if (!this.modalMap) return;
    this.modalMap.setView(
      [this.issueModalForm.lat, this.issueModalForm.lng],
      17,
    );
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

    const selectedAssets = this.projectService
      .masterAssets()
      .filter((a) => this.issueModalForm.selectedAssetIds.includes(a.id));
    const primaryAsset = selectedAssets[0];
    const category = this.patrolService
      .categories()
      .find((c) => c.id === this.issueModalForm.categoryId);

    const attachedAssetsList = selectedAssets.map((a) => ({
      assetId: a.id,
      assetCode: a.code,
      assetName: a.name,
      layerId: a.layerId,
      condition: 'DAMAGED' as AssetCondition,
      notes: a.address,
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
          routeName: this.issueModalForm.routeName,
        },
        this.issueModalForm.resubmitNote ||
          'Đã kiểm tra lại hiện trường và bổ sung tài sản theo yêu cầu',
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
        reportedByName: 'Trần Đình Nam (Tuần tra viên)',
        scheduleId: this.issueModalForm.scheduleId,
      });
    }

    this.closeIssueModal();
  }

  // THỢ (UC 10)
  get myAssignedTasks(): PatrolIssue[] {
    return this.patrolService.issues().filter((i) => {
      return (
        i.status === 'QUICK_FIXING' ||
        i.status === 'RESOLVED' ||
        (i.status === 'NEW' && i.quickFixDetails)
      );
    });
  }

  get filteredTasks(): PatrolIssue[] {
    return this.myAssignedTasks.filter((t) => {
      if (this.taskStatusFilter !== 'ALL' && t.status !== this.taskStatusFilter)
        return false;
      return true;
    });
  }

  countTasksByStatus(st: string): number {
    return this.myAssignedTasks.filter((t) => t.status === st).length;
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
      this.completionForm.finalCondition,
    );
    this.showCompletionModal = false;
  }

  exportMyTasksExcel() {
    const rows = this.filteredTasks.map((t) => [
      t.code,
      t.title,
      t.priority,
      t.status,
      t.address,
      t.quickFixDetails?.deadline || 'Hôm nay',
      t.quickFixDetails?.estimatedCost || 0,
      t.quickFixDetails?.assignedWorker || 'Nguyễn Văn Hải',
    ]);

    this.patrolService.exportToCsv(
      'Nhiem_Vu_Khac_Phuc_Duoc_Giao',
      [
        'Mã Sự Cố',
        'Tên Sự Cố',
        'Độ Ưu Tiên',
        'Trạng Thái',
        'Địa Chỉ Hiện Trường',
        'Hạn Chót',
        'Dự Toán',
        'Thợ Phụ Trách',
      ],
      rows,
    );
  }

  // BÁO CÁO SỰ CỐ TRÊN WEB (UC 7 CŨ - CHUYỂN SANG MODAL MỚI)
  onSelectAsset() {
    const ast = this.projectService
      .masterAssets()
      .find((a) => a.id === this.reportForm.assetId);
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
