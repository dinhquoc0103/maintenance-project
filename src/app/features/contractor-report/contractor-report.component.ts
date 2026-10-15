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
  taskId: string;
  taskCode: string;
  taskTitle: string;
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

export interface TaskAssetGroup {
  taskId: string;
  taskCode: string;
  taskTitle: string;
  totalAssets: number;
  completedAssets: number;
  selectedAssets: number;
  assets: ContractorAssetDraft[];
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
  selectedTaskIds: string[] = []; // Hỗ trợ chọn nhiều đầu việc
  reportPeriodTitle: string = '';
  technicianGeneralName: string = 'Kỹ sư Trần Đình Nam (Tổ trưởng thi công)';

  // Danh sách tài sản trong các task đang soạn thảo
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

  // Danh sách các task đang được chọn
  get selectedTasks(): MaintenanceTask[] {
    return this.availableTasks.filter(t => this.selectedTaskIds.includes(t.id));
  }

  // Task đại diện (đầu tiên nếu có)
  get selectedTask(): MaintenanceTask | undefined {
    return this.selectedTasks.length > 0 ? this.selectedTasks[0] : undefined;
  }

  // Nhóm tài sản theo từng đầu việc để hiển thị rõ ràng trên cột trái
  get taskAssetGroups(): TaskAssetGroup[] {
    if (this.assetDrafts.length === 0) return [];

    const taskMap = new Map<string, ContractorAssetDraft[]>();
    this.assetDrafts.forEach(draft => {
      if (!taskMap.has(draft.taskId)) {
        taskMap.set(draft.taskId, []);
      }
      taskMap.get(draft.taskId)!.push(draft);
    });

    const groups: TaskAssetGroup[] = [];
    this.availableTasks.forEach(task => {
      if (taskMap.has(task.id)) {
        const assets = taskMap.get(task.id)!;
        const completedCount = assets.filter(a => a.isCompleted).length;
        const selectedCount = assets.filter(a => a.isSelected && a.isCompleted).length;
        groups.push({
          taskId: task.id,
          taskCode: task.code,
          taskTitle: task.title,
          totalAssets: assets.length,
          completedAssets: completedCount,
          selectedAssets: selectedCount,
          assets
        });
      }
    });

    return groups;
  }

  // Các tài sản hợp lệ đề nghị nghiệm thu & thanh toán (BẮT BUỘC ĐÃ HOÀN THÀNH & ĐƯỢC CHỌN)
  get selectedBillableAssets(): ContractorAssetDraft[] {
    return this.assetDrafts.filter(a => a.isSelected && a.isCompleted);
  }

  // Alias để tương thích an toàn nếu có chỗ nào trong code còn dùng selectedDraftAssets
  get selectedDraftAssets(): ContractorAssetDraft[] {
    return this.selectedBillableAssets;
  }

  // Tổng số tài sản chưa hoàn thành (được giữ lại đợt sau)
  get uncompletedAssets(): ContractorAssetDraft[] {
    return this.assetDrafts.filter(a => !a.isCompleted);
  }

  // Tổng kinh phí đề nghị của các tài sản đã hoàn thành được chọn
  get totalDraftAmount(): number {
    return this.selectedBillableAssets.reduce((sum, a) => sum + (Number(a.cost) || 0), 0);
  }

  // Đổi nhà thầu đang đăng nhập/thao tác
  onContractorChange(contractor: string) {
    this.selectedContractor = contractor;
    const projects = this.contractorProjects;
    if (projects.length > 0) {
      this.selectedProjectId = projects[0].id;
      this.selectedTaskIds = this.availableTasks.map(t => t.id);
      this.assetDrafts = [];
      this.activeAssetDraft = null;
      this.loadAssetsForSelectedTasks();
    }
  }

