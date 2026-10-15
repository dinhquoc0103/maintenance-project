import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';
import {
  Project,
  MaintenanceTask,
  Asset,
  LayerId,
  AssetCondition,
  ReportPayment,
  ReportItem
} from '../../core/models/maintenance.model';

export interface ContractorAssetDraft {
  assetId: string;
  assetCode: string;
  assetName: string;
  layerId: LayerId;
  layerName: string;
  address: string;
  lat: number;
  lng: number;
  isSelected: boolean;
  isCompleted: boolean;
  condition: AssetCondition;
  cost: number;
  photoBeforeUrl: string;
  photoAfterUrl: string;
  photoUrl: string;
  notes: string;
  completedDate: string;
  technicianName: string;
  // Bổ sung thuộc tính hình học dạng tuyến / đoạn đường
  geometryType?: 'POINT' | 'LINE';
  lengthMeters?: number;
  widthMeters?: number;
  areaSquareMeters?: number;
  chainage?: string;
  startPoint?: { lat: number; lng: number; label?: string };
  endPoint?: { lat: number; lng: number; label?: string };
}

@Component({
  selector: 'app-contractor-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './contractor-report.component.html',
  styleUrls: ['./contractor-report.component.scss']
})
export class ContractorReportComponent implements OnInit {
  projectService = inject(ProjectService);
  toastService = inject(ToastService);

  // Danh sách nhà thầu & Nhà thầu hiện tại đang thao tác
  contractorList: string[] = [
    'Công ty CP Chiếu sáng & Cây xanh Đô thị Sài Gòn',
    'Công ty TNHH Thoát nước & Công trình Giao thông Đô thị',
    'Công ty CP Xây dựng Hạ tầng Đô thị Đông Á'
  ];
  selectedContractor: string = 'Công ty CP Chiếu sáng & Cây xanh Đô thị Sài Gòn';

  // Chế độ màn hình: 'LIST' (Danh sách báo cáo đã gửi) | 'CREATE' (Màn hình lập báo cáo mới)
  currentView: 'LIST' | 'CREATE' = 'LIST';

  // State màn hình tạo báo cáo
  selectedProjectId: string = '';
  selectedTaskId: string = '';
  reportPeriodTitle: string = '';
  technicianGeneralName: string = 'Kỹ sư Trần Đình Nam (Tổ trưởng thi công)';

  // Danh sách tài sản trong task đang soạn thảo
  assetDrafts: ContractorAssetDraft[] = [];
  activeAssetDraft: ContractorAssetDraft | null = null;

  // Modal xem chi tiết đợt báo cáo đã gửi (Split-view)
  selectedReportDetail: ReportPayment | null = null;
  activeInspectionItem: ReportItem | null = null;

  ngOnInit() {
    // Khởi tạo mặc định dự án đầu tiên nếu có
    const projects = this.contractorProjects;
    if (projects.length > 0) {
      this.selectedProjectId = projects[0].id;
    }
  }

  // Lọc các dự án mà nhà thầu hiện tại đang tham gia
  get contractorProjects(): Project[] {
    return this.projectService.projects().filter(
      p => p.contractor === this.selectedContractor || !p.contractor
    );
  }

  // Danh sách báo cáo của nhà thầu hiện tại
  get contractorReports(): ReportPayment[] {
    return this.projectService.reports().filter(
      r => r.contractor === this.selectedContractor || !r.contractor
    );
  }

  // KPI thống kê
  get pendingReportsCount(): number {
    return this.contractorReports.filter(r => r.status === 'PENDING_INSPECTION').length;
  }

  get approvedReportsCount(): number {
    return this.contractorReports.filter(r => r.status === 'APPROVED' || r.status === 'PAID').length;
  }

  get totalRequestedAmount(): number {
    return this.contractorReports.reduce((sum, r) => sum + r.amountRequested, 0);
  }

  get selectedProject(): Project | undefined {
    return this.projectService.getProjectById(this.selectedProjectId);
  }

  // Danh sách các task thuộc dự án đã chọn
  get availableTasks(): MaintenanceTask[] {
    if (!this.selectedProjectId) return [];
    return this.projectService.getProjectTasks(this.selectedProjectId);
  }

  get selectedTask(): MaintenanceTask | undefined {
    return this.availableTasks.find(t => t.id === this.selectedTaskId);
  }

  // Các tài sản được tick chọn đưa vào báo cáo
  get selectedDraftAssets(): ContractorAssetDraft[] {
    return this.assetDrafts.filter(a => a.isSelected);
  }

