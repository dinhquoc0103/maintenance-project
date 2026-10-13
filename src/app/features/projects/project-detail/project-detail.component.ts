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
  MaintenanceTask,
  TaskStatus,
  TaskPriority,
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

  // --- TAB 3: ASSET MAPPING STATE ---
  isAddAssetModalOpen = false;
  // BẮT BUỘC có Dropdown Chọn Lớp dữ liệu TRƯỚC KHI thực hiện 3 thao tác
  modalSelectedLayerId: LayerId = 'LIGHTING';
  modalSelectionMode: 'ROUTE' | 'POLYGON' | 'CHECKLIST' = 'CHECKLIST';
  modalSelectedRoute = 'Tất cả tuyến đường';
  modalSelectedAssetIds = new Set<string>();
  assetSearchKeyword = '';
  assetFilterLayer: string = 'ALL';
  assetFilterStatus: string = 'ALL';

  // Leaflet map instances
  private assetTabMap?: L.Map;
  private modalAssetMap?: L.Map;
  private modalMapMarkers: L.Marker[] = [];
  private polygonLayer?: L.Polygon;

  // --- TAB 4: TASK MANAGEMENT STATE ---
  isCreateTaskModalOpen = false;
  isTaskAssetPickerOpen = false;
  taskFilterLayer = 'ALL';
  taskFilterStatus = 'ALL';
  newTask: {
    title: string;
    description: string;
    assignedTeam: string;
    priority: TaskPriority;
    deadline: string;
    targetLayerId: LayerId | 'ALL';
    assetIds: string[];
  } = {
    title: '',
    description: '',
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

  // --- TAB 3: ASSET MAPPING METHODS ---
  get projectAssets(): Asset[] {
    let list = this.projectService.getProjectAssets(this.projectId);
    if (this.assetFilterLayer !== 'ALL') {
      list = list.filter(a => a.layerId === this.assetFilterLayer);
    }
    if (this.assetFilterStatus !== 'ALL') {
      list = list.filter(a => a.status === this.assetFilterStatus);
    }
    if (this.assetSearchKeyword.trim()) {
      const q = this.assetSearchKeyword.toLowerCase().trim();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.address.toLowerCase().includes(q));
    }
    return list;
  }

  // Inline editing of Asset maintenance status
  onInlineAssetStatusChange(asset: Asset, newStatus: AssetMaintenanceStatus) {
    this.projectService.updateAssetStatus(asset.id, newStatus);
    this.loadProject();
    this.toastService.success(
      'Cập nhật trực tiếp trạng thái',
      `Tài sản ${asset.code} đã chuyển sang "${this.getAssetStatusLabel(newStatus)}"`
    );
  }

  removeAsset(asset: Asset) {
    if (confirm(`Gỡ bỏ tài sản ${asset.code} (${asset.name}) khỏi dự án này?`)) {
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

      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="background-color: ${pinColor}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35);">
            ${ast.status === 'COMPLETED' ? '✓' : '●'}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([ast.lat, ast.lng], { icon }).addTo(this.assetTabMap!);
      bounds.push([ast.lat, ast.lng]);

      const statusBadge = ast.status === 'COMPLETED' ? '<span style="color: #059669; font-weight: 600;">Đã xong</span>' :
                          ast.status === 'IN_PROGRESS' ? '<span style="color: #2563eb; font-weight: 600;">Đang sửa</span>' :
                          '<span style="color: #d97706; font-weight: 600;">Chờ xử lý</span>';

      marker.bindPopup(`
        <div style="min-width: 180px; font-family: Inter, sans-serif;">
          <div style="font-size: 11px; color: ${pinColor}; font-weight: 700; text-transform: uppercase;">${ast.layerName}</div>
          <div style="font-weight: 600; font-size: 13px; margin: 3px 0;">${ast.name}</div>
          <div style="font-size: 11.5px; color: #64748b;">Mã: <b>${ast.code}</b></div>
          <div style="font-size: 11.5px; color: #64748b;">Đ/c: ${ast.address}</div>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 12px;">
            Trạng thái: ${statusBadge}
          </div>
        </div>
      `);
    });

    if (bounds.length > 0) {
      this.assetTabMap.fitBounds(L.latLngBounds(bounds), { padding: [30, 30] });
    }
  }

  // --- MODAL: THÊM TÀI SẢN VÀO DỰ ÁN (3 THAO TÁC + DROPDOWN LAYER BẮT BUỘC) ---
  openAddAssetModal() {
    this.isAddAssetModalOpen = true;
    this.modalSelectedAssetIds.clear();
    this.modalSelectionMode = 'CHECKLIST';
    setTimeout(() => this.initModalAssetMap(), 300);
  }

  closeAddAssetModal() {
    this.isAddAssetModalOpen = false;
    if (this.modalAssetMap) {
      this.modalAssetMap.remove();
      this.modalAssetMap = undefined;
    }
  }

  onModalLayerChange() {
    // When layer changes, re-filter pool and update map markers
    this.modalSelectedAssetIds.clear();
    if (this.modalSelectionMode === 'ROUTE') {
      this.applyRouteSelection();
    }
    this.updateModalMapMarkers();
  }

  setModalSelectionMode(mode: 'ROUTE' | 'POLYGON' | 'CHECKLIST') {
    this.modalSelectionMode = mode;
    if (mode === 'ROUTE') {
      this.applyRouteSelection();
    } else if (mode === 'POLYGON') {
      this.drawSimulatedPolygonArea();
    }
  }

  // Thao tác 1: Chọn theo tuyến đường
  applyRouteSelection() {
    const pool = this.getModalLayerAssets();
    this.modalSelectedAssetIds.clear();

    pool.forEach(a => {
      if (this.modalSelectedRoute === 'Tất cả tuyến đường' || a.route.includes(this.modalSelectedRoute)) {
        this.modalSelectedAssetIds.add(a.id);
      }
    });

    this.updateModalMapMarkers();
  }

  // Thao tác 2: Vẽ vùng trên bản đồ (Polygon selection)
  drawSimulatedPolygonArea() {
    if (!this.modalAssetMap) return;

    if (this.polygonLayer) {
      this.modalAssetMap.removeLayer(this.polygonLayer);
    }

    // Bounding polygon around District 1 core
    const polygonCoords: L.LatLngExpression[] = [
      [10.7765, 106.7015],
      [10.7770, 106.7045],
      [10.7735, 106.7055],
      [10.7725, 106.7020]
    ];

    this.polygonLayer = L.polygon(polygonCoords, {
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.2,
      weight: 2,
      dashArray: '5, 5'
    }).addTo(this.modalAssetMap);

    // Pick assets inside this polygon bounds
    const pool = this.getModalLayerAssets();
    this.modalSelectedAssetIds.clear();

    const bounds = this.polygonLayer.getBounds();
    pool.forEach(a => {
      if (bounds.contains([a.lat, a.lng])) {
        this.modalSelectedAssetIds.add(a.id);
      }
    });

    this.toastService.info('Vẽ vùng GIS', `Hệ thống tự động gom ${this.modalSelectedAssetIds.size} tài sản thuộc lớp dữ liệu trong phạm vi khoanh vùng`);
    this.updateModalMapMarkers();
  }

  // Thao tác 3: Tick checklist
  toggleModalAsset(assetId: string) {
    if (this.modalSelectedAssetIds.has(assetId)) {
      this.modalSelectedAssetIds.delete(assetId);
    } else {
      this.modalSelectedAssetIds.add(assetId);
    }
    this.updateModalMapMarkers();
  }

  selectAllModalAssets() {
    const pool = this.getModalLayerAssets();
    pool.forEach(a => this.modalSelectedAssetIds.add(a.id));
    this.updateModalMapMarkers();
  }

  deselectAllModalAssets() {
    this.modalSelectedAssetIds.clear();
    this.updateModalMapMarkers();
  }

  getModalLayerAssets(): Asset[] {
    // Only show assets of the SELECTED LAYER that are in master map
    return this.projectService.masterAssets().filter(a => a.layerId === this.modalSelectedLayerId);
  }

  isAssetAlreadyInProject(assetId: string): boolean {
    const a = this.projectService.masterAssets().find(x => x.id === assetId);
    return a?.assignedProjectId === this.projectId;
  }

  initModalAssetMap() {
    if (!this.modalMapContainer) return;

    const container = this.modalMapContainer.nativeElement;
    this.modalAssetMap = L.map(container).setView([10.7745, 106.7025], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.modalAssetMap);

    this.updateModalMapMarkers();
  }

  updateModalMapMarkers() {
    if (!this.modalAssetMap) return;

    this.modalMapMarkers.forEach(m => this.modalAssetMap?.removeLayer(m));
    this.modalMapMarkers = [];

    const assets = this.getModalLayerAssets();
    const bounds: L.LatLngExpression[] = [];

    assets.forEach(ast => {
      const isSelected = this.modalSelectedAssetIds.has(ast.id);
      const isAlreadyIn = ast.assignedProjectId === this.projectId;

      const bg = isSelected ? '#2563eb' : (isAlreadyIn ? '#94a3b8' : '#f59e0b');
      const border = isSelected ? '3px solid #ffffff' : '2px solid #ffffff';

      const icon = L.divIcon({
        className: 'modal-pin',
        html: `
          <div style="background-color: ${bg}; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; border: ${border}; box-shadow: 0 2px 6px rgba(0,0,0,0.35); cursor: pointer;">
            ${isSelected ? '✓' : '●'}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([ast.lat, ast.lng], { icon }).addTo(this.modalAssetMap!);
      bounds.push([ast.lat, ast.lng]);

      marker.on('click', () => {
        this.toggleModalAsset(ast.id);
      });

      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; font-size: 12px;">
          <b>${ast.code}</b>: ${ast.name}<br/>
          <span style="color: #64748b;">${ast.address}</span><br/>
          <div style="margin-top: 6px;">
            <button style="padding: 3px 8px; font-size: 11px; border-radius: 4px; border: 1px solid #3b82f6; background: ${isSelected ? '#ef4444' : '#2563eb'}; color: white; cursor: pointer;">
              ${isSelected ? 'Bỏ chọn' : 'Chọn gán'}
            </button>
          </div>
        </div>
      `);

      this.modalMapMarkers.push(marker);
    });

    if (bounds.length > 0) {
      this.modalAssetMap.fitBounds(L.latLngBounds(bounds), { padding: [20, 20] });
    }
  }

  submitMapAssetsToProject() {
    const selectedIds = Array.from(this.modalSelectedAssetIds);
    if (selectedIds.length === 0) {
      this.toastService.warning('Chưa chọn tài sản', 'Vui lòng chọn ít nhất 1 tài sản để gán vào dự án');
      return;
    }

    this.projectService.mapAssetsToProject(this.projectId, selectedIds);
    this.loadProject();
    this.toastService.success(
      'Gán tài sản thành công',
      `Đã ánh xạ (map) ${selectedIds.length} tài sản từ Master Map vào dự án ${this.project?.code}`
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
      assignedTeam: 'Tổ Kỹ thuật Hiện trường 1',
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

    const task = this.projectService.createTask({
      projectId: this.projectId,
      title: this.newTask.title,
      description: this.newTask.description,
      contractor: this.project?.contractor || 'Đơn vị thi công',
      assignedTeam: this.newTask.assignedTeam,
      targetLayerId: this.newTask.targetLayerId,
      priority: this.newTask.priority,
      deadline: this.newTask.deadline,
      assetIds: this.newTask.assetIds
    });

    this.toastService.success(
      'Tạo công việc thành công',
      `Công việc ${task.code} đã được giao cho ${task.assignedTeam} kèm ${task.assetIds.length} tọa độ tài sản`
    );
    this.closeCreateTaskModal();
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