  // Chuyển sang màn hình tạo báo cáo
  openCreateReport() {
    this.currentView = 'CREATE';
    if (!this.selectedProjectId && this.contractorProjects.length > 0) {
      this.selectedProjectId = this.contractorProjects[0].id;
    }
    if (this.availableTasks.length > 0) {
      this.selectedTaskIds = this.availableTasks.map(t => t.id);
      this.loadAssetsForSelectedTasks();
    }
  }

  cancelCreateReport() {
    this.currentView = 'LIST';
    this.assetDrafts = [];
    this.activeAssetDraft = null;
    this.selectedTaskIds = [];
  }

  // Khi chọn Dự án
  onSelectProject(projectId: string) {
    this.selectedProjectId = projectId;
    this.selectedTaskIds = this.availableTasks.map(t => t.id);
    this.assetDrafts = [];
    this.activeAssetDraft = null;
    this.loadAssetsForSelectedTasks();
  }

  // Kiểm tra 1 task có đang được chọn hay không
  isTaskSelected(taskId: string): boolean {
    return this.selectedTaskIds.includes(taskId);
  }

  // Bật/tắt chọn 1 đầu việc
  onToggleTaskSelection(taskId: string) {
    if (this.selectedTaskIds.includes(taskId)) {
      this.selectedTaskIds = this.selectedTaskIds.filter(id => id !== taskId);
    } else {
      this.selectedTaskIds = [...this.selectedTaskIds, taskId];
    }
    this.loadAssetsForSelectedTasks();
  }

  // Chọn tất cả đầu việc / Bỏ chọn tất cả
  selectAllTasks(selectAll: boolean) {
    if (selectAll) {
      this.selectedTaskIds = this.availableTasks.map(t => t.id);
    } else {
      this.selectedTaskIds = [];
    }
    this.loadAssetsForSelectedTasks();
  }

  // Quản lý trạng thái đóng/mở (collapse) cho từng nhóm đầu việc
  collapsedTaskIds: Set<string> = new Set<string>();

  isTaskGroupCollapsed(taskId: string): boolean {
    return this.collapsedTaskIds.has(taskId);
  }

  toggleTaskGroupCollapse(taskId: string) {
    if (this.collapsedTaskIds.has(taskId)) {
      this.collapsedTaskIds.delete(taskId);
    } else {
      this.collapsedTaskIds.add(taskId);
    }
  }

  collapseAllTaskGroups(collapse: boolean) {
    if (collapse) {
      this.availableTasks.forEach(t => this.collapsedTaskIds.add(t.id));
    } else {
      this.collapsedTaskIds.clear();
    }
  }

