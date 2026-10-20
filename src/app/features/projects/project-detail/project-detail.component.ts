import { Component, inject, OnInit, OnDestroy, AfterViewInit, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  Project,
  ProjectDocument,
  DocumentCategory,
  Asset,
  LayerId,
  AssetMaintenanceStatus,
  AssetCondition,
  ASSET_CONDITION_CONFIG,
  MaintenanceTask,
  TaskStatus,
  TASK_STATUS_CONFIG,
  TaskPriority,
  TaskAssetItem,
  ReportPayment,
  ReportItem
} from '../../../core/models/maintenance.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  projectService = inject(ProjectService);
  toastService = inject(ToastService);

  projectId = '';
  project: Project | null = null;

  // Active Tab: 1: 'info' | 2: 'docs' | 3: 'assets' | 4: 'tasks' | 5: 'reports'
  activeTab: 'info' | 'docs' | 'assets' | 'tasks' | 'reports' = 'info';

  // --- TAB 2: DOCUMENTS STATE ---
  activeDocCategory: DocumentCategory = 'DECISION';
  isUploadModalOpen = false;
  isPreviewDocModalOpen = false;
  selectedPreviewDoc: ProjectDocument | null = null;
  newDoc: Partial<ProjectDocument> = {
    category: 'DECISION',
    name: '',
    fileName: '',
    notes: ''
  };

  // --- TAB 3: ASSET MAPPING STATE (MỘT MÀN HÌNH - CHỌN CỘNG DỒN UNION) ---
  isAddAssetModalOpen = false;
  modalSelectedLayerId: LayerId = 'LIGHTING';
  modalSelectedRoute = 'Tất cả tuyến đường';
  modalSelectedAssetIds = new Set<string>(); // Single Source of Truth
  modalRightTab: 'ROUTE_LIST' | 'CART' = 'ROUTE_LIST';
  modalSearchKeyword = '';
  modalInteractionMode: 'POINTER' | 'LASSO' = 'POINTER';
  isDrawingLasso = false;
  lassoPoints: L.LatLng[] = [];
  showMapAssetCodes = true;
  assetSearchKeyword = '';
  assetFilterLayer: string = 'ALL';
  assetFilterStatus: string = 'ALL';
  assetCurrentPage = 1;
  assetPageSize = 5;

  readonly modalRouteList = [
    'Tất cả tuyến đường',
    'Tuyến Lê Lợi',
    'Tuyến Nguyễn Huệ',
    'Tuyến Nam Kỳ Khởi Nghĩa',
    'Tuyến Hàm Nghi',
    'Tuyến Tôn Đức Thắng'
  ];

  readonly routeCenterCoordinates: Record<string, { center: [number, number]; zoom: number }> = {
    'Tất cả tuyến đường': { center: [10.7740, 106.7015], zoom: 15 },
    'Tuyến Lê Lợi': { center: [10.7730, 106.6995], zoom: 17 },
    'Tuyến Nguyễn Huệ': { center: [10.7745, 106.7025], zoom: 17 },
    'Tuyến Nam Kỳ Khởi Nghĩa': { center: [10.7750, 106.6980], zoom: 17 },
    'Tuyến Hàm Nghi': { center: [10.7710, 106.7030], zoom: 17 },
    'Tuyến Tôn Đức Thắng': { center: [10.7755, 106.7065], zoom: 17 }
  };

  // Leaflet map instances
  private assetTabMap?: L.Map;
  private modalAssetMap?: L.Map;
  private modalMapLayers: L.Layer[] = [];
  private drawnLassoPolygon?: L.Polygon;
  private lassoVertexMarkers: L.CircleMarker[] = [];

  // --- TAB 4: TASK MANAGEMENT STATE ---
  isCreateTaskModalOpen = false;
  isTaskAssetPickerOpen = false;
  isTaskAssetsModalOpen = false;
  selectedTaskForAssets: MaintenanceTask | null = null;
  taskFilterLayer = 'ALL';
  taskFilterStatus = 'ALL';
  expandedTaskId: string | null = null;
  newTask: {
    title: string;
    description: string;
    contractor: string;
    assignedTeam: string;
    priority: TaskPriority;
    deadline: string;
    targetLayerId: LayerId | 'ALL';
    assetIds: string[];
  } = {
    title: '',
    description: '',
    contractor: 'Công ty CP Chiếu sáng & Cây xanh Đô thị Sài Gòn',
    assignedTeam: 'Tổ Kỹ thuật Hiện trường 1',
    priority: 'MEDIUM',
    deadline: '2026-05-15',
    targetLayerId: 'ALL',
    assetIds: []
  };

  // --- TAB 5: REPORTING & PAYMENT (SPLIT-VIEW) STATE ---
  isSplitViewModalOpen = false;
  selectedReport: ReportPayment | null = null;
  activeInspectionItem: ReportItem | null = null;
  rejectionReason = '';
  isRejectModalOpen = false;

  @ViewChild('assetMiniMapContainer') assetMiniMapContainer?: ElementRef;
  @ViewChild('modalMapContainer') modalMapContainer?: ElementRef;
  @ViewChild('singleAssetMapContainer') singleAssetMapContainer?: ElementRef;

  // --- MODAL XEM VỊ TRÍ TÀI SẢN & TUYẾN ĐƯỜNG TRÊN MAP GIS ---
  isAssetLocationModalOpen = false;
  selectedAssetForLocation: Asset | null = null;
  private singleAssetMap?: L.Map;

  readonly routePolylineCoordinates: Record<string, [number, number][]> = {
    'Tuyến Nguyễn Huệ': [
      [10.7768, 106.7016],
      [10.7758, 106.7027],
      [10.7745, 106.7038],
      [10.7733, 106.7049],
      [10.7718, 106.7062]
    ],
    'Tuyến Lê Lợi': [
      [10.7718, 106.6975],
      [10.7728, 106.6992],
      [10.7738, 106.7008],
      [10.7748, 106.7024],
      [10.7760, 106.7032]
    ],
    'Tuyến Nam Kỳ Khởi Nghĩa': [
      [10.7785, 106.6950],
      [10.7755, 106.6980],
      [10.7730, 106.7005],
      [10.7705, 106.7030]
    ],
    'Tuyến Hàm Nghi': [
      [10.7702, 106.6990],
      [10.7712, 106.7025],
      [10.7728, 106.7065]
    ],
    'Tuyến Tôn Đức Thắng': [
      [10.7810, 106.7075],
      [10.7775, 106.7062],
      [10.7745, 106.7070],
      [10.7715, 106.7068]
    ]
  };

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.projectId = params['id'];
      this.loadProject();
    });

    this.route.queryParams.subscribe(qp => {
      if (qp['tab']) {
        this.activeTab = qp['tab'];
      }
    });
  }

  ngAfterViewInit() {
    if (this.activeTab === 'assets') {
      setTimeout(() => this.initAssetTabMap(), 200);
    }
  }

  ngOnDestroy() {
    if (this.assetTabMap) {
      this.assetTabMap.remove();
    }
    if (this.modalAssetMap) {
      this.modalAssetMap.remove();
    }
    if (this.singleAssetMap) {
      this.singleAssetMap.remove();
    }
  }

  loadProject() {
    const found = this.projectService.getProjectById(this.projectId);
    if (found) {
      this.project = found;
    } else {
      this.toastService.danger('Lỗi', 'Không tìm thấy dự án yêu cầu');
      this.router.navigate(['/projects']);
    }
  }

  setActiveTab(tab: 'info' | 'docs' | 'assets' | 'tasks' | 'reports') {
    this.activeTab = tab;
    if (tab === 'assets') {
      setTimeout(() => this.initAssetTabMap(), 200);
    }
  }

  // --- TAB 1: GENERAL INFO METHODS ---
  updateProjectStatus(newStatus: any) {
    if (!this.project) return;
    this.projectService.updateProject(this.projectId, { status: newStatus });
    this.loadProject();
    this.toastService.success('Đã chuyển trạng thái', `Dự án chuyển sang: "${newStatus}"`);
  }

  // --- TAB 2: DOCUMENTS METHODS ---
  get filteredDocuments(): ProjectDocument[] {
    return this.projectService.getDocuments(this.projectId, this.activeDocCategory);
  }

  openUploadModal(category?: DocumentCategory) {
    if (category) this.activeDocCategory = category;
    this.newDoc = {
      category: this.activeDocCategory,
      name: '',
      fileName: '',
      notes: ''
    };
    this.isUploadModalOpen = true;
  }

  closeUploadModal() {
    this.isUploadModalOpen = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.newDoc.fileName = file.name;
      if (!this.newDoc.name) {
        this.newDoc.name = file.name.replace(/\.[^/.]+$/, '');
      }
    }
  }

  submitUploadDocument() {
    if (!this.newDoc.name) return;
    this.projectService.addDocument({
      projectId: this.projectId,
      category: this.newDoc.category || this.activeDocCategory,
      name: this.newDoc.name,
      fileName: this.newDoc.fileName || 'tai_lieu_dinh_kem.pdf',
      fileSize: '2.5 MB',
      fileType: 'PDF',
      notes: this.newDoc.notes
    });
    this.toastService.success('Tải lên thành công', `Hồ sơ "${this.newDoc.name}" đã được lưu trữ`);
    this.closeUploadModal();
  }

  previewDoc(doc: ProjectDocument) {
    this.selectedPreviewDoc = doc;
    this.isPreviewDocModalOpen = true;
  }

  closePreviewDoc() {
    this.isPreviewDocModalOpen = false;
    this.selectedPreviewDoc = null;
  }

  downloadDoc(doc: ProjectDocument) {
    this.toastService.info('Đang tải tài liệu', `Bắt đầu tải file: ${doc.fileName}`);
  }

  deleteDoc(doc: ProjectDocument) {
    if (confirm(`Bạn có chắc chắn muốn xóa tài liệu "${doc.name}"?`)) {
      this.projectService.deleteDocument(doc.id);
      this.toastService.warning('Đã xóa tài liệu', `Đã loại bỏ file ${doc.fileName}`);
    }
  }

  // --- TAB 3: ASSET MASTER DATA / CATALOG METHODS ---
  get projectAssets(): Asset[] {
    let list = this.projectService.getProjectAssets(this.projectId);
    if (this.assetFilterLayer !== 'ALL') {
      list = list.filter(a => a.layerId === this.assetFilterLayer);
    }
    if (this.assetSearchKeyword.trim()) {
      const q = this.assetSearchKeyword.toLowerCase().trim();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.address.toLowerCase().includes(q) ||
        (a.specs && a.specs.toLowerCase().includes(q)) ||
        (a.route && a.route.toLowerCase().includes(q)) ||
        (a.chainage && a.chainage.toLowerCase().includes(q)) ||
        (a.category && a.category.toLowerCase().includes(q))
      );
    }
    return list;
  }

  get totalAssetPages(): number {
    return Math.max(1, Math.ceil(this.projectAssets.length / this.assetPageSize));
  }

  get paginatedProjectAssets(): Asset[] {
    const total = this.totalAssetPages;
    if (this.assetCurrentPage > total) {
      this.assetCurrentPage = 1;
    }
    const start = (this.assetCurrentPage - 1) * this.assetPageSize;
    return this.projectAssets.slice(start, start + this.assetPageSize);
  }

  get assetStartIdx(): number {
    if (this.projectAssets.length === 0) return 0;
    return (this.assetCurrentPage - 1) * this.assetPageSize + 1;
  }

  get assetEndIdx(): number {
    return Math.min(this.assetCurrentPage * this.assetPageSize, this.projectAssets.length);
  }

  setAssetPage(page: number) {
    if (page >= 1 && page <= this.totalAssetPages) {
      this.assetCurrentPage = page;
    }
  }

  onAssetPageSizeChange(newSize: any) {
    this.assetPageSize = Number(newSize);
    this.assetCurrentPage = 1;
  }

  get assetPaginationPages(): number[] {
    const total = this.totalAssetPages;
    const current = this.assetCurrentPage;
    const pages: number[] = [];
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
        pages.push(i);
      }
    }
    return pages;
  }

  // Tra cứu hiện trạng ghi nhận gần nhất từ các đợt làm việc
  getAssetLatestCondition(assetId: string) {
    return this.projectService.getAssetLatestCondition(assetId);
  }

  // Tra cứu danh sách các task có liên kết tới tài sản này
  getTasksForAsset(assetId: string): MaintenanceTask[] {
    return this.projectService.getTasksForAsset(assetId);
  }

  getAssetConditionLabel(condition: AssetCondition): string {
    return this.projectService.getAssetConditionLabel(condition);
  }

  getConditionBadgeClass(condition: AssetCondition): string {
    switch (condition) {
      case 'GOOD': return 'bg-success text-white';
      case 'NORMAL': return 'bg-info text-white';
      case 'DAMAGED': return 'bg-danger text-white';
      case 'NEEDS_REPLACEMENT': return 'bg-warning text-dark';
      default: return 'bg-secondary text-white';
    }
  }

  getConditionIcon(condition: AssetCondition): string {
    switch (condition) {
      case 'GOOD': return 'bi-check-circle-fill';
      case 'NORMAL': return 'bi-info-circle-fill';
      case 'DAMAGED': return 'bi-exclamation-triangle-fill';
      case 'NEEDS_REPLACEMENT': return 'bi-arrow-repeat';
      default: return 'bi-dot';
    }
  }

  removeAsset(asset: Asset) {
    if (confirm(`Gỡ bỏ tài sản ${asset.code} (${asset.name}) khỏi danh mục dự án này?`)) {
      this.projectService.removeAssetFromProject(this.projectId, asset.id);
      this.loadProject();
      this.toastService.warning('Đã gỡ tài sản', `Tài sản ${asset.code} đã trở lại Master Map`);
      setTimeout(() => this.refreshAssetTabMap(), 200);
    }
  }

  // Asset Mini Map
  initAssetTabMap() {
    if (!this.assetMiniMapContainer) return;
    if (this.assetTabMap) {
      this.assetTabMap.invalidateSize();
      return;
    }

    const container = this.assetMiniMapContainer.nativeElement;
    this.assetTabMap = L.map(container).setView([10.7745, 106.7025], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.assetTabMap);

    this.renderAssetTabMarkers();
  }

  refreshAssetTabMap() {
    if (!this.assetTabMap) return;
    this.renderAssetTabMarkers();
  }

  private renderAssetTabMarkers() {
    if (!this.assetTabMap) return;

    // Clear existing layers except tileLayer
    this.assetTabMap.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polygon) {
        this.assetTabMap?.removeLayer(layer);
      }
    });

    const assets = this.projectService.getProjectAssets(this.projectId);
    const bounds: L.LatLngExpression[] = [];

    assets.forEach(ast => {
      const pinColor = ast.layerId === 'LIGHTING' ? '#f59e0b' :
                       ast.layerId === 'GREENERY' ? '#10b981' :
                       ast.layerId === 'DRAINAGE' ? '#06b6d4' : '#8b5cf6';

      const latestCond = this.getAssetLatestCondition(ast.id);

      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="background-color: ${pinColor}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35);">
            ●
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([ast.lat, ast.lng], { icon }).addTo(this.assetTabMap!);
      bounds.push([ast.lat, ast.lng]);

      const condBadge = latestCond
        ? `<span class="badge ${this.getConditionBadgeClass(latestCond.condition)} p-1">${this.getAssetConditionLabel(latestCond.condition)}</span>`
        : '<span class="text-muted fs-xs">Chưa có đợt kiểm tra</span>';

      marker.bindPopup(`
        <div style="min-width: 220px; font-family: Inter, sans-serif;">
          <div style="font-size: 11px; color: ${pinColor}; font-weight: 700; text-transform: uppercase;">${ast.layerName} • ${ast.category || 'Tài sản đô thị'}</div>
          <div style="font-weight: 600; font-size: 13px; margin: 3px 0;">${ast.name}</div>
          <div style="font-size: 11.5px; color: #475569;">Mã TS: <b>${ast.code}</b></div>
          <div style="font-size: 11.5px; color: #64748b;">Tuyến & Lý trình: <b>${ast.route}</b> (${ast.chainage || 'Đang cập nhật'})</div>
          <div style="font-size: 11.5px; color: #64748b;">Thông số KT: <i>${ast.specs || 'Theo hồ sơ thiết kế'}</i></div>
          <div style="font-size: 11.5px; color: #64748b;">Đơn vị QL: ${ast.managementUnit || 'Ban QLDA'}</div>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
            <span>Hiện trạng ghi nhận:</span>
            ${condBadge}
          </div>
        </div>
      `);
    });

    if (bounds.length > 0) {
      this.assetTabMap.fitBounds(L.latLngBounds(bounds), { padding: [30, 30] });
    }
  }

  // --- XEM VỊ TRÍ TÀI SẢN & TUYẾN ĐƯỜNG TRÊN BẢN ĐỒ GIS ---
  openAssetLocationModal(asset: Asset) {
    this.selectedAssetForLocation = asset;
    this.isAssetLocationModalOpen = true;
    setTimeout(() => this.initSingleAssetMap(asset), 300);
  }

  closeAssetLocationModal() {
    this.isAssetLocationModalOpen = false;
    if (this.singleAssetMap) {
      this.singleAssetMap.remove();
      this.singleAssetMap = undefined;
    }
    this.selectedAssetForLocation = null;
  }

  initSingleAssetMap(asset: Asset) {
    if (!this.singleAssetMapContainer) return;

    if (this.singleAssetMap) {
      this.singleAssetMap.remove();
      this.singleAssetMap = undefined;
    }

    const container = this.singleAssetMapContainer.nativeElement;
    this.singleAssetMap = L.map(container).setView([asset.lat, asset.lng], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.singleAssetMap);

    const bounds: L.LatLngExpression[] = [];

    // 1. Vẽ corridor tuyến đường mà tài sản đang trực thuộc (nếu có trong danh mục)
    const routeCoords = this.routePolylineCoordinates[asset.route];
    if (routeCoords && routeCoords.length > 0) {
      routeCoords.forEach(c => bounds.push(c));
      const routeLine = L.polyline(routeCoords, {
        color: '#0284c7',
        weight: 6,
        opacity: 0.65,
        dashArray: '8, 6'
      }).addTo(this.singleAssetMap);

      routeLine.bindTooltip(`<b>${asset.route}</b> (Hành lang tuyến)`, {
        sticky: true,
        direction: 'top'
      });
    }

    // 2. Vẽ hình học của chính tài sản (Line / Polygon / Point)
    if (asset.geometryType === 'LINE' && asset.startPoint && asset.endPoint) {
      const lineCoords: [number, number][] = [
        [asset.startPoint.lat, asset.startPoint.lng],
        [asset.endPoint.lat, asset.endPoint.lng]
      ];
      bounds.push(lineCoords[0], lineCoords[1]);
      L.polyline(lineCoords, {
        color: '#2563eb',
        weight: 8,
        opacity: 0.95
      }).addTo(this.singleAssetMap);
    } else if (asset.geometryType === 'POLYGON' && asset.polygonCoords && asset.polygonCoords.length >= 3) {
      asset.polygonCoords.forEach(c => bounds.push(c));
      L.polygon(asset.polygonCoords, {
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.45,
        weight: 3
      }).addTo(this.singleAssetMap);
    }

    // 3. Marker trọng tâm của tài sản
    bounds.push([asset.lat, asset.lng]);
    const pinColor = this.getLayerColor(asset.layerId);
    const icon = L.divIcon({
      className: 'single-asset-pin',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="background-color: ${pinColor}; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; border: 3px solid white; box-shadow: 0 0 0 4px rgba(37,99,235,0.35), 0 3px 8px rgba(0,0,0,0.35);">
            <i class="bi bi-geo-alt-fill"></i>
          </div>
          <span style="background: rgba(15,23,42,0.85); color: white; font-size: 10px; font-weight: 700; font-family: monospace; padding: 1px 6px; border-radius: 4px; margin-top: 3px; white-space: nowrap;">${asset.code}</span>
        </div>
      `,
      iconSize: [80, 52],
      iconAnchor: [40, 17]
    });

    const marker = L.marker([asset.lat, asset.lng], { icon }).addTo(this.singleAssetMap);
    marker.bindPopup(`
      <div style="font-family: Inter, sans-serif; font-size: 12px; line-height: 1.5; padding: 2px;">
        <div style="font-weight: 700; color: #1e293b; font-size: 13px;">${asset.name}</div>
        <div style="color: #64748b;">Mã TS: <b>${asset.code}</b></div>
        <div style="color: #64748b;">Tuyến đường: <b>${asset.route}</b> ${asset.chainage ? ' • ' + asset.chainage : ''}</div>
        <div style="color: #64748b;">Vị trí: ${asset.address || 'Đang cập nhật'}</div>
        <div style="color: #64748b;">Thông số KT: <i>${asset.specs || 'Theo hồ sơ'}</i></div>
      </div>
    `).openPopup();

    if (bounds.length > 0) {
      this.singleAssetMap.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 18 });
    }

    setTimeout(() => this.singleAssetMap?.invalidateSize(), 300);
  }

  // --- MODAL: THÊM TÀI SẢN VÀO DỰ ÁN (MỘT MÀN HÌNH - CHỌN CỘNG DỒN UNION) ---
  openAddAssetModal() {
    this.isAddAssetModalOpen = true;
    this.modalSelectedAssetIds.clear();

    // Bài toán "Mở lại": Load toàn bộ tài sản đã có trong dự án này từ Database / Service
    const existing = this.projectService.masterAssets().filter(a => a.assignedProjectId === this.projectId);
    existing.forEach(a => this.modalSelectedAssetIds.add(a.id));

    // Nếu đã có sẵn tài sản -> mở ngay tab Giỏ Hàng để Cán bộ kiểm soát ngay lập tức!
    this.modalRightTab = existing.length > 0 ? 'CART' : 'ROUTE_LIST';
    this.modalInteractionMode = 'POINTER';
    this.cancelLassoDrawing();

    setTimeout(() => this.initModalAssetMap(), 300);
  }

  closeAddAssetModal() {
    this.cancelLassoDrawing();
    if (this.modalAssetMap) {
      this.modalAssetMap.remove();
      this.modalAssetMap = undefined;
    }
    this.isAddAssetModalOpen = false;
  }

  // Khu vực Lọc Vĩ mô (Top Bar): Thay đổi Lớp dữ liệu (Layer)
  onModalLayerChange() {
    // Nguyên lý Union: KHÔNG xóa modalSelectedAssetIds khi đổi layer!
    this.updateModalMapMarkers();
  }

  // Khu vực Lọc Vĩ mô (Top Bar): Khi Cán bộ chọn Tuyến đường -> FlyTo và cập nhật danh sách
  onModalRouteChange() {
    const target = this.routeCenterCoordinates[this.modalSelectedRoute] || this.routeCenterCoordinates['Tất cả tuyến đường'];
    if (this.modalAssetMap) {
      this.modalAssetMap.flyTo(target.center, target.zoom, {
        duration: 1.2
      });
    }
    // Tự động chuyển qua tab Danh sách theo tuyến để xem ngay dữ liệu tĩnh của tuyến đó
    this.modalRightTab = 'ROUTE_LIST';
  }

  // Chọn cộng dồn (Union) toàn bộ tài sản thuộc tuyến đang chọn vào giỏ hàng
  selectRouteAssets() {
    const list = this.getModalRouteAssets();
    let newlyAdded = 0;
    list.forEach(a => {
      if (!this.modalSelectedAssetIds.has(a.id)) {
        this.modalSelectedAssetIds.add(a.id);
        newlyAdded++;
      }
    });
    this.toastService.info(
      'Cộng dồn theo tuyến',
      `Đã thêm ${newlyAdded} tài sản thuộc "${this.modalSelectedRoute}" vào giỏ hàng`
    );
    this.updateModalMapMarkers();
  }

  // Bỏ chọn toàn bộ tài sản thuộc tuyến đang xem khỏi giỏ hàng
  deselectRouteAssets() {
    const list = this.getModalRouteAssets();
    let removed = 0;
    list.forEach(a => {
      if (this.modalSelectedAssetIds.has(a.id)) {
        this.modalSelectedAssetIds.delete(a.id);
        removed++;
      }
    });
    this.toastService.info(
      'Bỏ chọn tuyến',
      `Đã bỏ ${removed} tài sản thuộc "${this.modalSelectedRoute}" khỏi giỏ hàng`
    );
    this.updateModalMapMarkers();
  }

  // Two-way binding: Toggle checkbox / click card / click map
  toggleModalAsset(assetId: string) {
    if (this.modalSelectedAssetIds.has(assetId)) {
      this.modalSelectedAssetIds.delete(assetId);
    } else {
      this.modalSelectedAssetIds.add(assetId);
    }
    this.updateModalMapMarkers();
  }

  // Xóa từng tài sản trong Giỏ hàng
  removeFromCart(assetId: string) {
    this.modalSelectedAssetIds.delete(assetId);
    this.updateModalMapMarkers();
  }

  // Xóa toàn bộ giỏ hàng
  clearCart() {
    this.modalSelectedAssetIds.clear();
    this.toastService.info('Làm trống giỏ hàng', 'Đã bỏ chọn tất cả tài sản');
    this.updateModalMapMarkers();
  }

  // Danh sách tài sản hiển thị tĩnh theo Tuyến (Right Panel Tab 1)
  getModalRouteAssets(): Asset[] {
    const list = this.projectService.masterAssets().filter(a => {
      const matchLayer = a.layerId === this.modalSelectedLayerId;
      const matchRoute = this.modalSelectedRoute === 'Tất cả tuyến đường' || a.route.includes(this.modalSelectedRoute);
      return matchLayer && matchRoute;
    });

    if (!this.modalSearchKeyword.trim()) return list;
    const kw = this.modalSearchKeyword.toLowerCase();
    return list.filter(a =>
      a.name.toLowerCase().includes(kw) ||
      a.code.toLowerCase().includes(kw) ||
      (a.address && a.address.toLowerCase().includes(kw)) ||
      (a.chainage && a.chainage.toLowerCase().includes(kw))
    );
  }

  // Danh sách tài sản trong Giỏ hàng (Right Panel Tab 2)
  getModalCartAssets(): Asset[] {
    const all = this.projectService.masterAssets().filter(a => this.modalSelectedAssetIds.has(a.id));
    if (!this.modalSearchKeyword.trim()) return all;
    const kw = this.modalSearchKeyword.toLowerCase();
    return all.filter(a =>
      a.name.toLowerCase().includes(kw) ||
      a.code.toLowerCase().includes(kw) ||
      a.route.toLowerCase().includes(kw) ||
      a.layerName.toLowerCase().includes(kw)
    );
  }

  // Pan bản đồ tới tài sản cụ thể khi click từ Right Panel
  panToAsset(asset: Asset) {
    if (this.modalAssetMap) {
      this.modalAssetMap.flyTo([asset.lat, asset.lng], 18, { duration: 0.8 });
    }
  }

  // Toggles hiển thị nhãn mã text trực tiếp trên bản đồ
  toggleMapAssetCodes() {
    this.showMapAssetCodes = !this.showMapAssetCodes;
    this.updateModalMapMarkers();
  }

  // --- CÔNG CỤ TƯƠNG TÁC BẢN ĐỒ: CON TRỎ & VẼ VÙNG (POLYGON LASSO) ---
  setInteractionMode(mode: 'POINTER' | 'LASSO') {
    if (mode === 'LASSO') {
      this.startLassoDrawing();
    } else {
      this.cancelLassoDrawing();
    }
  }

  startLassoDrawing() {
    this.modalInteractionMode = 'LASSO';
    this.isDrawingLasso = true;
    this.lassoPoints = [];
    this.clearLassoVisuals();
    this.toastService.info(
      'Chế độ Vẽ vùng (Polygon Lasso)',
      'Nhấp chuột các điểm trên bản đồ để tạo vùng khoanh. Nhấp "Chốt & Gom" khi xong.'
    );
  }

  cancelLassoDrawing() {
    this.clearLassoVisuals();
    this.isDrawingLasso = false;
    this.lassoPoints = [];
    this.modalInteractionMode = 'POINTER';
  }

  private clearLassoVisuals() {
    if (this.modalAssetMap) {
      if (this.drawnLassoPolygon) {
        this.modalAssetMap.removeLayer(this.drawnLassoPolygon);
        this.drawnLassoPolygon = undefined;
      }
      this.lassoVertexMarkers.forEach(m => this.modalAssetMap?.removeLayer(m));
      this.lassoVertexMarkers = [];
    }
  }

  handleMapClickForLasso(latlng: L.LatLng) {
    this.lassoPoints.push(latlng);

    // Vẽ điểm đỉnh
    const vertex = L.circleMarker(latlng, {
      radius: 5,
      color: '#2563eb',
      fillColor: '#ffffff',
      fillOpacity: 1,
      weight: 2
    }).addTo(this.modalAssetMap!);
    this.lassoVertexMarkers.push(vertex);

    // Cập nhật đường polygon preview
    if (this.drawnLassoPolygon) {
      this.modalAssetMap?.removeLayer(this.drawnLassoPolygon);
    }

    if (this.lassoPoints.length >= 2) {
      this.drawnLassoPolygon = L.polygon(this.lassoPoints, {
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.25,
        weight: 2,
        dashArray: '5, 5'
      }).addTo(this.modalAssetMap!);
    }
  }

  // Hoàn tất vẽ & Gom tài sản trong vùng đa giác (Ray-casting Algorithm - Union vào Set)
  completeLassoDrawing() {
    if (this.lassoPoints.length < 3) {
      this.toastService.warning('Chưa đủ điểm', 'Vui lòng chọn ít nhất 3 điểm trên bản đồ để tạo vùng khoanh đa giác');
      return;
    }

    const poly = this.lassoPoints.map(p => [p.lat, p.lng] as [number, number]);
    const candidates = this.projectService.masterAssets().filter(a => a.layerId === this.modalSelectedLayerId);
    let newlyAdded = 0;

    candidates.forEach(ast => {
      let isInside = false;
      if (ast.geometryType === 'LINE' && ast.startPoint && ast.endPoint) {
        isInside = this.isPointInsidePolygon([ast.startPoint.lat, ast.startPoint.lng], poly) ||
                   this.isPointInsidePolygon([ast.endPoint.lat, ast.endPoint.lng], poly);
      } else {
        isInside = this.isPointInsidePolygon([ast.lat, ast.lng], poly);
      }

      if (isInside) {
        if (!this.modalSelectedAssetIds.has(ast.id)) {
          this.modalSelectedAssetIds.add(ast.id);
          newlyAdded++;
        }
      }
    });

    this.toastService.success(
      'Gom vùng Polygon Lasso thành công',
      `Đã gom thêm ${newlyAdded} tài sản vào giỏ hàng (Tổng hiện có: ${this.modalSelectedAssetIds.size} tài sản)`
    );

    this.cancelLassoDrawing();
    this.updateModalMapMarkers();
  }

  // Quét nhanh vùng trung tâm dự án (Quick Lasso Preset)
  quickLassoCenter() {
    if (!this.modalAssetMap) return;
    const center = this.modalAssetMap.getCenter();
    const dLat = 0.0022;
    const dLng = 0.0032;

    this.lassoPoints = [
      L.latLng(center.lat + dLat, center.lng - dLng),
      L.latLng(center.lat + dLat, center.lng + dLng),
      L.latLng(center.lat - dLat, center.lng + dLng),
      L.latLng(center.lat - dLat, center.lng - dLng)
    ];

    this.completeLassoDrawing();
  }

  // Thuật toán Ray-Casting kiểm tra tọa độ điểm nằm trong đa giác
  private isPointInsidePolygon(point: [number, number], vs: [number, number][]): boolean {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i][0], yi = vs[i][1];
      const xj = vs[j][0], yj = vs[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  isAssetAlreadyInProject(assetId: string): boolean {
    const a = this.projectService.masterAssets().find(x => x.id === assetId);
    return a?.assignedProjectId === this.projectId;
  }

  // Khởi tạo Leaflet Map cho Modal
  initModalAssetMap() {
    if (!this.modalMapContainer) return;

    const container = this.modalMapContainer.nativeElement;
    this.modalAssetMap = L.map(container).setView([10.7745, 106.7025], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.modalAssetMap);

    // Lắng nghe sự kiện click trên bản đồ (phục vụ vẽ Polygon Lasso)
    this.modalAssetMap.on('click', (e: L.LeafletMouseEvent) => {
      if (this.isDrawingLasso) {
        this.handleMapClickForLasso(e.latlng);
      }
    });

    this.updateModalMapMarkers();
  }

  // Vẽ các đối tượng hình học (Point, Line, Polygon) kèm Highlight theo Set
  updateModalMapMarkers() {
    if (!this.modalAssetMap) return;

    // Xóa các layers cũ của tài sản
    this.modalMapLayers.forEach(l => this.modalAssetMap?.removeLayer(l));
    this.modalMapLayers = [];

    // Hiển thị tất cả tài sản của Layer hiện tại + những tài sản đang có trong Giỏ Hàng
    const currentLayerAssets = this.projectService.masterAssets().filter(a => a.layerId === this.modalSelectedLayerId);
    const cartAssets = this.projectService.masterAssets().filter(a => this.modalSelectedAssetIds.has(a.id));
    
    // Gộp danh sách không trùng lặp
    const mapPoolMap = new Map<string, Asset>();
    currentLayerAssets.forEach(a => mapPoolMap.set(a.id, a));
    cartAssets.forEach(a => mapPoolMap.set(a.id, a));
    const assets = Array.from(mapPoolMap.values());

    const bounds: L.LatLngExpression[] = [];

    assets.forEach(ast => {
      const isSelected = this.modalSelectedAssetIds.has(ast.id);
      const isAlreadyIn = ast.assignedProjectId === this.projectId;

      // 1. TÀI SẢN DẠNG ĐƯỜNG (LINE)
      if (ast.geometryType === 'LINE' && ast.startPoint && ast.endPoint) {
        const lineCoords: [number, number][] = [
          [ast.startPoint.lat, ast.startPoint.lng],
          [ast.endPoint.lat, ast.endPoint.lng]
        ];
        bounds.push(lineCoords[0], lineCoords[1]);

        const polyline = L.polyline(lineCoords, {
          color: isSelected ? '#2563eb' : (isAlreadyIn ? '#475569' : '#8b5cf6'),
          weight: isSelected ? 7 : 4,
          opacity: isSelected ? 0.95 : 0.65,
          dashArray: isSelected ? undefined : '6, 4'
        }).addTo(this.modalAssetMap!);

        polyline.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (!this.isDrawingLasso) {
            this.toggleModalAsset(ast.id);
          }
        });

        this.bindHoverTooltip(polyline, ast, isSelected, isAlreadyIn);
        this.modalMapLayers.push(polyline);
      }
      // 2. TÀI SẢN DẠNG VÙNG (POLYGON)
      else if (ast.geometryType === 'POLYGON' && ast.polygonCoords && ast.polygonCoords.length >= 3) {
        ast.polygonCoords.forEach(c => bounds.push(c));

        const polygon = L.polygon(ast.polygonCoords, {
          color: isSelected ? '#2563eb' : '#10b981',
          fillColor: isSelected ? '#3b82f6' : '#10b981',
          fillOpacity: isSelected ? 0.45 : 0.2,
          weight: isSelected ? 3 : 2
        }).addTo(this.modalAssetMap!);

        polygon.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (!this.isDrawingLasso) {
            this.toggleModalAsset(ast.id);
          }
        });

        this.bindHoverTooltip(polygon, ast, isSelected, isAlreadyIn);
        this.modalMapLayers.push(polygon);
      }
      // 3. TÀI SẢN DẠNG ĐIỂM (POINT)
      else {
        bounds.push([ast.lat, ast.lng]);

        const bg = isSelected ? '#2563eb' : (isAlreadyIn ? '#64748b' : this.getLayerColor(ast.layerId));
        const shadow = isSelected ? '0 0 0 4px rgba(37,99,235,0.35), 0 3px 8px rgba(0,0,0,0.35)' : '0 2px 5px rgba(0,0,0,0.25)';
        const size = isSelected ? 28 : 22;

        const iconHtml = `
          <div class="custom-map-pin" style="display: flex; flex-direction: column; align-items: center;">
            <div style="background-color: ${bg}; width: ${size}px; height: ${size}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; border: 2.5px solid #ffffff; box-shadow: ${shadow}; cursor: pointer; transition: all 0.2s ease;">
              ${isSelected ? '✓' : '●'}
            </div>
            ${this.showMapAssetCodes ? `<span style="background: rgba(255,255,255,0.92); color: #1e293b; font-size: 10px; font-weight: 700; font-family: monospace; padding: 1px 4px; border-radius: 3px; border: 1px solid #cbd5e1; margin-top: 2px; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">${ast.code}</span>` : ''}
          </div>
        `;

        const icon = L.divIcon({
          className: 'modal-asset-marker',
          html: iconHtml,
          iconSize: [60, 40],
          iconAnchor: [30, 11]
        });

        const marker = L.marker([ast.lat, ast.lng], { icon }).addTo(this.modalAssetMap!);

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (!this.isDrawingLasso) {
            this.toggleModalAsset(ast.id);
          }
        });

        this.bindHoverTooltip(marker, ast, isSelected, isAlreadyIn);
        this.modalMapLayers.push(marker);
      }
    });

    if (bounds.length > 0 && !this.isDrawingLasso) {
      this.modalAssetMap.fitBounds(L.latLngBounds(bounds), { padding: [30, 30], maxZoom: 17 });
    }
  }

  // Gắn Hover Tooltip định danh thông tin trực quan khi rà chuột qua đối tượng
  private bindHoverTooltip(layer: L.Layer, ast: Asset, isSelected: boolean, isAlreadyIn: boolean) {
    const statusText = isSelected
      ? '<span style="color: #2563eb; font-weight: bold;">✓ Đang được chọn trong giỏ hàng</span>'
      : (isAlreadyIn
          ? '<span style="color: #64748b;">📌 Đã có sẵn trong dự án này</span>'
          : '<span style="color: #059669;">⭕ Chưa chọn (Nhấp để cộng dồn)</span>');

    const tooltipHtml = `
      <div style="font-family: Inter, sans-serif; font-size: 12px; line-height: 1.4; padding: 2px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 3px;">
          <strong style="font-family: monospace; font-size: 12.5px; color: #1e293b;">${ast.code}</strong>
          <span style="font-size: 10px; background: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 10px; font-weight: 600;">${ast.layerName}</span>
        </div>
        <div style="font-weight: 600; color: #0f172a; margin-bottom: 3px;">${ast.name}</div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 3px;">
          <i class="bi bi-signpost-2"></i> ${ast.route} ${ast.chainage ? ' • ' + ast.chainage : ''}
        </div>
        <div style="font-size: 11px; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
          ${statusText}
        </div>
      </div>
    `;

    layer.bindTooltip(tooltipHtml, {
      sticky: true,
      direction: 'top',
      opacity: 0.98,
      className: 'asset-map-hover-popup'
    });
  }


  // Xác nhận gán toàn bộ tài sản trong biến Set vào dự án (Đồng bộ chuẩn xác)
  submitMapAssetsToProject() {
    const selectedIds = Array.from(this.modalSelectedAssetIds);
    if (selectedIds.length === 0) {
      this.toastService.warning('Chưa chọn tài sản', 'Vui lòng chọn ít nhất 1 tài sản để gán vào dự án');
      return;
    }

    this.projectService.syncProjectAssets(this.projectId, selectedIds);
    this.loadProject();
    this.toastService.success(
      'Gán tài sản thành công',
      `Đã đồng bộ ${selectedIds.length} tài sản vào dự án ${this.project?.code}`
    );
    this.closeAddAssetModal();
    setTimeout(() => this.refreshAssetTabMap(), 200);
  }

  // --- TAB 4: TASK MANAGEMENT METHODS ---
  get projectTasks(): MaintenanceTask[] {
    let list = this.projectService.getProjectTasks(this.projectId);
    if (this.taskFilterLayer !== 'ALL') {
      list = list.filter(t => t.targetLayerId === this.taskFilterLayer || t.targetLayerId === 'ALL');
    }
    if (this.taskFilterStatus !== 'ALL') {
      list = list.filter(t => t.status === this.taskFilterStatus);
    }
    return list;
  }

  // Inline dropdown task status
  onInlineTaskStatusChange(task: MaintenanceTask, newStatus: TaskStatus) {
    this.projectService.updateTaskStatus(task.id, newStatus);
    this.toastService.success(
      'Cập nhật trạng thái công việc',
      `Công việc "${task.title}" chuyển sang "${this.getTaskStatusLabel(newStatus)}"`
    );
  }

  openCreateTaskModal() {
    this.newTask = {
      title: '',
      description: '',
      contractor: this.project?.contractor || 'Công ty CP Chiếu sáng & Cây xanh Đô thị Sài Gòn',
      assignedTeam: this.project?.contractor || 'Tổ Kỹ thuật Hiện trường 1',
      priority: 'MEDIUM',
      deadline: '2026-05-15',
      targetLayerId: 'ALL',
      assetIds: []
    };
    this.isCreateTaskModalOpen = true;
    this.isTaskAssetPickerOpen = false;
  }

  closeCreateTaskModal() {
    this.isCreateTaskModalOpen = false;
  }

  toggleTaskAssetSelection(assetId: string) {
    const idx = this.newTask.assetIds.indexOf(assetId);
    if (idx >= 0) {
      this.newTask.assetIds.splice(idx, 1);
    } else {
      this.newTask.assetIds.push(assetId);
    }
  }

  get availableProjectAssetsForTask(): Asset[] {
    // Only assets ALREADY IN THIS PROJECT, with filter by targetLayerId
    let list = this.projectService.getProjectAssets(this.projectId);
    if (this.newTask.targetLayerId !== 'ALL') {
      list = list.filter(a => a.layerId === this.newTask.targetLayerId);
    }
    return list;
  }

  submitCreateTask() {
    if (!this.newTask.title) return;

    const contractorName = this.newTask.contractor || this.project?.contractor || 'Công ty CP Chiếu sáng & Cây xanh Đô thị Sài Gòn';
    const task = this.projectService.createTask({
      projectId: this.projectId,
      title: this.newTask.title,
      description: this.newTask.description,
      contractor: contractorName,
      assignedTeam: this.newTask.assignedTeam || contractorName,
      targetLayerId: this.newTask.targetLayerId,
      priority: this.newTask.priority,
      deadline: this.newTask.deadline,
      assetIds: this.newTask.assetIds
    });

    this.toastService.success(
      'Tạo công việc thành công',
      `Công việc ${task.code} đã được giao cho ${task.contractor} kèm ${task.assetIds.length} tọa độ tài sản`
    );
    this.closeCreateTaskModal();
  }

  openTaskAssetsModal(task: MaintenanceTask) {
    this.selectedTaskForAssets = task;
    this.isTaskAssetsModalOpen = true;
  }

  closeTaskAssetsModal() {
    this.isTaskAssetsModalOpen = false;
    this.selectedTaskForAssets = null;
  }

  toggleExpandTask(taskId: string) {
    const task = this.projectService.getTaskById(taskId);
    if (task) {
      this.openTaskAssetsModal(task);
    }
  }

  onTaskAssetConditionChange(task: MaintenanceTask, assetItem: TaskAssetItem, newCondition: AssetCondition) {
    this.projectService.updateTaskAssetCondition(task.id, assetItem.assetId, newCondition, assetItem.notes);
    const updated = this.projectService.getTaskById(task.id);
    if (updated && this.selectedTaskForAssets?.id === task.id) {
      this.selectedTaskForAssets = updated;
    }
    this.toastService.success(
      'Cập nhật hiện trạng tài sản',
      `Tài sản ${assetItem.assetCode} (${assetItem.assetName}) trong công việc "${task.title}" đã chuyển sang: "${this.getAssetConditionLabel(newCondition)}"`
    );
  }

  onToggleTaskAssetComplete(task: MaintenanceTask, assetItem: TaskAssetItem) {
    const nextCompleted = !assetItem.isCompleted;
    this.projectService.setTaskAssetCompletion(task.id, assetItem.assetId, nextCompleted);
    this.loadProject();
    const updated = this.projectService.getTaskById(task.id);
    if (updated && this.selectedTaskForAssets?.id === task.id) {
      this.selectedTaskForAssets = updated;
    }
    this.toastService.success(
      'Cập nhật tiến độ tài sản',
      `Tài sản ${assetItem.assetCode} đã đánh dấu: "${nextCompleted ? 'Đã hoàn thành' : 'Chưa xong'}" trong công việc ${task.code}`
    );
  }

  onTaskAssetNotesChange(task: MaintenanceTask, assetItem: TaskAssetItem) {
    this.projectService.updateTaskAssetCondition(task.id, assetItem.assetId, assetItem.condition, assetItem.notes);
  }

  openMobileContractorForTask(task: MaintenanceTask) {
    this.router.navigate(['/mobile-contractor'], { queryParams: { taskId: task.id, projectId: this.projectId } });
  }

  // --- TAB 5: REPORTING & PAYMENT (SPLIT-VIEW) METHODS ---
  get projectReports(): ReportPayment[] {
    return this.projectService.getReports(this.projectId);
  }

  // AUTO-FILL Report Generation: automatically scans all COMPLETED tasks & photos
  generateAutoReport() {
    const report = this.projectService.generateAutoFillReport(this.projectId);
    this.toastService.success(
      'Tự động tổng hợp số liệu',
      `Hệ thống đã tự động quét ${report.totalCompletedTasks} Task hoàn thành và gom ${report.totalCompletedAssets} tài sản cùng ảnh hiện trường vào báo cáo ${report.code}`
    );
    this.openSplitViewInspection(report);
  }

  // Open Inspection SPLIT-VIEW Modal
  openSplitViewInspection(report: ReportPayment) {
    this.selectedReport = report;
    this.activeInspectionItem = report.items[0] || null;
    this.isSplitViewModalOpen = true;
  }

  closeSplitViewInspection() {
    this.isSplitViewModalOpen = false;
    this.selectedReport = null;
    this.activeInspectionItem = null;
  }

  selectInspectionItem(item: ReportItem) {
    this.activeInspectionItem = item;
  }

  toggleItemApproval(item: ReportItem, approved: boolean) {
    if (!this.selectedReport) return;
    this.projectService.approveReportItem(this.selectedReport.id, item.assetId, approved);
    item.inspectorApproved = approved;
    this.toastService.info(
      'Cập nhật kiểm tra tài sản',
      `${item.assetCode}: ${approved ? 'Đã xác nhận đạt yêu cầu' : 'Chưa đạt / yêu cầu khắc phục'}`
    );
  }

  approveEntireReport() {
    if (!this.selectedReport) return;
    this.projectService.finalizeReportApproval(this.selectedReport.id, 'KS. Hoàng Đình Hải (Cán bộ Ban QLDA)');
    this.toastService.success(
      'Phê duyệt thanh toán thành công',
      `Đã phê duyệt đợt thanh toán ${this.selectedReport.code} với số tiền ${this.formatMoney(this.selectedReport.amountRequested)} đ`
    );
    this.closeSplitViewInspection();
  }

  openRejectModal() {
    this.rejectionReason = '';
    this.isRejectModalOpen = true;
  }

  closeRejectModal() {
    this.isRejectModalOpen = false;
  }

  confirmRejectReport() {
    if (!this.selectedReport || !this.rejectionReason) return;
    this.projectService.rejectReport(this.selectedReport.id, this.rejectionReason);
    this.toastService.danger(
      'Đã từ chối báo cáo thanh toán',
      `Hồ sơ ${this.selectedReport.code} bị trả về để nhà thầu hoàn thiện lại`
    );
    this.closeRejectModal();
    this.closeSplitViewInspection();
  }

  markPaid(report: ReportPayment) {
    this.projectService.markReportPaid(report.id);
    this.toastService.success('Đã giải ngân', `Đã xác nhận giải ngân thành công cho đợt ${report.code}`);
  }

  // --- HELPERS & FORMATTERS ---
  formatMoney(amount?: number): string {
    if (!amount) return '0';
    return new Intl.NumberFormat('vi-VN').format(amount);
  }

  getAssetStatusLabel(status: AssetMaintenanceStatus): string {
    switch (status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'IN_PROGRESS': return 'Đang sửa';
      case 'COMPLETED': return 'Đã xong';
      default: return status;
    }
  }

  getTaskStatusLabel(status: TaskStatus): string {
    switch (status) {
      case 'NOT_STARTED': return 'Chưa bắt đầu';
      case 'IN_PROGRESS': return 'Đang thực hiện';
      case 'PAUSED': return 'Tạm dừng';
      case 'COMPLETED': return 'Hoàn thành';
      default: return status;
    }
  }

  getLayerBadgeClass(layerId: LayerId): string {
    switch (layerId) {
      case 'LIGHTING': return 'badge-layer-lighting';
      case 'GREENERY': return 'badge-layer-greenery';
      case 'DRAINAGE': return 'badge-layer-drainage';
      case 'ROADWAY': return 'badge-layer-roadway';
      default: return 'badge-secondary';
    }
  }

  getLayerColor(layerId: LayerId): string {
    switch (layerId) {
      case 'LIGHTING': return '#f59e0b';
      case 'GREENERY': return '#10b981';
      case 'DRAINAGE': return '#06b6d4';
      case 'ROADWAY': return '#8b5cf6';
      default: return '#64748b';
    }
  }
}
