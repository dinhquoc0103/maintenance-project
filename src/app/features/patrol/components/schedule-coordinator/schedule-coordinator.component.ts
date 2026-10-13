import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { PatrolService } from '../../../../core/services/patrol.service';
import { ProjectService } from '../../../../core/services/project.service';
import { PatrolSchedule, ShiftType } from '../../../../core/models/patrol.model';

@Component({
  selector: 'app-schedule-coordinator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="coordinator-container">
      <!-- CỘT TRÁI: INTERACTIVE CALENDAR & DANH SÁCH CA TRỰC TRONG NGÀY (40%) -->
      <div class="calendar-pane">
        <!-- Calendar Header -->
        <div class="pane-header">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
              <h3 class="pane-title m-0"><i class="bi bi-calendar3-event-fill text-primary"></i> Lịch Trình Tuần Kiểm</h3>
              <p class="pane-subtitle m-0 text-muted">Điều phối ca trực & phân công nhân sự (UC 3, UC 8)</p>
            </div>
            <button class="btn btn-sm btn-primary d-flex align-items-center gap-1" (click)="openAddScheduleModal()">
              <i class="bi bi-plus-lg"></i>
              <span>Phân Công Ca Mới</span>
            </button>
          </div>

          <!-- Month Selector -->
          <div class="month-selector-bar">
            <button class="btn btn-sm btn-ghost p-1" (click)="prevMonth()"><i class="bi bi-chevron-left"></i></button>
            <span class="current-month-text fw-bold">Tháng {{ currentMonth + 1 }} / {{ currentYear }}</span>
            <button class="btn btn-sm btn-ghost p-1" (click)="nextMonth()"><i class="bi bi-chevron-right"></i></button>
            <button class="btn btn-xs btn-outline-secondary ms-auto" (click)="selectToday()">Hôm nay</button>
          </div>

          <!-- Mini Calendar Grid -->
          <div class="calendar-grid mt-2">
            <div class="weekday-header" *ngFor="let day of ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']">{{ day }}</div>
            <div
              *ngFor="let cell of calendarCells"
              class="calendar-cell"
              [class.other-month]="!cell.isCurrentMonth"
              [class.today]="cell.isToday"
              [class.selected]="cell.dateString === selectedDate"
              [class.has-schedule]="cell.scheduleCount > 0"
              (click)="onDateSelect(cell.dateString)"
            >
              <span class="day-number">{{ cell.dayNumber }}</span>
              <span class="schedule-dot" *ngIf="cell.scheduleCount > 0"></span>
            </div>
          </div>
        </div>

        <!-- Shift List on Selected Date -->
        <div class="schedules-on-date-container">
          <div class="date-header-badge">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-clock-history text-primary"></i>
              <span class="fw-bold">Lịch phân công ngày {{ formatDateVN(selectedDate) }}:</span>
            </div>
            <span class="badge bg-primary">{{ schedulesOnDate.length }} ca tuần tra</span>
          </div>

          <div class="schedules-scroll-list">
            <div
              *ngFor="let sch of schedulesOnDate"
              class="schedule-card"
              [class.active]="sch.id === patrolService.selectedScheduleId()"
              (click)="selectSchedule(sch)"
            >
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span class="shift-badge" [ngClass]="'shift-' + sch.shift.toLowerCase()">
                    Ca {{ getShiftLabel(sch.shift) }}
                  </span>
                  <span class="status-badge ms-2" [ngClass]="'sch-status-' + sch.status.toLowerCase()">
                    {{ getScheduleStatusLabel(sch.status) }}
                  </span>
                </div>
                <div class="dropdown-actions">
                  <button class="btn btn-xs btn-ghost p-0 text-muted" (click)="openChangeDateModal(sch); $event.stopPropagation()" title="Đổi ngày ca trực">
                    <i class="bi bi-calendar-range"></i>
                  </button>
                  <button class="btn btn-xs btn-ghost p-0 text-danger ms-2" (click)="deleteSchedule(sch); $event.stopPropagation()" title="Hủy ca">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>

              <h4 class="route-title"><i class="bi bi-signpost-fill text-danger me-1"></i> {{ sch.routeName }}</h4>
              <div class="points-row fs-xs text-muted mb-2">
                <span>{{ sch.startPointName }}</span>
                <i class="bi bi-arrow-right mx-1"></i>
                <span>{{ sch.endPointName }}</span>
              </div>

              <!-- Nhân sự phụ trách -->
              <div class="personnel-list-box">
                <div class="team-label text-muted fs-xs mb-1">
                  <i class="bi bi-people-fill text-primary"></i> {{ sch.teamName }}:
                </div>
                <div class="personnel-chips">
                  <div
                    *ngFor="let p of sch.assignedPersonnel"
                    class="p-chip"
                    [class.checked-in]="p.checkedIn"
                    (click)="quickCheckIn(sch.id, p.id); $event.stopPropagation()"
                    title="Bấm để điểm danh"
                  >
                    <i class="bi" [class.bi-check-circle-fill]="p.checkedIn" [class.bi-circle]="!p.checkedIn"></i>
                    <span>{{ p.name }}</span>
                    <span class="checkin-label">{{ p.checkedIn ? 'Đã điểm danh' : 'Chưa điểm danh' }}</span>
                  </div>
                </div>
              </div>

              <!-- Checkpoints Progress -->
              <div class="checkpoints-bar mt-2">
                <div class="d-flex justify-content-between fs-xs text-muted mb-1">
                  <span>Tiến độ tuần tra dọc tuyến:</span>
                  <span><strong>{{ sch.checkpointsInspected }}</strong> / {{ sch.checkpointsTotal }} điểm</span>
                </div>
                <div class="progress" style="height: 6px;">
                  <div
                    class="progress-bar bg-success"
                    [style.width.%]="sch.checkpointsTotal > 0 ? (sch.checkpointsInspected / sch.checkpointsTotal) * 100 : 0"
                  ></div>
                </div>
              </div>
            </div>

            <div *ngIf="schedulesOnDate.length === 0" class="empty-state text-center p-4 text-muted">
              <i class="bi bi-calendar-x fs-2"></i>
              <p class="mt-2 fs-xs">Chưa có ca tuần kiểm nào được phân công cho ngày này.</p>
              <button class="btn btn-sm btn-outline-primary" (click)="openAddScheduleModal()">
                + Phân công ca trực cho ngày này
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CỘT PHẢI: MAP VIEW HIỂN THỊ TUYẾN ĐƯỜNG VÀ CHECKPOINTS TRỰC QUAN (60%) -->
      <div class="map-view-pane">
        <div class="map-toolbar">
          <div class="d-flex align-items-center gap-2">
            <span class="map-badge"><i class="bi bi-geo-alt-fill text-danger"></i> Bản đồ Tuyến Tuần Kiểm (Map View - UC 7)</span>
            <span class="active-route-label" *ngIf="currentSchedule">
              Đang xem: <strong>{{ currentSchedule.routeName }}</strong> ({{ currentSchedule.assignedPersonnel.length }} nhân sự)
            </span>
          </div>
          <div class="map-legend">
            <span class="legend-item"><span class="legend-line"></span> Tuyến đường</span>
            <span class="legend-item"><span class="legend-pin pin-checkpoint"></span> Điểm kiểm tra</span>
            <span class="legend-item"><span class="legend-pin pin-personnel"></span> Nhân sự tuần tra</span>
          </div>
        </div>

        <div class="leaflet-container-wrapper">
          <div #routeMapContainer class="route-leaflet-map"></div>
        </div>

        <!-- Schedule Floating Summary Overlay -->
        <div class="map-floating-card" *ngIf="currentSchedule">
          <div class="d-flex justify-content-between align-items-center">
            <span class="badge bg-primary">Ca {{ getShiftLabel(currentSchedule.shift) }} • {{ formatDateVN(currentSchedule.date) }}</span>
            <span class="fs-xs text-muted">{{ currentSchedule.teamName }}</span>
          </div>
          <h4 class="mt-1 mb-1 fs-6 fw-bold">{{ currentSchedule.routeName }}</h4>
          <p class="fs-xs text-muted m-0" *ngIf="currentSchedule.notes">
            <i class="bi bi-info-circle"></i> {{ currentSchedule.notes }}
          </p>
        </div>
      </div>
    </div>

    <!-- MODAL PHÂN CÔNG CA MỚI (UC 3) -->
    <div class="custom-modal-backdrop" *ngIf="showAddModal">
      <div class="custom-modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title"><i class="bi bi-plus-circle-fill"></i> Phân Công Ca Tuần Kiểm Mới (UC 3)</h5>
            <button class="btn-close btn-close-white" (click)="showAddModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="form-label fw-bold">Ngày tuần kiểm (*):</label>
                <input type="date" class="form-control form-control-sm" [(ngModel)]="newScheduleForm.date" />
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold">Ca trực (*):</label>
                <select class="form-select form-select-sm" [(ngModel)]="newScheduleForm.shift">
                  <option value="SANG">Ca Sáng (06:00 - 11:30)</option>
                  <option value="CHIEU">Ca Chiều (13:00 - 17:30)</option>
                  <option value="TOI">Ca Tối (18:00 - 22:30)</option>
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Tuyến đường tuần tra (*):</label>
              <select class="form-select form-select-sm" [(ngModel)]="newScheduleForm.routeIndex" (ngModelChange)="onRouteChange()">
                <option *ngFor="let r of predefinedRoutes; let i = index" [value]="i">
                  {{ r.name }} ({{ r.start }} &rarr; {{ r.end }})
                </option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Đội / Cụm nhân sự tiếp nhận:</label>
              <select class="form-select form-select-sm" [(ngModel)]="newScheduleForm.teamId">
                <option *ngFor="let t of patrolService.teams()" [value]="t.id">{{ t.name }}</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Ghi chú & Chỉ đạo tuần tra:</label>
              <textarea class="form-control form-control-sm" rows="2" [(ngModel)]="newScheduleForm.notes" placeholder="Nội dung nhắc nhở nhân sự..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="showAddModal = false">Hủy</button>
            <button class="btn btn-primary btn-sm" (click)="submitAddSchedule()">Tạo Lịch Phân Công</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL ĐỔI NGÀY CA TRỰC (UC 3) -->
    <div class="custom-modal-backdrop" *ngIf="showChangeDateModal">
      <div class="custom-modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-warning text-dark">
            <h5 class="modal-title"><i class="bi bi-calendar-date-fill"></i> Thay Đổi Ngày Tuần Kiểm (UC 3)</h5>
            <button class="btn-close" (click)="showChangeDateModal = false"></button>
          </div>
          <div class="modal-body">
            <p class="fs-xs text-muted">
              Đang điều chỉnh lịch ca: <strong>{{ targetSchedule?.routeName }}</strong>
            </p>
            <div class="mb-3">
              <label class="form-label fw-bold">Chọn ngày mới (*):</label>
              <input type="date" class="form-control" [(ngModel)]="newDateValue" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="showChangeDateModal = false">Hủy</button>
            <button class="btn btn-warning btn-sm" (click)="submitChangeDate()">Lưu Thay Đổi</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .coordinator-container {
      display: flex;
      height: calc(100vh - 160px);
      background: #f8fafc;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    /* PANE TRÁI: CALENDAR & CA TRỰC */
    .calendar-pane {
      width: 40%;
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

      .pane-title { font-size: 15px; font-weight: 700; }
      .pane-subtitle { font-size: 11.5px; }
    }

    .month-selector-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;

      .current-month-text { font-size: 13.5px; color: var(--gray-800); }
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      text-align: center;
      font-size: 11.5px;

      .weekday-header {
        font-weight: 700;
        color: var(--gray-400);
        padding: 4px 0;
        font-size: 11px;
      }

      .calendar-cell {
        aspect-ratio: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        cursor: pointer;
        position: relative;
        transition: all 0.1s ease;

        &:hover {
          background: #f1f5f9;
        }

        &.other-month {
          color: var(--gray-300);
        }

        &.today {
          font-weight: 700;
          color: var(--primary-600);
        }

        &.selected {
          background: var(--primary-600) !important;
          color: white !important;
          font-weight: 700;

          .schedule-dot { background: white !important; }
        }

        .schedule-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--primary-500);
          position: absolute;
          bottom: 3px;
        }
      }
    }

    .schedules-on-date-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #f8fafc;

      .date-header-badge {
        padding: 10px 16px;
        background: white;
        border-bottom: 1px solid var(--gray-200);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12.5px;
      }
    }

    .schedules-scroll-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .schedule-card {
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

      .route-title {
        font-size: 13.5px;
        font-weight: 700;
        margin: 0 0 4px 0;
        color: var(--gray-900);
      }
    }

    .shift-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;

      &.shift-sang { background: #fef3c7; color: #b45309; }
      &.shift-chieu { background: #e0f2fe; color: #0369a1; }
      &.shift-toi { background: #f3e8ff; color: #6b21a8; }
    }

    .sch-status-planned { background: #f1f5f9; color: #475569; font-size: 10.5px; padding: 2px 6px; border-radius: 4px; }
    .sch-status-in_progress { background: #dcfce7; color: #15803d; font-size: 10.5px; padding: 2px 6px; border-radius: 4px; }
    .sch-status-completed { background: #e0e7ff; color: #4338ca; font-size: 10.5px; padding: 2px 6px; border-radius: 4px; }

    .personnel-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .p-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        border-radius: 12px;
        background: white;
        border: 1px solid var(--gray-200);
        font-size: 11px;
        cursor: pointer;

        &.checked-in {
          background: #ecfdf5;
          border-color: #a7f3d0;
          color: #047857;
        }

        .checkin-label {
          font-size: 9.5px;
          opacity: 0.8;
        }
      }
    }

    /* PANE PHẢI: MAP VIEW */
    .map-view-pane {
      width: 60%;
      height: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .map-toolbar {
      padding: 10px 16px;
      background: white;
      border-bottom: 1px solid var(--gray-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;

      .map-badge { font-weight: 700; color: var(--gray-800); }
      .active-route-label { font-size: 11.5px; color: var(--primary-700); }

      .map-legend {
        display: flex;
        gap: 12px;
        font-size: 11px;
        color: var(--gray-600);

        .legend-item { display: flex; align-items: center; gap: 4px; }
        .legend-line { width: 14px; height: 3px; background: #2563eb; border-radius: 2px; }
        .legend-pin {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          &.pin-checkpoint { background: #f59e0b; }
          &.pin-personnel { background: #10b981; }
        }
      }
    }

    .leaflet-container-wrapper {
      flex: 1;
      height: 100%;
      position: relative;

      .route-leaflet-map {
        width: 100%;
        height: 100%;
      }
    }

    .map-floating-card {
      position: absolute;
      bottom: 16px;
      left: 16px;
      right: 16px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(4px);
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 12px 16px;
      box-shadow: var(--shadow-lg);
      z-index: 500;
    }

    .fs-xs { font-size: 11.5px; }
    .btn-xs { padding: 2px 6px; font-size: 11px; }

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
export class ScheduleCoordinatorComponent implements OnInit, AfterViewInit, OnDestroy {
  patrolService = inject(PatrolService);
  projectService = inject(ProjectService);

  currentYear = 2026;
  currentMonth = 9; // Tháng 10 (0-indexed: 9 = October)
  selectedDate = '2026-10-13';

  // Modal State
  showAddModal = false;
  showChangeDateModal = false;
  targetSchedule?: PatrolSchedule;
  newDateValue = '';

  predefinedRoutes = [
    {
      name: 'Tuyến Phố đi bộ Nguyễn Huệ',
      start: 'UBND TP (Lê Thánh Tôn)',
      end: 'Cột cờ Thủ Ngữ (Bến Bạch Đằng)',
      coords: [
        [10.77660, 106.70180],
        [10.77584, 106.70281],
        [10.77495, 106.70360],
        [10.77390, 106.70450],
        [10.77250, 106.70650]
      ] as [number, number][]
    },
    {
      name: 'Tuyến Tôn Đức Thắng - Ven sông Sài Gòn',
      start: 'Đầu cầu Ba Son',
      end: 'Cầu Khánh Hội',
      coords: [
        [10.77710, 106.70610],
        [10.77490, 106.70690],
        [10.77430, 106.70710],
        [10.77250, 106.70650]
      ] as [number, number][]
    },
    {
      name: 'Tuyến Trục Nam Kỳ Khởi Nghĩa - Hàm Nghi',
      start: 'Ngã tư Lê Lợi - Nam Kỳ Khởi Nghĩa',
      end: 'Chợ Bến Thành',
      coords: [
        [10.77720, 106.69910],
        [10.77650, 106.69980],
        [10.77240, 106.69820]
      ] as [number, number][]
    },
    {
      name: 'Tuyến Đại lộ Lê Lợi (Khu vực Ga ngầm Metro)',
      start: 'Nhà Hát Thành Phố',
      end: 'Chợ Bến Thành',
      coords: [
        [10.77480, 106.70130],
        [10.77430, 106.70200],
        [10.77350, 106.70050],
        [10.77240, 106.69820]
      ] as [number, number][]
    }
  ];

  newScheduleForm = {
    date: '2026-10-13',
    shift: 'SANG' as ShiftType,
    routeIndex: 0,
    teamId: 'team-1',
    notes: 'Tập trung tuần tra phát hiện sự cố hệ thống chiếu sáng và nắp hố ga thu nước.'
  };

  // Leaflet Route Map
  @ViewChild('routeMapContainer') routeMapContainer?: ElementRef;
  private map?: L.Map;
  private routePolyline?: L.Polyline;
  private markers: L.Marker[] = [];

  ngOnInit() {
    if (!this.patrolService.selectedScheduleId() && this.schedulesOnDate.length > 0) {
      this.patrolService.selectedScheduleId.set(this.schedulesOnDate[0].id);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 300);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  get currentSchedule(): PatrolSchedule | undefined {
    const id = this.patrolService.selectedScheduleId();
    return this.patrolService.schedules().find(s => s.id === id);
  }

  get schedulesOnDate(): PatrolSchedule[] {
    return this.patrolService.schedules().filter(s => s.date === this.selectedDate);
  }

  get calendarCells() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);

    // Bắt đầu từ Thứ 2 (1 = Mon, 0 = Sun)
    let startDayOfWeek = firstDay.getDay();
    if (startDayOfWeek === 0) startDayOfWeek = 7; // Sunday là 7

    const cells: {
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      scheduleCount: number;
    }[] = [];

    // Ngày tháng trước điền vào
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i > 0; i--) {
      const d = prevMonthLastDay - i + 1;
      const m = this.currentMonth === 0 ? 12 : this.currentMonth;
      const y = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateString: dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: false,
        scheduleCount: this.getScheduleCount(dateStr)
      });
    }

    // Ngày tháng hiện tại
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === '2026-10-13';
      cells.push({
        dateString: dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday,
        scheduleCount: this.getScheduleCount(dateStr)
      });
    }

    // Ngày tháng sau điền cho đủ 35 hoặc 42 ô
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const m = this.currentMonth === 11 ? 1 : this.currentMonth + 2;
      const y = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateString: dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: false,
        scheduleCount: this.getScheduleCount(dateStr)
      });
    }

    return cells;
  }

  private getScheduleCount(dateStr: string): number {
    return this.patrolService.schedules().filter(s => s.date === dateStr).length;
  }

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  selectToday() {
    this.currentYear = 2026;
    this.currentMonth = 9;
    this.selectedDate = '2026-10-13';
    this.onDateSelect('2026-10-13');
  }

  onDateSelect(dateStr: string) {
    this.selectedDate = dateStr;
    const list = this.schedulesOnDate;
    if (list.length > 0) {
      this.selectSchedule(list[0]);
    }
  }

  selectSchedule(sch: PatrolSchedule) {
    this.patrolService.selectedScheduleId.set(sch.id);
    this.renderScheduleOnMap(sch);
  }

  quickCheckIn(scheduleId: string, personnelId: string) {
    this.patrolService.checkInSchedulePersonnel(scheduleId, personnelId);
  }

  formatDateVN(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  getShiftLabel(shift: ShiftType): string {
    switch (shift) {
      case 'SANG': return 'Sáng (06:00 - 11:30)';
      case 'CHIEU': return 'Chiều (13:00 - 17:30)';
      case 'TOI': return 'Tối (18:00 - 22:30)';
    }
  }

  getScheduleStatusLabel(st: string): string {
    switch (st) {
      case 'PLANNED': return 'Đã lên lịch';
      case 'IN_PROGRESS': return 'Đang đi tuần';
      case 'COMPLETED': return 'Hoàn thành';
      default: return 'Đã hủy';
    }
  }

  // Leaflet Map Logic
  private initMap() {
    if (!this.routeMapContainer || this.map) return;

    this.map = L.map(this.routeMapContainer.nativeElement).setView([10.7745, 106.7025], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);

    if (this.currentSchedule) {
      this.renderScheduleOnMap(this.currentSchedule);
    }
  }

  private renderScheduleOnMap(sch: PatrolSchedule) {
    if (!this.map) return;

    // Clear existing
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
    }
    this.markers.forEach(m => this.map?.removeLayer(m));
    this.markers = [];

    if (!sch.routeCoordinates || sch.routeCoordinates.length === 0) return;

    // Vẽ Polyline tuyến đường
    this.routePolyline = L.polyline(sch.routeCoordinates, {
      color: '#2563eb',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8'
    }).addTo(this.map);

    // Zoom fit bounds
    this.map.fitBounds(this.routePolyline.getBounds(), { padding: [50, 50] });

    // Marker Điểm xuất phát
    const startCoord = sch.routeCoordinates[0];
    const startIcon = L.divIcon({
      className: 'start-marker',
      html: `
        <div style="background-color: #10b981; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
          A
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    const startMarker = L.marker(startCoord, { icon: startIcon })
      .addTo(this.map)
      .bindPopup(`<b>Điểm xuất phát:</b><br>${sch.startPointName}`);
    this.markers.push(startMarker);

    // Marker Điểm kết thúc
    const endCoord = sch.routeCoordinates[sch.routeCoordinates.length - 1];
    const endIcon = L.divIcon({
      className: 'end-marker',
      html: `
        <div style="background-color: #ef4444; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
          B
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    const endMarker = L.marker(endCoord, { icon: endIcon })
      .addTo(this.map)
      .bindPopup(`<b>Điểm kết thúc:</b><br>${sch.endPointName}`);
    this.markers.push(endMarker);

    // Markers các điểm checkpoints trung gian
    sch.routeCoordinates.slice(1, -1).forEach((coord, idx) => {
      const cpIcon = L.divIcon({
        className: 'cp-marker',
        html: `
          <div style="background-color: #f59e0b; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.3);">
            ${idx + 1}
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
      const cpMarker = L.marker(coord, { icon: cpIcon })
        .addTo(this.map!)
        .bindPopup(`<b>Điểm kiểm tra #${idx + 1} dọc tuyến ${sch.routeName}</b>`);
      this.markers.push(cpMarker);
    });
  }

  // Modal Handlers
  openAddScheduleModal() {
    this.newScheduleForm.date = this.selectedDate;
    this.showAddModal = true;
  }

  onRouteChange() {
    // Auto sync
  }

  submitAddSchedule() {
    const route = this.predefinedRoutes[this.newScheduleForm.routeIndex];
    const team = this.patrolService.teams().find(t => t.id === this.newScheduleForm.teamId);

    this.patrolService.addSchedule({
      date: this.newScheduleForm.date,
      shift: this.newScheduleForm.shift,
      routeName: route.name,
      startPointName: route.start,
      endPointName: route.end,
      routeCoordinates: route.coords,
      teamId: this.newScheduleForm.teamId,
      teamName: team?.name || 'Đội tuần kiểm',
      assignedPersonnel: [
        { id: 'ns-1', name: 'Trần Đình Nam', phone: '0903.112.456', checkedIn: true },
        { id: 'ns-2', name: 'Nguyễn Văn Minh', phone: '0918.445.890', checkedIn: false }
      ],
      checkpointsTotal: route.coords.length,
      notes: this.newScheduleForm.notes
    });

    this.showAddModal = false;
    this.selectedDate = this.newScheduleForm.date;
  }

  openChangeDateModal(sch: PatrolSchedule) {
    this.targetSchedule = sch;
    this.newDateValue = sch.date;
    this.showChangeDateModal = true;
  }

  submitChangeDate() {
    if (!this.targetSchedule || !this.newDateValue) return;
    this.patrolService.updateScheduleDate(this.targetSchedule.id, this.newDateValue);
    this.showChangeDateModal = false;
    this.selectedDate = this.newDateValue;
  }

  deleteSchedule(sch: PatrolSchedule) {
    if (confirm(`Bạn có chắc chắn muốn hủy ca tuần kiểm tuyến "${sch.routeName}" ngày ${sch.date}?`)) {
      this.patrolService.deleteSchedule(sch.id);
    }
  }
}
