export type MaintenanceType = 'Đột xuất' | 'Định kỳ' | 'Khẩn cấp' | 'Sửa chữa thường xuyên';

export type ProjectStatus = 'Khởi tạo' | 'Chuẩn bị' | 'Đang thi công' | 'Nghiệm thu' | 'Hoàn thành' | 'Hủy';

export interface Project {
  id: string;
  code: string;
  name: string;
  type: MaintenanceType;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  budget: number; // VNĐ
  contractor: string;
  managementUnit: string;
  description: string;
  routeName: string;
  progressPercent: number;
  totalAssetsCount: number;
  completedAssetsCount: number;
  createdAt: string;
}

export type DocumentCategory = 'DECISION' | 'CAPITAL_PLAN' | 'RELATED_DOC';

export interface ProjectDocument {
  id: string;
  projectId: string;
  category: DocumentCategory;
  name: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadDate: string;
  uploadedBy: string;
  notes?: string;
  url?: string;
}

export type LayerId = 'LIGHTING' | 'GREENERY' | 'DRAINAGE' | 'ROADWAY';

export interface DataLayer {
  id: LayerId;
  name: string;
  code: string;
  color: string;
  icon: string;
  description: string;
  totalCount: number;
}

export type AssetMaintenanceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Asset {
  id: string;
  code: string;
  name: string;
  layerId: LayerId;
  layerName: string;
  route: string; // Tên tuyến đường
  lat: number;
  lng: number;
  address: string;
  status: AssetMaintenanceStatus; // Inline editable: Chờ xử lý | Đang sửa | Đã xong
  assignedProjectId?: string;
  assignedTaskId?: string;
  assignedTaskTitle?: string;
  lastUpdated?: string;
  notes?: string;
  beforePhotoUrl?: string;
  completedPhotoUrl?: string;
}

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface FieldPhoto {
  id: string;
  assetId: string;
  assetName: string;
  url: string;
  timestamp: string;
  lat: number;
  lng: number;
  note: string;
  uploadedBy: string;
}

export interface MaintenanceTask {
  id: string;
  projectId: string;
  code: string;
  title: string;
  description: string;
  contractor: string;
  assignedTeam: string;
  targetLayerId?: LayerId | 'ALL';
  status: TaskStatus; // Inline editable: Chưa bắt đầu | Đang thực hiện | Tạm dừng | Hoàn thành
  priority: TaskPriority;
  deadline: string;
  progress: number;
  assetIds: string[]; // List of assets attached to this task
  completedAssetIds: string[];
  fieldPhotos: FieldPhoto[];
  createdAt: string;
}

export type PaymentStatus = 'PENDING_INSPECTION' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface ReportItem {
  assetId: string;
  assetCode: string;
  assetName: string;
  layerId: LayerId;
  layerName: string;
  taskId: string;
  taskTitle: string;
  completedDate: string;
  photoUrl: string;
  lat: number;
  lng: number;
  cost: number;
  inspectorApproved: boolean;
  inspectorNotes?: string;
}

export interface ReportPayment {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  code: string;
  periodTitle: string;
  contractor: string;
  createdDate: string;
  totalCompletedTasks: number;
  totalCompletedAssets: number;
  amountRequested: number;
  amountApproved?: number;
  status: PaymentStatus;
  items: ReportItem[];
  rejectedReason?: string;
  approvedBy?: string;
  approvedDate?: string;
}