  // Tổng kinh phí đề nghị của các tài sản được tick chọn
  get totalDraftAmount(): number {
    return this.selectedDraftAssets.reduce((sum, a) => sum + (Number(a.cost) || 0), 0);
  }

  // Đổi nhà thầu đang đăng nhập/thao tác
  onContractorChange(contractor: string) {
    this.selectedContractor = contractor;
    const projects = this.contractorProjects;
    if (projects.length > 0) {
      this.selectedProjectId = projects[0].id;
      this.selectedTaskId = '';
      this.assetDrafts = [];
      this.activeAssetDraft = null;
    }
  }

  // Chuyển sang màn hình tạo báo cáo
  openCreateReport() {
    this.currentView = 'CREATE';
    if (!this.selectedProjectId && this.contractorProjects.length > 0) {
      this.selectedProjectId = this.contractorProjects[0].id;
    }
    if (this.availableTasks.length > 0) {
      this.onSelectTask(this.availableTasks[0].id);
    }
  }

  cancelCreateReport() {
    this.currentView = 'LIST';
    this.assetDrafts = [];
    this.activeAssetDraft = null;
  }

  // Khi chọn Dự án
  onSelectProject(projectId: string) {
    this.selectedProjectId = projectId;
    this.selectedTaskId = '';
    this.assetDrafts = [];
    this.activeAssetDraft = null;

    if (this.availableTasks.length > 0) {
      this.onSelectTask(this.availableTasks[0].id);
    }
  }

  // Khi chọn Task
  onSelectTask(taskId: string) {
    this.selectedTaskId = taskId;
    const task = this.selectedTask;
    const project = this.selectedProject;
    if (!task) {
      this.assetDrafts = [];
      this.activeAssetDraft = null;
      return;
    }

    // Tự động sinh tiêu đề đợt báo cáo mẫu
    const reportCount = this.contractorReports.length + 1;
    this.reportPeriodTitle = `Báo cáo nghiệm thu & Đề nghị thanh toán Đợt ${reportCount} - ${task.title}`;

    // Lấy danh sách tài sản từ task (TaskAssetItem hoặc assetIds)
    const projectAssets = this.projectService.getProjectAssets(task.projectId);
    const drafts: ContractorAssetDraft[] = [];

    // Duyệt qua danh sách tài sản của task
    if (task.taskAssets && task.taskAssets.length > 0) {
      task.taskAssets.forEach(ta => {
        const fullAsset = projectAssets.find(a => a.id === ta.assetId);
        const cost = this.getDefaultAssetCost(fullAsset?.layerId || ta.layerId || 'LIGHTING');
        const before = ta.photoBeforeUrl || '';
        const after = ta.photoAfterUrl || '';
        drafts.push({
          assetId: ta.assetId,
          assetCode: ta.assetCode,
          assetName: ta.assetName,
          layerId: ta.layerId || fullAsset?.layerId || 'LIGHTING',
          layerName: this.getLayerName(ta.layerId || fullAsset?.layerId || 'LIGHTING'),
          address: fullAsset?.address || 'Tuyến công trình trung tâm',
          lat: fullAsset?.lat || ta.startPoint?.lat || 10.7758,
          lng: fullAsset?.lng || ta.startPoint?.lng || 106.7028,
          isSelected: true, // Mặc định chọn
          isCompleted: ta.isCompleted !== undefined ? ta.isCompleted : true,
          condition: ta.condition || 'GOOD',
          cost: cost,
          photoBeforeUrl: before,
          photoAfterUrl: after,
          photoUrl: after || before,
          notes: ta.notes || 'Đã hoàn thành thi công, kiểm tra kỹ thuật đạt tiêu chuẩn thiết kế.',
          completedDate: ta.completedDate || new Date().toISOString().substring(0, 10),
          technicianName: this.technicianGeneralName,
          geometryType: ta.geometryType || fullAsset?.geometryType || (ta.layerId === 'ROADWAY' ? 'LINE' : 'POINT'),
          lengthMeters: ta.lengthMeters || fullAsset?.lengthMeters,
          widthMeters: ta.widthMeters || fullAsset?.widthMeters,
          areaSquareMeters: ta.areaSquareMeters || fullAsset?.areaSquareMeters,
          chainage: ta.chainage || fullAsset?.chainage,
          startPoint: ta.startPoint || fullAsset?.startPoint,
          endPoint: ta.endPoint || fullAsset?.endPoint
        });
      });
    } else if (task.assetIds && task.assetIds.length > 0) {
      task.assetIds.forEach(aid => {
        const fullAsset = projectAssets.find(a => a.id === aid);
        if (fullAsset) {
          const isDone = task.completedAssetIds.includes(aid);
          const cost = this.getDefaultAssetCost(fullAsset.layerId);
          drafts.push({
            assetId: fullAsset.id,
            assetCode: fullAsset.code,
            assetName: fullAsset.name,
            layerId: fullAsset.layerId,
            layerName: fullAsset.layerName,
            address: fullAsset.address,
            lat: fullAsset.lat,
            lng: fullAsset.lng,
            isSelected: true,
            isCompleted: isDone || true,
            condition: 'GOOD',
            cost: cost,
            photoBeforeUrl: '',
            photoAfterUrl: '',
            photoUrl: '',
            notes: 'Đã hoàn tất thi công bảo trì hiện trường và kiểm tra vận hành an toàn.',
            completedDate: new Date().toISOString().substring(0, 10),
            technicianName: this.technicianGeneralName,
            geometryType: fullAsset.geometryType || (fullAsset.layerId === 'ROADWAY' ? 'LINE' : 'POINT'),
            lengthMeters: fullAsset.lengthMeters,
            widthMeters: fullAsset.widthMeters,
            areaSquareMeters: fullAsset.areaSquareMeters,
            chainage: fullAsset.chainage,
            startPoint: fullAsset.startPoint,
            endPoint: fullAsset.endPoint
          });
        }
      });
    }

    this.assetDrafts = drafts;
    this.activeAssetDraft = drafts.length > 0 ? drafts[0] : null;
  }

