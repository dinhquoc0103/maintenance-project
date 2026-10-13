import { Component, inject, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatrolService } from '../../../../core/services/patrol.service';
import { ProjectService } from '../../../../core/services/project.service';
import { AssetCondition } from '../../../../core/models/patrol.model';

@Component({
  selector: 'app-mobile-patrol-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mobile-sim-page">
      <!-- Cột Trái: Giới thiệu nghiệp vụ Mobile App -->
      <div class="sim-guide-col">
        <div class="guide-card">
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-success p-2 fs-6"><i class="bi bi-phone-fill"></i></span>
            <div>
              <h3 class="m-0 fw-bold">Mô Phỏng Ứng Dụng Di Động Tuần Kiểm</h3>
              <p class="m-0 text-muted fs-xs">Luồng 2: Lập Lịch & Thực Thi Hiện Trường (Mobile App GPS)</p>
            </div>
          </div>

          <div class="alert alert-info fs-xs mb-3">
            <i class="bi bi-broadcast"></i> <strong>Tính năng thực địa:</strong> Nhân viên tuần kiểm sử dụng điện thoại ngoài hiện trường để:
            <ul class="m-0 ps-3 mt-1">
              <li>Định vị tọa độ GPS chính xác tại vị trí đang đứng</li>
              <li>Tra cứu mã tài sản hạ tầng số hóa gần nhất (Asset_ID)</li>
              <li>Chụp ảnh hiện trạng sự cố và gửi tức thì về Bàn làm việc của Cán bộ</li>
            </ul>
          </div>

          <div class="guide-steps-list">
            <div class="step-item">
              <span class="step-num">1</span>
              <div>
                <strong class="d-block">Chọn loại sự cố hạ tầng:</strong>
                <span class="text-muted fs-xs">Phân loại theo Chiếu sáng, Cây xanh, Thoát nước hoặc Mặt đường.</span>
              </div>
            </div>

            <div class="step-item">
              <span class="step-num">2</span>
              <div>
                <strong class="d-block">Chụp / Chọn ảnh hiện trường:</strong>
                <span class="text-muted fs-xs">Hệ thống cung cấp sẵn các mẫu ảnh sự cố thực tế để test nhanh.</span>
              </div>
            </div>

            <div class="step-item">
              <span class="step-num">3</span>
              <div>
                <strong class="d-block">Bấm "Gửi Sự Cố Lên Hệ Thống":</strong>
                <span class="text-muted fs-xs">Dữ liệu sẽ lập tức xuất hiện tại <strong>Bàn Làm Việc Xử Lý Sự Cố</strong> của Cán bộ!</span>
              </div>
            </div>
          </div>

          <div class="card p-3 bg-light border-0 mt-3">
            <div class="d-flex align-items-center justify-content-between">
              <span class="fs-xs fw-bold text-muted">Nhân viên đang đăng nhập:</span>
              <span class="badge bg-primary">Trần Đình Nam (Tổ 1)</span>
            </div>
            <div class="fs-xs text-muted mt-1">
              <i class="bi bi-geo-alt-fill text-danger"></i> Đang tuần tra: Tuyến Phố đi bộ Nguyễn Huệ
            </div>
          </div>
        </div>
      </div>

      <!-- Cột Phải: Khung màn hình Điện Thoại Di Động Mockup -->
      <div class="sim-phone-col">
        <div class="phone-mockup">
          <!-- Phone Speaker & Camera Notch -->
          <div class="phone-notch">
            <span class="camera-lens"></span>
            <span class="speaker-bar"></span>
          </div>

          <!-- Phone Screen Container -->
          <div class="phone-screen">
            <!-- Mobile App Top Bar -->
            <div class="mobile-app-header">
              <div class="mobile-time">08:35</div>
              <div class="mobile-status-icons">
                <i class="bi bi-reception-4"></i>
                <i class="bi bi-wifi"></i>
                <i class="bi bi-battery-full"></i>
              </div>
            </div>

            <div class="app-nav-title">
              <i class="bi bi-camera-fill me-1 text-warning"></i>
              <span>Ghi Nhận Sự Cố Hiện Trường</span>
            </div>

            <!-- Form Mobile Báo Cáo -->
            <div class="mobile-form-scroll">
              <!-- GPS Auto-detected Bar -->
              <div class="mobile-gps-card">
                <div class="d-flex justify-content-between align-items-center">
                  <div class="d-flex align-items-center gap-1 text-success fw-bold fs-xs">
                    <i class="bi bi-geo-alt-fill"></i>
                    <span>GPS Độ chính xác cao (3m)</span>
                  </div>
                  <button class="btn-refresh-gps" (click)="refreshGPS()" title="Cập nhật GPS">
                    <i class="bi bi-arrow-clockwise"></i>
                  </button>
                </div>
                <div class="coords-display font-monospace">{{ form.lat.toFixed(5) }}, {{ form.lng.toFixed(5) }}</div>
                <div class="address-display text-muted fs-xs">{{ form.address }}</div>
              </div>

              <!-- Tiêu đề sự cố -->
              <div class="mobile-field mt-2">
                <label class="mobile-label">Tiêu đề sự cố (*):</label>
                <input
                  type="text"
                  class="mobile-input"
                  [(ngModel)]="form.title"
                  placeholder="Nhập vắn tắt hiện trạng..."
                />
              </div>

              <!-- Danh mục loại sự cố -->
              <div class="mobile-field mt-2">
                <label class="mobile-label">Loại vấn đề hạ tầng (*):</label>
                <select class="mobile-select" [(ngModel)]="form.categoryId" (ngModelChange)="onCategoryChange()">
                  <option *ngFor="let cat of patrolService.categories()" [value]="cat.id">
                    [{{ cat.code }}] {{ cat.name }}
                  </option>
                </select>
              </div>

              <!-- Gán tài sản hạ tầng gần nhất -->
              <div class="mobile-field mt-2">
                <label class="mobile-label">Tài sản hạ tầng liên quan (Asset):</label>
                <select class="mobile-select" [(ngModel)]="form.assetId" (ngModelChange)="onAssetChange()">
                  <option value="">-- Không xác định được mã tài sản --</option>
                  <option *ngFor="let ast of candidateAssets" [value]="ast.id">
                    [{{ ast.code }}] {{ ast.name }} ({{ ast.route }})
                  </option>
                </select>
              </div>

              <!-- Đánh giá hiện trạng tài sản (Lưu vết theo báo cáo) -->
              <div class="mobile-field mt-2">
                <label class="mobile-label">Đánh giá hiện trạng tài sản (*):</label>
                <select class="mobile-select" [(ngModel)]="form.assetCondition">
                  <option value="DAMAGED">🔴 Hư hỏng (Cần xử lý)</option>
                  <option value="NEEDS_REPLACEMENT">🟠 Cần thay thế mới</option>
                  <option value="NORMAL">🔵 Bình thường (Cần theo dõi)</option>
                  <option value="GOOD">🟢 Hoạt động tốt</option>
                </select>
              </div>

              <!-- Chọn mẫu ảnh hiện trường -->
              <div class="mobile-field mt-2">
                <label class="mobile-label">Ảnh chụp thực tế hiện trường (*):</label>
                <div class="sample-photos-row">
                  <div
                    *ngFor="let sample of samplePhotos"
                    class="sample-photo-chip"
                    [class.selected]="form.photoUrl === sample.url"
                    (click)="form.photoUrl = sample.url"
                  >
                    <img [src]="sample.url" [alt]="sample.title" />
                    <span>{{ sample.title }}</span>
                  </div>
                </div>

                <!-- Preview ảnh đang chọn -->
                <div class="current-photo-preview mt-2" *ngIf="form.photoUrl">
                  <img [src]="form.photoUrl" alt="Preview sự cố" />
                  <span class="preview-badge"><i class="bi bi-camera"></i> Ảnh đính kèm</span>
                </div>
              </div>

              <!-- Mô tả chi tiết -->
              <div class="mobile-field mt-2">
                <label class="mobile-label">Mô tả hiện trạng & mức độ nguy hiểm:</label>
                <textarea
                  class="mobile-textarea"
                  rows="2"
                  [(ngModel)]="form.description"
                  placeholder="Ghi chú chi tiết cho Cán bộ quản lý..."
                ></textarea>
              </div>

              <!-- Nút Gửi Báo Cáo Lên Hệ Thống -->
              <button
                class="btn-submit-mobile mt-3"
                [disabled]="!form.title.trim() || !form.photoUrl"
                (click)="submitMobileReport()"
              >
                <i class="bi bi-send-fill me-1"></i>
                <span>GỬI BÁO CÁO VỀ MÁY CHỦ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mobile-sim-page {
      display: flex;
      height: calc(100vh - 160px);
      gap: 24px;
      padding: 10px;
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-lg);
      overflow-y: auto;
    }

    .sim-guide-col {
      flex: 1;
      max-width: 500px;

      .guide-card {
        padding: 16px;
      }
    }

    .guide-steps-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .step-item {
        display: flex;
        gap: 12px;
        align-items: flex-start;

        .step-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--primary-600);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
          flex-shrink: 0;
        }
      }
    }

    /* PHONE MOCKUP */
    .sim-phone-col {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f1f5f9;
      border-radius: 12px;
      padding: 20px;
    }

    .phone-mockup {
      width: 340px;
      height: 600px;
      background: #1e293b;
      border-radius: 36px;
      padding: 10px;
      box-shadow: 0 20px 40px -15px rgba(0,0,0,0.4), inset 0 0 2px 2px rgba(255,255,255,0.2);
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .phone-notch {
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      .camera-lens {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #0f172a;
      }

      .speaker-bar {
        width: 48px;
        height: 4px;
        border-radius: 2px;
        background: #334155;
      }
    }

    .phone-screen {
      flex: 1;
      background: white;
      border-radius: 26px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .mobile-app-header {
      padding: 6px 16px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 600;
      color: var(--gray-700);
      background: #f8fafc;

      .mobile-status-icons {
        display: flex;
        gap: 6px;
      }
    }

    .app-nav-title {
      background: #1e3a8a;
      color: white;
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 700;
      text-align: center;
    }

    .mobile-form-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
    }

    .mobile-gps-card {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 8px;
      padding: 8px 10px;

      .btn-refresh-gps {
        background: none;
        border: none;
        color: #059669;
        cursor: pointer;
      }

      .coords-display {
        font-size: 11px;
        font-weight: 700;
        color: #047857;
      }

      .address-display {
        margin-top: 2px;
      }
    }

    .mobile-field {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .mobile-label {
        font-size: 11px;
        font-weight: 700;
        color: var(--gray-700);
      }

      .mobile-input, .mobile-select, .mobile-textarea {
        width: 100%;
        padding: 6px 10px;
        border: 1px solid var(--gray-300);
        border-radius: 6px;
        font-size: 12px;
      }
    }

    .sample-photos-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;

      .sample-photo-chip {
        border: 2px solid transparent;
        border-radius: 6px;
        overflow: hidden;
        cursor: pointer;
        text-align: center;
        background: #f8fafc;

        img {
          width: 100%;
          height: 48px;
          object-fit: cover;
          display: block;
        }

        span {
          font-size: 9.5px;
          display: block;
          padding: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &.selected {
          border-color: var(--primary-600);
          box-shadow: 0 0 0 1px var(--primary-600);
        }
      }
    }

    .current-photo-preview {
      position: relative;
      border-radius: 6px;
      overflow: hidden;
      height: 90px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .preview-badge {
        position: absolute;
        bottom: 4px;
        right: 4px;
        background: rgba(0,0,0,0.7);
        color: white;
        font-size: 9px;
        padding: 2px 6px;
        border-radius: 4px;
      }
    }

    .btn-submit-mobile {
      width: 100%;
      background: #10b981;
      color: white;
      border: none;
      padding: 10px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(16,185,129,0.25);
      transition: all 0.15s ease;

      &:hover:not(:disabled) {
        background: #059669;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .fs-xs { font-size: 11px; }
  `]
})
export class MobilePatrolSimulatorComponent {
  patrolService = inject(PatrolService);
  projectService = inject(ProjectService);

  @Output() issueReported = new EventEmitter<void>();

  samplePhotos = [
    {
      title: 'Đèn chập cháy',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=700&q=80'
    },
    {
      title: 'Cây gãy cành',
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=700&q=80'
    },
    {
      title: 'Hố ga nứt vỡ',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=700&q=80'
    }
  ];

  form = {
    title: 'Mặt đường vỉa hè lát đá bị sụt lún sâu 10cm',
    categoryId: 'cat-4',
    assetId: 'ast-24',
    assetCondition: 'DAMAGED' as AssetCondition,
    description: 'Khoảng 4m2 đá lát vỉa hè bị sụt lún sau trận mưa lớn đêm qua, gây đọng nước sâu và nguy hiểm cho người đi bộ.',
    photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&q=80',
    lat: 10.77450,
    lng: 106.70320,
    address: 'Số 42 Phố đi bộ Nguyễn Huệ, P. Bến Nghé, Quận 1',
    routeName: 'Tuyến Nguyễn Huệ',
    reportedByName: 'Trần Đình Nam (Tổ 1)'
  };

  get candidateAssets() {
    return this.projectService.masterAssets().slice(0, 10);
  }

  onCategoryChange() {
    const cat = this.patrolService.categories().find(c => c.id === this.form.categoryId);
    if (cat) {
      this.form.title = `Sự cố: ${cat.name}`;
    }
  }

  onAssetChange() {
    const ast = this.projectService.masterAssets().find(a => a.id === this.form.assetId);
    if (ast) {
      this.form.lat = ast.lat;
      this.form.lng = ast.lng;
      this.form.address = ast.address;
      this.form.routeName = ast.route;
    }
  }

  refreshGPS() {
    // Add tiny random offset to simulate actual walking
    const deltaLat = (Math.random() - 0.5) * 0.001;
    const deltaLng = (Math.random() - 0.5) * 0.001;
    this.form.lat = +(10.7745 + deltaLat).toFixed(5);
    this.form.lng = +(10.7732 + deltaLng).toFixed(5);
  }

  submitMobileReport() {
    this.patrolService.simulateReportFromMobile({
      title: this.form.title,
      description: this.form.description,
      categoryId: this.form.categoryId,
      assetId: this.form.assetId || undefined,
      assetCondition: this.form.assetCondition,
      photoUrl: this.form.photoUrl,
      lat: this.form.lat,
      lng: this.form.lng,
      address: this.form.address,
      routeName: this.form.routeName,
      reportedByName: this.form.reportedByName
    });

    this.issueReported.emit();
  }
}
