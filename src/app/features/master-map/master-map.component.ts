import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { ProjectService } from '../../core/services/project.service';
import { Asset, LayerId } from '../../core/models/maintenance.model';

@Component({
  selector: 'app-master-map',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="gis-page-container">
      <!-- GIS Sidebar / Controls -->
      <div class="gis-sidebar">
        <div class="sidebar-header">
          <h2 class="title"><i class="bi bi-map-fill text-primary"></i> Master Map GIS</h2>
          <p class="subtitle">Bản đồ số hóa tài sản hạ tầng đô thị toàn thành phố (Kho dữ liệu tổng)</p>
        </div>

        <div class="filter-section">
          <label class="section-title">BẬT/TẮT LỚP DỮ LIỆU (LAYERS):</label>
          <div class="layer-toggles">
            <div
              *ngFor="let layer of projectService.layers()"
              class="layer-toggle-card"
              [class.active]="activeLayerFilters.has(layer.id)"
              (click)="toggleLayer(layer.id)"
            >
              <div class="color-indicator" [style.background-color]="layer.color"></div>
              <div class="layer-info">
                <span class="name">{{ layer.name }}</span>
                <span class="count">{{ getLayerAssetCount(layer.id) }} đối tượng</span>
              </div>
              <i class="bi" [class.bi-check-circle-fill]="activeLayerFilters.has(layer.id)" [class.bi-circle]="!activeLayerFilters.has(layer.id)"></i>
            </div>
          </div>
        </div>

        <div class="filter-section mt-3">
          <label class="section-title">LỌC THEO DỰ ÁN DUY TU:</label>
          <select class="form-select" [(ngModel)]="selectedProjectId" (ngModelChange)="applyMapFilters()">
            <option value="ALL">Tất cả tài sản (Bao gồm kho tổng)</option>
            <option *ngFor="let p of projectService.projects()" [value]="p.id">
              [{{ p.code }}] {{ p.name }}
            </option>
          </select>
        </div>

        <div class="filter-section mt-3">
          <label class="section-title">TRẠNG THÁI BẢO TRÌ:</label>
          <div class="status-chips">
            <button
              class="chip"
              [class.active]="statusFilter === 'ALL'"
              (click)="statusFilter = 'ALL'; applyMapFilters()"
            >Tất cả</button>
            <button
              class="chip"
              [class.active]="statusFilter === 'PENDING'"
              (click)="statusFilter = 'PENDING'; applyMapFilters()"
            >Chờ xử lý</button>
            <button
              class="chip"
              [class.active]="statusFilter === 'IN_PROGRESS'"
              (click)="statusFilter = 'IN_PROGRESS'; applyMapFilters()"
            >Đang sửa</button>
            <button
              class="chip"
              [class.active]="statusFilter === 'COMPLETED'"
              (click)="statusFilter = 'COMPLETED'; applyMapFilters()"
            >Đã xong</button>
          </div>
        </div>

        <div class="gis-stats-summary mt-4">
          <div class="stat-row">
            <span>Tổng tài sản hiển thị:</span>
            <strong>{{ filteredAssets.length }} điểm</strong>
          </div>
          <div class="stat-row">
            <span>Đã gán vào dự án:</span>
            <strong class="text-primary">{{ assignedCount }} điểm</strong>
          </div>
          <div class="stat-row">
            <span>Tài sản tự do trong kho:</span>
            <strong class="text-warning">{{ unassignedCount }} điểm</strong>
          </div>
        </div>

        <!-- Selected Asset Detail Drawer -->
        <div class="selected-asset-detail mt-3" *ngIf="selectedAsset">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="asset-code">{{ selectedAsset.code }}</span>
            <button class="btn btn-sm btn-ghost p-0" (click)="selectedAsset = null"><i class="bi bi-x"></i></button>
          </div>
          <div class="asset-name">{{ selectedAsset.name }}</div>
          <div class="asset-address text-muted fs-xs">{{ selectedAsset.address }}</div>
          <div class="mt-2 d-flex justify-content-between fs-xs">
            <span>Trạng thái: <strong>{{ selectedAsset.status }}</strong></span>
            <span>Tuyến: <strong>{{ selectedAsset.route }}</strong></span>
          </div>
          <div class="mt-2" *ngIf="selectedAsset.assignedProjectId">
            <a [routerLink]="['/projects', selectedAsset.assignedProjectId]" class="btn btn-sm btn-primary w-100">
              Mở Dự Án Duy Tu Chứa Điểm Này
            </a>
          </div>
        </div>
      </div>

      <!-- GIS Map Canvas -->
      <div class="gis-map-viewport">
        <div #gisMapContainer class="gis-leaflet-container"></div>
      </div>
    </div>
  `,
  styles: [`
    .gis-page-container {
      display: flex;
      height: calc(100vh - 64px);
      overflow: hidden;
    }

    .gis-sidebar {
      width: 360px;
      background: white;
      border-right: 1px solid var(--gray-200);
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;

      .sidebar-header {
        margin-bottom: 20px;
        .title { font-size: 18px; font-weight: 700; }
        .subtitle { font-size: 12px; color: var(--gray-500); }
      }

      .section-title {
        font-size: 11px;
        font-weight: 700;
        color: var(--gray-500);
        margin-bottom: 8px;
        display: block;
        letter-spacing: 0.05em;
      }
    }

    .layer-toggles {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .layer-toggle-card {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid var(--gray-200);
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover { background: var(--gray-50); }

        &.active {
          border-color: var(--primary-500);
          background: #eff6ff;
          i { color: var(--primary-600); }
        }

        .color-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .layer-info {
          flex: 1;
          .name { font-size: 13px; font-weight: 600; color: var(--gray-800); display: block; }
          .count { font-size: 11px; color: var(--gray-500); }
        }

        i { color: var(--gray-300); }
      }
    }

    .status-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;

      .chip {
        padding: 4px 10px;
        border-radius: 14px;
        font-size: 11.5px;
        border: 1px solid var(--gray-300);
        background: white;
        cursor: pointer;
        transition: all 0.12s ease;

        &.active {
          background: var(--primary-600);
          color: white;
          border-color: var(--primary-600);
        }
      }
    }

    .gis-stats-summary {
      background: var(--gray-50);
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12.5px;

      .stat-row {
        display: flex;
        justify-content: space-between;
      }
    }

    .selected-asset-detail {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 12px;

      .asset-code { font-family: monospace; font-weight: 700; color: var(--primary-800); }
      .asset-name { font-weight: 600; font-size: 13px; margin: 2px 0; }
    }

    .gis-map-viewport {
      flex: 1;
      height: 100%;

      .gis-leaflet-container {
        width: 100%;
        height: 100%;
      }
    }
  `]
})
export class MasterMapComponent implements OnInit, OnDestroy, AfterViewInit {
  projectService = inject(ProjectService);

  activeLayerFilters = new Set<LayerId>(['LIGHTING', 'GREENERY', 'DRAINAGE', 'ROADWAY']);
  selectedProjectId = 'ALL';
  statusFilter = 'ALL';
  selectedAsset: Asset | null = null;

  private map?: L.Map;
  private markers: L.Marker[] = [];

  @ViewChild('gisMapContainer') gisMapContainer?: ElementRef;

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 300);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  get filteredAssets(): Asset[] {
    return this.projectService.masterAssets().filter(a => {
      if (!this.activeLayerFilters.has(a.layerId)) return false;
      if (this.selectedProjectId !== 'ALL' && a.assignedProjectId !== this.selectedProjectId) return false;
      if (this.statusFilter !== 'ALL' && a.status !== this.statusFilter) return false;
      return true;
    });
  }

  get assignedCount(): number {
    return this.filteredAssets.filter(a => !!a.assignedProjectId).length;
  }

  get unassignedCount(): number {
    return this.filteredAssets.filter(a => !a.assignedProjectId).length;
  }

  getLayerAssetCount(layerId: LayerId): number {
    return this.projectService.masterAssets().filter(a => a.layerId === layerId).length;
  }

  toggleLayer(layerId: LayerId) {
    if (this.activeLayerFilters.has(layerId)) {
      if (this.activeLayerFilters.size > 1) {
        this.activeLayerFilters.delete(layerId);
      }
    } else {
      this.activeLayerFilters.add(layerId);
    }
    this.applyMapFilters();
  }

  initMap() {
    if (!this.gisMapContainer) return;

    this.map = L.map(this.gisMapContainer.nativeElement).setView([10.7745, 106.7025], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);

    this.applyMapFilters();
  }

  applyMapFilters() {
    if (!this.map) return;

    this.markers.forEach(m => this.map?.removeLayer(m));
    this.markers = [];

    const bounds: L.LatLngExpression[] = [];

    this.filteredAssets.forEach(ast => {
      const pinColor = ast.layerId === 'LIGHTING' ? '#f59e0b' :
                       ast.layerId === 'GREENERY' ? '#10b981' :
                       ast.layerId === 'DRAINAGE' ? '#06b6d4' : '#8b5cf6';

      const icon = L.divIcon({
        className: 'master-pin',
        html: `
          <div style="background-color: ${pinColor}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35); cursor: pointer;">
            ${ast.assignedProjectId ? '●' : '○'}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([ast.lat, ast.lng], { icon }).addTo(this.map!);
      bounds.push([ast.lat, ast.lng]);

      marker.on('click', () => {
        this.selectedAsset = ast;
      });

      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; min-width: 170px;">
          <div style="color: ${pinColor}; font-weight: 700; font-size: 11px;">${ast.layerName}</div>
          <div style="font-weight: 600; font-size: 13px;">${ast.name}</div>
          <div style="font-size: 11.5px; color: #64748b;">Mã: ${ast.code}</div>
          <div style="font-size: 11.5px; color: #64748b;">Đ/c: ${ast.address}</div>
          <div style="margin-top: 4px; font-size: 11.5px;">
            ${ast.assignedProjectId ? '<span style="color:#2563eb;">Đã gán vào dự án</span>' : '<span style="color:#d97706;">Kho Master tự do</span>'}
          </div>
        </div>
      `);

      this.markers.push(marker);
    });

    if (bounds.length > 0) {
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [30, 30] });
    }
  }
}
