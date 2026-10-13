import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';
import { MaintenanceTask, Asset } from '../../core/models/maintenance.model';

@Component({
  selector: 'app-mobile-contractor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="mobile-simulator-layout">
      <!-- Left side: Simulation Controls & Instructions -->
      <div class="control-panel">
        <div class="app-card">
          <div class="card-badge">MÔ PHỎNG NGHIỆP VỤ 4</div>
          <h2 class="card-title"><i class="bi bi-phone"></i> Ứng Dụng Di Động Nhà Thầu (Hiện Trường)</h2>
          <p class="text-muted fs-sm">
            Giao diện dành riêng cho công nhân, thợ kỹ thuật và đội trưởng ngoài hiện trường.
            Khi mở Task, bản đồ <strong>chỉ highlight các điểm tài sản thuộc Task đó</strong> để thợ định vị và thi công.
          </p>

          <div class="task-selector-box mt-3">
            <label class="form-label font-bold">Chọn Task công việc đang mở:</label>
            <select
              class="form-select"
              [(ngModel)]="selectedTaskId"
              (ngModelChange)="onTaskChange()"
            >
              <option *ngFor="let t of allTasks" [value]="t.id">
                [{{ t.code }}] {{ t.title }} ({{ t.assetIds.length }} tài sản)
              </option>
            </select>
          </div>

          <div class="task-details-meta mt-3" *ngIf="currentTask">
            <div class="meta-item">
              <span class="label">Đơn vị thi công:</span>
              <span class="val font-semibold">{{ currentTask.contractor }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Tổ đội hiện trường:</span>
              <span class="val font-semibold text-primary">{{ currentTask.assignedTeam }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Hạn hoàn thành:</span>
              <span class="val text-danger">{{ currentTask.deadline | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Tiến độ khối lượng:</span>
              <span class="val font-bold">{{ currentTask.progress }}% ({{ currentTask.completedAssetIds.length }}/{{ currentTask.assetIds.length }} đã xong)</span>
            </div>
          </div>

          <div class="instruction-box mt-4">
            <h4 class="font-semibold fs-sm mb-2"><i class="bi bi-lightbulb text-warning"></i> Thao tác của thợ tại hiện trường:</h4>
            <ol class="fs-xs text-muted ps-3">
              <li>Mở điện thoại, định vị GPS các điểm cột đèn/cây xanh/hố ga cần xử lý trên bản đồ.</li>
              <li>Tại mỗi tọa độ, bấm nút <strong>"Chụp ảnh"</strong> để ghi nhận minh chứng trước/sau thi công.</li>
              <li>Bấm nút <strong>"Hoàn thành"</strong> để cập nhật trực tiếp tiến độ lên hệ thống và đưa vào Báo cáo nghiệm thu tự động.</li>
            </ol>
          </div>

          <div class="mt-4">
            <a routerLink="/projects" class="btn btn-secondary w-100">
              <i class="bi bi-arrow-left"></i> Quay lại Quản lý Dự án
            </a>
          </div>
        </div>
      </div>

      <!-- Right side: Smartphone Device Shell -->
      <div class="phone-viewport-container">
        <div class="smartphone-frame">
          <div class="phone-notch">
            <div class="camera-sensor"></div>
            <div class="speaker-grill"></div>
          </div>

          <!-- Smartphone Screen Content -->
          <div class="phone-screen" *ngIf="currentTask">
            <!-- App Header -->
            <div class="phone-topbar">
              <div class="status-time">09:41</div>
              <div class="status-icons">
                <i class="bi bi-wifi"></i>
                <i class="bi bi-reception-4"></i>
                <i class="bi bi-battery-full"></i>
              </div>
            </div>

            <div class="phone-app-header">
              <div class="app-brand">
                <i class="bi bi-tools"></i>
                <span>THỢ HIỆN TRƯỜNG</span>
              </div>
              <span class="badge badge-success">GPS Bật</span>
            </div>

            <!-- Task Summary in Phone -->
            <div class="phone-task-banner">
              <div class="code">{{ currentTask.code }}</div>
              <div class="title">{{ currentTask.title }}</div>
              <div class="progress-wrap">
                <div class="phone-progress-bar">
                  <div class="phone-progress-fill" [style.width.%]="currentTask.progress"></div>
                </div>
                <span class="phone-progress-text">{{ currentTask.progress }}%</span>
              </div>
            </div>

            <!-- Interactive Map highlighting task assets -->
            <div class="phone-map-container">
              <div #mobileMapContainer class="mobile-leaflet-map"></div>
              <div class="map-badge-overlay">
                <i class="bi bi-geo-alt-fill text-danger"></i>
                <span>Chỉ hiển thị {{ currentTask.assetIds.length }} điểm của Task</span>
              </div>
            </div>

            <!-- List of Task Assets with "Chụp ảnh" & "Hoàn thành" buttons -->
            <div class="phone-assets-list">
              <div class="list-title">Danh sách tọa độ thi công:</div>

              <div
                *ngFor="let ast of taskAssets"
                class="mobile-asset-card"
                [class.completed]="currentTask.completedAssetIds.includes(ast.id)"
              >
                <div class="card-head">
                  <span class="code">{{ ast.code }}</span>
                  <span
                    class="badge"
                    [class.badge-success]="currentTask.completedAssetIds.includes(ast.id)"
                    [class.badge-warning]="!currentTask.completedAssetIds.includes(ast.id)"
                  >
                    {{ currentTask.completedAssetIds.includes(ast.id) ? '✓ Đã xong' : 'Đang xử lý' }}
                  </span>
                </div>

                <div class="name">{{ ast.name }}</div>
                <div class="address"><i class="bi bi-geo"></i> {{ ast.address }}</div>
                <div class="coords fs-xxs text-muted">GPS: {{ ast.lat }}, {{ ast.lng }}</div>

                <!-- Proof photo thumbnail if taken -->
                <div class="proof-photo-thumbnail" *ngIf="getAssetPhoto(ast.id)">
                  <img [src]="getAssetPhoto(ast.id)?.url" alt="Minh chứng" />
                  <span class="photo-tag"><i class="bi bi-check2"></i> Đã chụp ảnh</span>
                </div>

                <!-- 2 Actions: "Chụp ảnh" & "Hoàn thành" -->
                <div class="card-actions">
                  <button
                    class="btn btn-sm btn-secondary flex-1"
                    (click)="openCameraModal(ast)"
                  >
                    <i class="bi bi-camera-fill text-primary"></i>
                    <span>{{ getAssetPhoto(ast.id) ? 'Chụp lại' : 'Chụp ảnh' }}</span>
                  </button>

                  <button
                    class="btn btn-sm flex-1"
                    [class.btn-success]="currentTask.completedAssetIds.includes(ast.id)"
                    [class.btn-primary]="!currentTask.completedAssetIds.includes(ast.id)"
                    (click)="markAssetCompleted(ast)"
                  >
                    <i class="bi bi-check-lg"></i>
                    <span>{{ currentTask.completedAssetIds.includes(ast.id) ? 'Đã xong' : 'Hoàn thành' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="phone-home-indicator"></div>
        </div>
      </div>

      <!-- CAMERA / PHOTO CAPTURE MODAL -->
      <div class="modal-backdrop" *ngIf="isCameraModalOpen && activeCameraAsset" (click)="closeCameraModal()">
        <div class="modal-content modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="bi bi-camera text-primary"></i> Chụp Ảnh Minh Chứng Hiện Trường</h3>
            <button class="close-btn" (click)="closeCameraModal()"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <div class="simulated-viewfinder">
              <img [src]="capturedPhotoUrl" alt="Camera preview" class="camera-preview-img" />
              <div class="viewfinder-crosshair"></div>
              <div class="camera-osd">
                <div>GPS: {{ activeCameraAsset.lat }}, {{ activeCameraAsset.lng }}</div>
                <div>TIME: {{ currentTimestamp }}</div>
                <div>ASSET: {{ activeCameraAsset.code }}</div>
              </div>
            </div>

            <div class="camera-swatches mt-3">
              <label class="form-label fs-xs font-semibold">Chọn ảnh chụp mẫu hiện trường:</label>
              <div class="swatch-list">
                <button
                  type="button"
                  class="swatch-btn"
                  *ngFor="let sample of samplePhotos"
                  (click)="capturedPhotoUrl = sample.url; photoNote = sample.desc"
                >
                  <img [src]="sample.url" alt="Sample" />
                  <span>{{ sample.name }}</span>
                </button>
              </div>
            </div>

            <div class="form-group mt-3">
              <label class="form-label fs-xs">Ghi chú kỹ thuật thợ:</label>
              <input
                type="text"
                class="form-control form-control-sm"
                [(ngModel)]="photoNote"
                placeholder="VD: Đã lắp bóng đèn LED mới, kiểm tra an toàn"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeCameraModal()">Hủy</button>
            <button class="btn btn-success" (click)="saveCapturedPhoto()">
              <i class="bi bi-check-circle"></i> Lưu Ảnh & Hoàn Tất
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mobile-simulator-layout {
      display: flex;
      gap: 32px;
      padding: 24px;
      max-width: 1300px;
      margin: 0 auto;
      align-items: flex-start;
    }

    .control-panel {
      flex: 1;
      min-width: 380px;

      .card-badge {
        display: inline-block;
        font-size: 11px;
        font-weight: 700;
        color: #047857;
        background: #d1fae5;
        padding: 2px 8px;
        border-radius: 4px;
        margin-bottom: 8px;
      }

      .card-title {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 6px;
      }

      .task-details-meta {
        background: var(--gray-50);
        border: 1px solid var(--gray-200);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;

        .meta-item {
          display: flex;
          justify-content: space-between;
          font-size: 12.5px;
          .label { color: var(--gray-500); }
        }
      }

      .instruction-box {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 8px;
        padding: 14px;
      }
    }

    /* Smartphone Frame */
    .phone-viewport-container {
      flex: 1;
      display: flex;
      justify-content: center;
    }

    .smartphone-frame {
      width: 380px;
      height: 780px;
      background: #0f172a;
      border-radius: 44px;
      border: 8px solid #334155;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45);
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .phone-notch {
        height: 24px;
        background: #0f172a;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        z-index: 100;

        .camera-sensor {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #1e293b;
        }
        .speaker-grill {
          width: 48px;
          height: 4px;
          border-radius: 2px;
          background: #1e293b;
        }
      }

      .phone-home-indicator {
        height: 18px;
        background: #0f172a;
        display: flex;
        align-items: center;
        justify-content: center;

        &::after {
          content: '';
          width: 120px;
          height: 4px;
          background: #64748b;
          border-radius: 2px;
        }
      }
    }

    /* Phone Screen Content */
    .phone-screen {
      flex: 1;
      background: #f8fafc;
      overflow-y: auto;
      display: flex;
      flex-direction: column;

      .phone-topbar {
        display: flex;
        justify-content: space-between;
        padding: 6px 16px;
        font-size: 11px;
        font-weight: 600;
        color: #0f172a;
      }

      .phone-app-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        background: #2563eb;
        color: white;

        .app-brand {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.05em;
        }
      }

      .phone-task-banner {
        background: #1e40af;
        color: white;
        padding: 10px 16px 14px 16px;

        .code { font-size: 11px; opacity: 0.8; font-family: monospace; }
        .title { font-size: 13px; font-weight: 600; margin: 2px 0 6px 0; }

        .progress-wrap {
          display: flex;
          align-items: center;
          gap: 8px;

          .phone-progress-bar {
            flex: 1;
            height: 6px;
            background: rgba(255,255,255,0.3);
            border-radius: 3px;
            overflow: hidden;

            .phone-progress-fill {
              height: 100%;
              background: #10b981;
            }
          }

          .phone-progress-text { font-size: 11px; font-weight: 700; }
        }
      }

      .phone-map-container {
        position: relative;
        height: 220px;

        .mobile-leaflet-map {
          height: 100%;
          width: 100%;
        }

        .map-badge-overlay {
          position: absolute;
          bottom: 8px;
          left: 8px;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(2px);
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }

      .phone-assets-list {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;

        .list-title {
          font-weight: 700;
          font-size: 12.5px;
          color: var(--gray-700);
          margin-bottom: 2px;
        }

        .mobile-asset-card {
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: 8px;
          padding: 10px;
          box-shadow: var(--shadow-sm);

          &.completed {
            border-color: #86efac;
            background: #f0fdf4;
          }

          .card-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
            .code { font-weight: 700; font-size: 11.5px; font-family: monospace; }
          }

          .name { font-weight: 600; font-size: 12.5px; color: var(--gray-900); }
          .address { font-size: 11.5px; color: var(--gray-600); margin-top: 2px; }
          .coords { font-size: 10.5px; margin-top: 2px; }

          .proof-photo-thumbnail {
            margin-top: 6px;
            position: relative;
            border-radius: 4px;
            overflow: hidden;
            height: 90px;

            img { width: 100%; height: 100%; object-fit: cover; }
            .photo-tag {
              position: absolute;
              bottom: 4px;
              left: 4px;
              background: rgba(16, 185, 129, 0.9);
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
            }
          }

          .card-actions {
            display: flex;
            gap: 8px;
            margin-top: 8px;
          }
        }
      }
    }

    /* Simulated Camera Viewfinder */
    .simulated-viewfinder {
      position: relative;
      height: 240px;
      border-radius: 8px;
      overflow: hidden;
      background: #000;

      .camera-preview-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .camera-osd {
        position: absolute;
        bottom: 8px;
        left: 8px;
        color: #22c55e;
        font-family: monospace;
        font-size: 11px;
        background: rgba(0,0,0,0.6);
        padding: 4px 8px;
        border-radius: 4px;
        line-height: 1.3;
      }
    }

    .camera-swatches {
      .swatch-list {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;

        .swatch-btn {
          border: 1px solid var(--gray-300);
          border-radius: 6px;
          background: white;
          padding: 4px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 90px;

          img { width: 80px; height: 50px; object-fit: cover; border-radius: 4px; }
          span { font-size: 10px; color: var(--gray-700); }
          &:hover { border-color: var(--primary-500); }
        }
      }
    }
  `]
})
export class MobileContractorComponent implements OnInit, OnDestroy, AfterViewInit {
  route = inject(ActivatedRoute);
  projectService = inject(ProjectService);
  toastService = inject(ToastService);

  selectedTaskId = 't-1';
  currentTask: MaintenanceTask | null = null;
  taskAssets: Asset[] = [];

  private mobileMap?: L.Map;
  private markers: L.Marker[] = [];

  // Camera modal state
  isCameraModalOpen = false;
  activeCameraAsset: Asset | null = null;
  capturedPhotoUrl = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80';
  photoNote = 'Đã hoàn tất thay thế và kiểm tra an toàn';
  currentTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  samplePhotos = [
    {
      name: 'Đèn LED sáng',
      url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
      desc: 'Thay bóng LED 150W, đo điện áp 220V ổn định'
    },
    {
      name: 'Tỉa cành cây',
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80',
      desc: 'Hạ cành nguy hiểm sát vỉa hè an toàn'
    },
    {
      name: 'Sơn trụ đèn',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
      desc: 'Sơn chống rỉ và dán decal phản quang'
    },
    {
      name: 'Trồng hoa dải cỏ',
      url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80',
      desc: 'Trồng dặm hoa và tưới nước tạo ẩm'
    }
  ];

  @ViewChild('mobileMapContainer') mobileMapContainer?: ElementRef;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['taskId']) {
        this.selectedTaskId = params['taskId'];
      }
      this.loadTask();
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMobileMap(), 300);
  }

  ngOnDestroy() {
    if (this.mobileMap) {
      this.mobileMap.remove();
    }
  }

  get allTasks(): MaintenanceTask[] {
    return this.projectService.tasks();
  }

  onTaskChange() {
    this.loadTask();
    this.updateMapHighlights();
  }

  loadTask() {
    const t = this.projectService.getTaskById(this.selectedTaskId);
    if (t) {
      this.currentTask = t;
      this.taskAssets = this.projectService.masterAssets().filter(a => t.assetIds.includes(a.id));
    }
  }

  getAssetPhoto(assetId: string) {
    return this.currentTask?.fieldPhotos.find(p => p.assetId === assetId);
  }

  initMobileMap() {
    if (!this.mobileMapContainer) return;

    const container = this.mobileMapContainer.nativeElement;
    this.mobileMap = L.map(container, { zoomControl: false }).setView([10.7745, 106.7025], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM'
    }).addTo(this.mobileMap);

    this.updateMapHighlights();
  }

  updateMapHighlights() {
    if (!this.mobileMap) return;

    this.markers.forEach(m => this.mobileMap?.removeLayer(m));
    this.markers = [];

    const bounds: L.LatLngExpression[] = [];

    // ONLY HIGHLIGHT ASSETS BELONGING TO THIS TASK (As specified in requirement 4)
    this.taskAssets.forEach(ast => {
      const isDone = this.currentTask?.completedAssetIds.includes(ast.id);
      const bg = isDone ? '#10b981' : '#ef4444';

      const icon = L.divIcon({
        className: 'mobile-pin',
        html: `
          <div style="background-color: ${bg}; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35);">
            ${isDone ? '✓' : '!'}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([ast.lat, ast.lng], { icon }).addTo(this.mobileMap!);
      bounds.push([ast.lat, ast.lng]);

      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; font-size: 11px;">
          <b>${ast.code}</b>: ${ast.name}<br/>
          <span style="color: #64748b;">${ast.address}</span>
        </div>
      `);

      this.markers.push(marker);
    });

    if (bounds.length > 0) {
      this.mobileMap.fitBounds(L.latLngBounds(bounds), { padding: [25, 25] });
    }
  }

  openCameraModal(asset: Asset) {
    this.activeCameraAsset = asset;
    this.currentTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.isCameraModalOpen = true;
  }

  closeCameraModal() {
    this.isCameraModalOpen = false;
    this.activeCameraAsset = null;
  }

  saveCapturedPhoto() {
    if (!this.activeCameraAsset || !this.currentTask) return;

    this.projectService.completeAssetInTask(
      this.currentTask.id,
      this.activeCameraAsset.id,
      this.capturedPhotoUrl,
      this.photoNote
    );

    this.loadTask();
    this.updateMapHighlights();
    this.toastService.success(
      'Ghi nhận ảnh hiện trường',
      `Đã lưu ảnh và định vị GPS cho tài sản ${this.activeCameraAsset.code}`
    );
    this.closeCameraModal();
  }

  markAssetCompleted(asset: Asset) {
    if (!this.currentTask) return;

    const photo = this.getAssetPhoto(asset.id)?.url || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80';

    this.projectService.completeAssetInTask(
      this.currentTask.id,
      asset.id,
      photo,
      'Hoàn thành thi công tại thực địa'
    );

    this.loadTask();
    this.updateMapHighlights();
    this.toastService.success(
      'Hoàn thành tại tọa độ',
      `Tài sản ${asset.code} đã cập nhật Đã xong và đồng bộ lên báo cáo thanh toán`
    );
  }
}
