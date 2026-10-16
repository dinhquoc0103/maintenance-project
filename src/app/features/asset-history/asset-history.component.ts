import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MaintenanceHistoryService } from '../../core/services/maintenance-history.service';
import { ToastService } from '../../core/services/toast.service';
import {
  MaintenanceHistoryItem,
  HistoryLayerId,
  MaintenanceExecutorType
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

  // Filter form local state
  selectedLayer: HistoryLayerId | 'ALL' = 'ALL';
  selectedRoute: string = 'Tất cả';
  selectedProject: string = 'ALL';
  selectedExecutorType: 'ALL' | 'CONTRACTOR' | 'INTERNAL_TEAM' = 'ALL';
  searchKeyword: string = '';
  activeQuickTime: '7_DAYS' | '30_DAYS' | 'ALL' = 'ALL';

  // Modal inspection state
  selectedRecord = signal<MaintenanceHistoryItem | null>(null);
  selectedTeamRecord = signal<MaintenanceHistoryItem | null>(null);
  isEditNoteModalOpen = signal<boolean>(false);
  editingNoteText = signal<string>('');

  openTeamMembersModal(record: MaintenanceHistoryItem) {
    this.selectedTeamRecord.set(record);
  }

  closeTeamMembersModal() {
    this.selectedTeamRecord.set(null);
  }

  // Pagination state
  pageSize = 10;
  currentPage = 1;

  get filteredRecords(): MaintenanceHistoryItem[] {
    return this.historyService.filteredRecords();
  }

  get stats() {
    return this.historyService.kpiStats();
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
      executorType: this.selectedExecutorType,
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
    this.selectedExecutorType = 'ALL';
    this.searchKeyword = '';
    this.activeQuickTime = 'ALL';
    this.historyService.resetFilter();
    this.currentPage = 1;
    this.toastService.info('Đã đặt lại bộ lọc', 'Hiển thị toàn bộ lịch sử duy tu');
  }

  refreshData() {
    this.toastService.info('Làm mới dữ liệu', 'Đang đồng bộ dữ liệu lịch sử từ GIS...');
  }

  exportExcel() {
    this.toastService.success(
      'Xuất báo cáo Excel thành công',
      'Đã xuất tệp: Bao_Cao_Lich_Su_Duy_Tu_Tai_San_2025.xlsx (1.428 bản ghi)'
    );
  }

  openEvidenceModal(record: MaintenanceHistoryItem) {
    this.selectedRecord.set(record);
  }

  closeEvidenceModal() {
    this.selectedRecord.set(null);
  }

  selectLinkedAsset(assetCode: string) {
    const target = this.historyService.getRecordByAssetCode(assetCode);
    if (target) {
      this.selectedRecord.set(target);
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

  openEditNote(record: MaintenanceHistoryItem) {
    this.selectedRecord.set(record);
    this.editingNoteText.set(record.technicalNotes);
    this.isEditNoteModalOpen.set(true);
  }

  closeEditNote() {
    this.isEditNoteModalOpen.set(false);
  }

  saveNote() {
    const rec = this.selectedRecord();
    if (rec) {
      this.historyService.updateTechnicalNote(rec.id, this.editingNoteText());
      // Refresh current selected item
      this.selectedRecord.set({
        ...rec,
        technicalNotes: this.editingNoteText()
      });
      this.isEditNoteModalOpen.set(false);
      this.toastService.success(
        'Lưu ghi chú thành công',
        `Đã cập nhật biên bản kỹ thuật cho tài sản ${rec.assetCode}`
      );
    }
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

  viewOnGis(record: MaintenanceHistoryItem) {
    this.toastService.info(
      'Mở bản đồ Master GIS',
      `Định vị tài sản ${record.assetCode} tại tọa độ ${record.beforePhoto.gpsCoordinates}`
    );
    this.router.navigate(['/master-map'], {
      queryParams: { asset: record.assetCode }
    });
  }
}