  // Chọn tài sản active để hiển thị chi tiết bên phải
  selectActiveAsset(draft: ContractorAssetDraft) {
    this.activeAssetDraft = draft;
  }

  // Tick chọn đưa vào / bỏ khỏi đợt báo cáo
  toggleAssetSelection(draft: ContractorAssetDraft, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    draft.isSelected = !draft.isSelected;
  }

  // Chọn tất cả / Bỏ chọn tất cả
  selectAllAssets(selectAll: boolean) {
    this.assetDrafts.forEach(a => a.isSelected = selectAll);
  }

  // Upload ảnh trước khi khắc phục từ máy tính
  onUploadPhotoBefore(event: any) {
    const file = event.target?.files?.[0];
    if (file && this.activeAssetDraft) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.activeAssetDraft) {
          this.activeAssetDraft.photoBeforeUrl = e.target.result;
          if (!this.activeAssetDraft.photoUrl) {
            this.activeAssetDraft.photoUrl = e.target.result;
          }
          this.toastService.success('Đã tải ảnh trước khắc phục', `Ảnh "${file.name}" đã được tải lên thành công`);
        }
      };
      reader.readAsDataURL(file);
    }
    if (event.target) event.target.value = '';
  }

  // Upload ảnh sau khi khắc phục / nghiệm thu từ máy tính
  onUploadPhotoAfter(event: any) {
    const file = event.target?.files?.[0];
    if (file && this.activeAssetDraft) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.activeAssetDraft) {
          this.activeAssetDraft.photoAfterUrl = e.target.result;
          this.activeAssetDraft.photoUrl = e.target.result;
          this.toastService.success('Đã tải ảnh sau khắc phục', `Ảnh "${file.name}" đã được tải lên thành công`);
        }
      };
      reader.readAsDataURL(file);
    }
    if (event.target) event.target.value = '';
  }

  // Xóa ảnh trước khi khắc phục
  removePhotoBefore() {
    if (this.activeAssetDraft) {
      this.activeAssetDraft.photoBeforeUrl = '';
      this.activeAssetDraft.photoUrl = this.activeAssetDraft.photoAfterUrl || '';
      this.toastService.info('Đã gỡ ảnh', 'Đã gỡ ảnh trước khi khắc phục');
    }
  }

  // Xóa ảnh sau khi khắc phục
  removePhotoAfter() {
    if (this.activeAssetDraft) {
      this.activeAssetDraft.photoAfterUrl = '';
      this.activeAssetDraft.photoUrl = this.activeAssetDraft.photoBeforeUrl || '';
      this.toastService.info('Đã gỡ ảnh', 'Đã gỡ ảnh sau khi khắc phục');
    }
  }

  // Nộp Báo Cáo Nghiệm Thu
  submitContractorReport() {
    if (!this.selectedProjectId) {
      this.toastService.warning('Chưa chọn dự án', 'Vui lòng chọn dự án thực hiện');
      return;
    }
    if (!this.selectedTaskId) {
      this.toastService.warning('Chưa chọn task', 'Vui lòng chọn đầu việc cần nghiệm thu');
      return;
    }
    if (this.selectedDraftAssets.length === 0) {
      this.toastService.warning('Chưa chọn tài sản', 'Vui lòng chọn ít nhất 1 tài sản để đề nghị nghiệm thu');
      return;
    }

    const task = this.selectedTask;
    const project = this.selectedProject;

    // Chuyển đổi sang ReportItem[]
    const items: ReportItem[] = this.selectedDraftAssets.map(a => ({
      assetId: a.assetId,
      assetCode: a.assetCode,
      assetName: a.assetName,
      layerId: a.layerId,
      layerName: a.layerName,
      taskId: task?.id || 't-1',
      taskTitle: task?.title || 'Công việc bảo trì',
      completedDate: a.completedDate || new Date().toISOString().substring(0, 10),
      photoUrl: a.photoAfterUrl || a.photoBeforeUrl || '',
      photoBeforeUrl: a.photoBeforeUrl || '',
      photoAfterUrl: a.photoAfterUrl || '',
      lat: a.lat,
      lng: a.lng,
      cost: Number(a.cost) || 0,
      inspectorApproved: false,
      inspectorNotes: a.notes,
      geometryType: a.geometryType,
      lengthMeters: a.lengthMeters,
      widthMeters: a.widthMeters,
      areaSquareMeters: a.areaSquareMeters,
      chainage: a.chainage,
      startPoint: a.startPoint,
      endPoint: a.endPoint
    }));

    // Cập nhật trạng thái từng tài sản trong task tương ứng
    this.selectedDraftAssets.forEach(a => {
      this.projectService.setTaskAssetCompletion(
        this.selectedTaskId,
        a.assetId,
        a.isCompleted,
        a.photoAfterUrl || a.photoBeforeUrl || '',
        a.notes,
        a.condition,
        a.photoBeforeUrl || ''
      );
    });

    // Tạo báo cáo thanh toán mới
    const newReport = this.projectService.submitContractorReport({
      projectId: this.selectedProjectId,
      periodTitle: this.reportPeriodTitle || `Báo cáo nghiệm thu (${task?.title})`,
      contractor: this.selectedContractor,
      items: items,
      amountRequested: this.totalDraftAmount
    });

    this.toastService.success(
      'Gửi báo cáo thành công!',
      `Hồ sơ ${newReport.code} đã được gửi lên Ban QLDA. Cán bộ vận hành sẽ kiểm tra đối chiếu qua màn hình Split-view.`
    );

    // Chuyển về màn hình danh sách
    this.currentView = 'LIST';
    this.assetDrafts = [];
    this.activeAssetDraft = null;
  }

  // Xem chi tiết hồ sơ đã gửi
  openReportDetail(report: ReportPayment) {
    this.selectedReportDetail = report;
    this.activeInspectionItem = report.items && report.items.length > 0 ? report.items[0] : null;
  }

  closeReportDetail() {
    this.selectedReportDetail = null;
    this.activeInspectionItem = null;
  }

  selectInspectionItem(item: ReportItem) {
    this.activeInspectionItem = item;
  }

  // Utilities
  getDefaultAssetCost(layerId: LayerId): number {
    switch (layerId) {
      case 'LIGHTING': return 65000000;
      case 'GREENERY': return 35000000;
      case 'DRAINAGE': return 45000000;
      case 'ROADWAY': return 185000000;
      default: return 40000000;
    }
  }

  getLayerName(layerId: LayerId): string {
    switch (layerId) {
      case 'LIGHTING': return 'Chiếu sáng đô thị';
      case 'GREENERY': return 'Cây xanh & Công viên';
      case 'DRAINAGE': return 'Thoát nước & Hố ga';
      case 'ROADWAY': return 'Mặt đường & Biển báo';
      default: return 'Hạ tầng kỹ thuật';
    }
  }

  getLayerBadgeClass(layerId: LayerId): string {
    switch (layerId) {
      case 'LIGHTING': return 'badge-amber';
      case 'GREENERY': return 'badge-emerald';
      case 'DRAINAGE': return 'badge-cyan';
      case 'ROADWAY': return 'badge-purple';
      default: return 'badge-secondary';
    }
  }

  formatMoney(num: number | undefined): string {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('vi-VN');
  }
}
