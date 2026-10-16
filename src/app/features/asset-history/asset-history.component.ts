import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MaintenanceHistoryService } from '../../core/services/maintenance-history.service';
import { ToastService } from '../../core/services/toast.service';
import {
  MaintenanceHistoryItem,
  HistoryLayerId,
  EvidencePhotoItem
} from '../../core/models/maintenance-history.model';

@Component({
  selector: 'app-asset-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './asset-history.component.html',
  styleUrls: ['./asset-history.component.scss']
})
export class AssetHistoryComponent {
  historyService = inject(MaintenanceHistoryService);
  toastService = inject(ToastService);
  router = inject(Router);

  // Active Category Tab: Nhà thầu (CONTRACTOR) vs Đội nội bộ (INTERNAL_TEAM)
  activeTab = signal<'CONTRACTOR' | 'INTERNAL_TEAM'>('CONTRACTOR');

  // Filter form local state
  selectedLayer: HistoryLayerId | 'ALL' = 'ALL';
  selectedRoute: string = 'Tất cả';
  selectedProject: string = 'ALL';
  selectedContractorOrTeam: string = 'ALL';
  searchKeyword: string = '';
  activeQuickTime: '7_DAYS' | '30_DAYS' | 'ALL' = 'ALL';

  // Modal inspection state
  selectedRecord = signal<MaintenanceHistoryItem | null>(null);
  selectedTeamRecord = signal<MaintenanceHistoryItem | null>(null);
  
  // Edit note modal state
  isEditNoteModalOpen = signal<boolean>(false);
  originalNoteText = signal<string>('');
  managementNoteText = signal<string>('');

  // GIS Map modal state (Popup bản đồ tại chỗ)
  isGisModalOpen = signal<boolean>(false);
  gisRecord = signal<MaintenanceHistoryItem | null>(null);

  // Multiple photos gallery state (Tối đa 5 ảnh Trước và 5 ảnh Sau cho Nội bộ)
  activeBeforeIndex = signal<number>(0);
  activeAfterIndex = signal<number>(0);

  // Pagination state
  pageSize = 10;
  currentPage = 1;

  constructor() {
    // Initialize filter for default tab CONTRACTOR
    this.historyService.updateFilter({
      executorType: 'CONTRACTOR'
    });
  }

  get filteredRecords(): MaintenanceHistoryItem[] {
    return this.historyService.filteredRecords();
  }

  get tabKpis() {
    return this.historyService.getTabKpis(this.activeTab());
  }

  // Count items for tab badges
  get contractorCount(): number {
    return this.historyService.records().filter((r) => r.executorType === 'CONTRACTOR').length;
  }

  get internalCount(): number {
    return this.historyService.records().filter((r) => r.executorType === 'INTERNAL_TEAM').length;
  }

  setActiveTab(tab: 'CONTRACTOR' | 'INTERNAL_TEAM') {
    this.activeTab.set(tab);
    this.selectedProject = 'ALL';
    this.selectedContractorOrTeam = 'ALL';
    this.currentPage = 1;
    this.historyService.updateFilter({
      executorType: tab,
      projectIdOrCode: 'ALL',
      contractorOrTeamFilter: 'ALL'
    });
  }

  setQuickTime(type: '7_DAYS' | '30_DAYS' | 'ALL') {
    this.activeQuickTime = type;
    let startDate = '';
    let endDate = '';

    if (type === '7_DAYS') {
      startDate = '2025-05-20';
      endDate = '2025-05-30';
    } else if (type === '30_DAYS') {
      startDate = '2025-05-01';
      endDate = '2025-05-30';
    }

    this.historyService.updateFilter({
      startDate,
      endDate
    });
    this.applyFilter(false);
  }

  applyFilter(showToast: boolean = false) {
    this.historyService.updateFilter({
      layerId: this.selectedLayer,
      routeName: this.selectedRoute,
      projectIdOrCode: this.selectedProject,
      executorType: this.activeTab(),
      contractorOrTeamFilter: this.selectedContractorOrTeam,
      searchKeyword: this.searchKeyword
    });
    this.currentPage = 1;
    if (showToast) {
      this.toastService.info(
        'Bộ lọc đã cập nhật',
        `Tìm thấy ${this.filteredRecords.length} kết quả phù hợp.`
      );
    }
  }

  resetFilter() {
    this.selectedLayer = 'ALL';
    this.selectedRoute = 'Tất cả';
    this.selectedProject = 'ALL';
    this.selectedContractorOrTeam = 'ALL';
    this.searchKeyword = '';
    this.activeQuickTime = 'ALL';
    this.historyService.resetFilter();
    this.historyService.updateFilter({
      executorType: this.activeTab()
    });
    this.currentPage = 1;
    this.toastService.info('Đã đặt lại bộ lọc', 'Hiển thị dữ liệu mặc định của tab');
  }

  refreshData() {
    this.toastService.info('Làm mới dữ liệu', 'Đang đồng bộ dữ liệu lịch sử từ GIS...');
  }

  exportExcel() {
    const tabName = this.activeTab() === 'CONTRACTOR' ? 'Nha_Thau' : 'Noi_Bo';
    this.toastService.success(
      'Xuất báo cáo Excel thành công',
      `Đã xuất tệp: Bao_Cao_Duy_Tu_${tabName}_2025.xlsx (${this.filteredRecords.length} bản ghi)`
    );
  }

  openTeamMembersModal(record: MaintenanceHistoryItem) {
    this.selectedTeamRecord.set(record);
  }