  // Tải danh sách tài sản từ tất cả các task đã chọn
  loadAssetsForSelectedTasks() {
    if (this.selectedTaskIds.length === 0) {
      this.assetDrafts = [];
      this.activeAssetDraft = null;
      return;
    }

    // Tự động sinh tiêu đề đợt báo cáo mẫu
    const reportCount = this.contractorReports.length + 1;
    if (this.selectedTasks.length === 1) {
      this.reportPeriodTitle = `Báo cáo nghiệm thu & Đề nghị thanh toán Đợt ${reportCount} - ${this.selectedTasks[0].title}`;
    } else {
      this.reportPeriodTitle = `Báo cáo nghiệm thu & Đề nghị thanh toán Đợt ${reportCount} - Tổng hợp ${this.selectedTasks.length} đầu việc (${this.selectedProject?.name || ''})`;
    }

    // Giữ lại các thay đổi đã nhập nếu tài sản đã tồn tại trong drafts
    const existingMap = new Map<string, ContractorAssetDraft>();
    this.assetDrafts.forEach(d => {
      existingMap.set(`${d.taskId}_${d.assetId}`, d);
    });

    const drafts: ContractorAssetDraft[] = [];

    // Duyệt qua tất cả các đầu việc được chọn
    this.selectedTasks.forEach(task => {
      const projectAssets = this.projectService.getProjectAssets(task.projectId);

      if (task.taskAssets && task.taskAssets.length > 0) {
        task.taskAssets.forEach(ta => {
          const key = `${task.id}_${ta.assetId}`;
          if (existingMap.has(key)) {
            drafts.push(existingMap.get(key)!);
          } else {
            const fullAsset = projectAssets.find(a => a.id === ta.assetId);
            const cost = this.getDefaultAssetCost(fullAsset?.layerId || ta.layerId || 'LIGHTING');
            const before = ta.photoBeforeUrl || '';
            const after = ta.photoAfterUrl || '';
            const isDone = ta.isCompleted !== undefined ? ta.isCompleted : true;

            drafts.push({
              taskId: task.id,
              taskCode: task.code,
              taskTitle: task.title,
              assetId: ta.assetId,
              assetCode: ta.assetCode,
              assetName: ta.assetName,
              layerId: ta.layerId || fullAsset?.layerId || 'LIGHTING',
              layerName: this.getLayerName(ta.layerId || fullAsset?.layerId || 'LIGHTING'),
              address: fullAsset?.address || 'Tuyến công trình trung tâm',
              lat: fullAsset?.lat || ta.startPoint?.lat || 10.7758,
              lng: fullAsset?.lng || ta.startPoint?.lng || 106.7028,
              isSelected: isDone, // CHỈ mặc định chọn nếu tài sản đã hoàn thành
              isCompleted: isDone,
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
          }
        });
      } else if (task.assetIds && task.assetIds.length > 0) {
        task.assetIds.forEach(aid => {
          const key = `${task.id}_${aid}`;
          if (existingMap.has(key)) {
            drafts.push(existingMap.get(key)!);
          } else {
            const fullAsset = projectAssets.find(a => a.id === aid);
            if (fullAsset) {
              const isDone = task.completedAssetIds?.includes(aid) ?? false;
              const cost = this.getDefaultAssetCost(fullAsset.layerId);
              drafts.push({
                taskId: task.id,
                taskCode: task.code,
                taskTitle: task.title,
                assetId: fullAsset.id,
                assetCode: fullAsset.code,
                assetName: fullAsset.name,
                layerId: fullAsset.layerId,
                layerName: fullAsset.layerName,
                address: fullAsset.address,
                lat: fullAsset.lat,
                lng: fullAsset.lng,
                isSelected: isDone,
                isCompleted: isDone,
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
          }
        });
      }
    });

    this.assetDrafts = drafts;

    // Giữ hoặc chọn active draft
    if (!this.activeAssetDraft || !drafts.some(d => d.assetId === this.activeAssetDraft?.assetId && d.taskId === this.activeAssetDraft?.taskId)) {
      this.activeAssetDraft = drafts.length > 0 ? drafts[0] : null;
    }
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
    if (!draft.isCompleted) {
      this.toastService.warning(
        'Tài sản chưa hoàn thành',
        `Tài sản "${draft.assetCode}" chưa hoàn thành thi công. Vui lòng bật "Đã hoàn thành thi công" ở cột bên phải để đưa vào nghiệm thu đợt này.`
      );
      draft.isSelected = false;
      return;
    }
    draft.isSelected = !draft.isSelected;
  }

  // Khi nhà thầu đổi trạng thái hoàn thành ở cột bên phải
  onAssetCompletionToggle(draft: ContractorAssetDraft) {
    if (draft.isCompleted) {
      draft.isSelected = true;
      if (!draft.completedDate) {
        draft.completedDate = new Date().toISOString().substring(0, 10);
      }
      this.toastService.success(
        'Đã hoàn thành thi công',
        `Tài sản "${draft.assetCode}" đã được chuyển sang hoàn thành và tự động đưa vào đợt nghiệm thu thanh toán.`
      );
    } else {
      draft.isSelected = false;
      this.toastService.info(
        'Chưa hoàn thành',
        `Tài sản "${draft.assetCode}" chuyển về chưa hoàn thành (giữ lại đợt sau, không tính tiền đợt này).`
      );
    }
  }

  // Chọn tất cả / Bỏ chọn tất cả (chỉ chọn những tài sản đã hoàn thành)
  selectAllAssets(selectAll: boolean) {
    if (selectAll) {
      let count = 0;
      this.assetDrafts.forEach(a => {
        if (a.isCompleted) {
          a.isSelected = true;
          count++;
        } else {
          a.isSelected = false;
        }
      });
      const uncompletedCount = this.assetDrafts.length - count;
      if (uncompletedCount > 0) {
        this.toastService.info(
          'Đã chọn tài sản hoàn thành',
          `Đã chọn ${count} tài sản đã hoàn thành thi công. Có ${uncompletedCount} tài sản chưa xong được giữ lại đợt sau.`
        );
      }
    } else {
      this.assetDrafts.forEach(a => a.isSelected = false);
    }
  }

  // Chọn / bỏ chọn toàn bộ tài sản hoàn thành trong 1 nhóm Task
  toggleTaskGroupSelection(group: TaskAssetGroup, selectAll: boolean) {
    let count = 0;
    group.assets.forEach(a => {
      if (selectAll) {
        if (a.isCompleted) {
          a.isSelected = true;
          count++;
        } else {
          a.isSelected = false;
        }
      } else {
        a.isSelected = false;
      }
    });

    if (selectAll) {
      const skipped = group.assets.length - count;
      if (skipped > 0) {
        this.toastService.info(
          `Đầu việc ${group.taskCode}`,
          `Đã chọn ${count} tài sản hoàn thành. Bỏ qua ${skipped} tài sản chưa hoàn thành.`
        );
      }
    }
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
    if (this.selectedTaskIds.length === 0) {
      this.toastService.warning('Chưa chọn đầu việc', 'Vui lòng chọn ít nhất 1 đầu việc (task) để nghiệm thu');
      return;
    }
    if (this.selectedBillableAssets.length === 0) {
      this.toastService.warning(
        'Không có tài sản hoàn thành',
        'Vui lòng chọn ít nhất 1 tài sản đã hoàn thành thi công để đề nghị nghiệm thu thanh toán'
      );
      return;
    }

    // Chuyển đổi sang ReportItem[] - CHỈ LẤY CÁC TÀI SẢN ĐÃ HOÀN THÀNH VÀ ĐƯỢC CHỌN
    const items: ReportItem[] = this.selectedBillableAssets.map(a => ({
      assetId: a.assetId,
      assetCode: a.assetCode,
      assetName: a.assetName,
      layerId: a.layerId,
      layerName: a.layerName,
      taskId: a.taskId,
      taskTitle: a.taskTitle,
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

    // Cập nhật trạng thái từng tài sản trong task tương ứng (cả hoàn thành và chưa hoàn thành)
    this.assetDrafts.forEach(a => {
      this.projectService.setTaskAssetCompletion(
        a.taskId,
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
      periodTitle: this.reportPeriodTitle || `Báo cáo nghiệm thu tổng hợp (${items.length} tài sản)`,
      contractor: this.selectedContractor,
      items: items,
      amountRequested: this.totalDraftAmount
    });

    const uncompletedCount = this.assetDrafts.length - items.length;
    let message = `Hồ sơ ${newReport.code} đã được gửi lên Ban QLDA (${items.length} tài sản hoàn thành, ${this.formatMoney(this.totalDraftAmount)} đ).`;
    if (uncompletedCount > 0) {
      message += ` Còn ${uncompletedCount} tài sản chưa hoàn thành được giữ lại cho các đợt tiếp theo.`;
    }

    this.toastService.success('Gửi báo cáo thành công!', message);

    // Chuyển về màn hình danh sách
    this.currentView = 'LIST';
    this.assetDrafts = [];
    this.activeAssetDraft = null;
    this.selectedTaskIds = [];
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