  closeTeamMembersModal() {
    this.selectedTeamRecord.set(null);
  }

  openEvidenceModal(record: MaintenanceHistoryItem) {
    this.selectedRecord.set(record);
    this.activeBeforeIndex.set(0);
    this.activeAfterIndex.set(0);
  }

  closeEvidenceModal() {
    this.selectedRecord.set(null);
  }

  selectLinkedAsset(assetCode: string) {
    const target = this.historyService.getRecordByAssetCode(assetCode);
    if (target) {
      this.selectedRecord.set(target);
      this.activeBeforeIndex.set(0);
      this.activeAfterIndex.set(0);
      this.toastService.info(
        'Chuyển đối chiếu tài sản liên đới',
        `Đang xem minh chứng tài sản ${assetCode} trong cùng sự cố`
      );
    } else {
      this.toastService.info(
        'Tài sản liên kết trong cụm',
        `Tài sản ${assetCode} chia sẻ chung biên bản và ảnh hiện trường với sự cố này.`
      );
    }
  }

  // Get gallery list of photos for internal team
  getBeforePhotos(record: MaintenanceHistoryItem): EvidencePhotoItem[] {
    if (record.beforePhotos && record.beforePhotos.length > 0) {
      return record.beforePhotos;
    }
    return [
      {
        id: 'bp-0',
        url: record.beforePhoto.url,
        caption: record.beforePhoto.caption,
        timestamp: record.beforePhoto.timestamp,
        gpsCoordinates: record.beforePhoto.gpsCoordinates,
        note: record.beforePhoto.initialStateNote
      }
    ];
  }

  getAfterPhotos(record: MaintenanceHistoryItem): EvidencePhotoItem[] {
    if (record.afterPhotos && record.afterPhotos.length > 0) {
      return record.afterPhotos;
    }
    return [
      {
        id: 'ap-0',
        url: record.afterPhoto.url,
        caption: record.afterPhoto.caption,
        timestamp: record.afterPhoto.timestamp,
        gpsCoordinates: record.afterPhoto.gpsCoordinates,
        note: record.afterPhoto.inspectionResult
      }
    ];
  }

  getShortSla(record: MaintenanceHistoryItem): string {
    if (!record.internalTeamDetails?.slaResponseTime) {
      return '1h45p';
    }
    const parts = record.internalTeamDetails.slaResponseTime.split('(');
    return parts.length > 0 ? parts[0].trim() : '1h45p';
  }

  get activeBeforePhoto(): EvidencePhotoItem | null {
    const rec = this.selectedRecord();
    if (!rec) return null;
    const photos = this.getBeforePhotos(rec);
    return photos[this.activeBeforeIndex()] || photos[0] || null;
  }

  get activeAfterPhoto(): EvidencePhotoItem | null {
    const rec = this.selectedRecord();
    if (!rec) return null;
    const photos = this.getAfterPhotos(rec);
    return photos[this.activeAfterIndex()] || photos[0] || null;
  }

  setActiveBeforePhoto(index: number) {
    this.activeBeforeIndex.set(index);
  }

  setActiveAfterPhoto(index: number) {
    this.activeAfterIndex.set(index);
  }

  // Edit Note Modal methods
  openEditNote(record: MaintenanceHistoryItem) {
    this.selectedRecord.set(record);
    this.originalNoteText.set(record.technicalNotes);
    this.managementNoteText.set(record.managementNote || '');
    this.isEditNoteModalOpen.set(true);
  }

  closeEditNote() {
    this.isEditNoteModalOpen.set(false);
  }

  saveManagementNote() {
    const rec = this.selectedRecord();
    if (rec) {
      this.historyService.updateManagementNote(rec.id, this.managementNoteText());
      // Refresh current selected item
      this.selectedRecord.set({
        ...rec,
        managementNote: this.managementNoteText(),
        managementNoteUpdatedAt: 'Vừa xong',
        managementNoteUpdatedBy: 'Ban QLDA Hạ tầng'
      });
      this.isEditNoteModalOpen.set(false);
      this.toastService.success(
        'Lưu ghi chú thành công',
        `Đã cập nhật ý kiến chỉ đạo của Ban QLDA cho tài sản ${rec.assetCode}`
      );
    }
  }

  // GIS Modal methods (Popup bản đồ tại chỗ)
  openGisModal(record: MaintenanceHistoryItem) {
    this.gisRecord.set(record);
    this.isGisModalOpen.set(true);
  }

  closeGisModal() {
    this.isGisModalOpen.set(false);
    this.gisRecord.set(null);
  }

  openFullMap(record: MaintenanceHistoryItem) {
    this.toastService.info(
      'Mở bản đồ Master GIS toàn màn hình',
      `Định vị tài sản ${record.assetCode}`
    );
    this.router.navigate(['/master-map'], {
      queryParams: { asset: record.assetCode }
    });
  }

  downloadPdf(record: MaintenanceHistoryItem) {
    if (record.executorType === 'CONTRACTOR') {
      this.toastService.success(
        'Tải biên bản ảnh thành công',
        `Tệp: Bien_Ban_Doi_Chieu_Anh_${record.assetCode}.pdf đã được tạo có ký số hợp lệ.`
      );
    } else {
      this.toastService.success(
        'Tải phiếu xử lý sự cố thành công',
        `Tệp: Phieu_Xu_Ly_Su_Co_${record.projectOrIncidentCode}_${record.assetCode}.pdf đã được tạo.`
      );
    }
  }
}
