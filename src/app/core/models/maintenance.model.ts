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

// Hiện trạng tài sản được ghi nhận/đánh giá trong từng lần kiểm tra/bảo trì
export type AssetCondition = 'GOOD' | 'NORMAL' | 'DAMAGED' | 'NEEDS_REPLACEMENT';

export const ASSET_CONDITION_CONFIG: Record<AssetCondition, { label: string; badgeClass: string; color: string; icon: string }> = {
  GOOD: { label: 'Hoạt động tốt', badgeClass: 'badge-success', color: '#10b981', icon: 'bi-check-circle-fill' },
  NORMAL: { label: 'Bình thường', badgeClass: 'badge-info', color: '#0ea5e9', icon: 'bi-info-circle-fill' },
  DAMAGED: { label: 'Hư hỏng', badgeClass: 'badge-danger', color: '#ef4444', icon: 'bi-exclamation-triangle-fill' },
  NEEDS_REPLACEMENT: { label: 'Cần thay thế', badgeClass: 'badge-warning', color: '#f59e0b', icon: 'bi-arrow-repeat' }
};

// Trạng thái vận hành legacy (giữ tương thích)
export type AssetMaintenanceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

/**
 * ASSET MASTER DATA / CATALOG (Dữ liệu tĩnh / Hồ sơ tài sản hạ tầng)
 * Đóng vai trò là danh mục dữ liệu gốc / hồ sơ tài sản:
 * Quản lý thông tin kỹ thuật tĩnh: mã, tên, loại, lý trình, vị trí, tọa độ, thông số kỹ thuật, ngày đưa vào sử dụng, đơn vị quản lý.
 * LOẠI BỎ: Không lưu trực tiếp các trạng thái vận hành/bảo trì biến động và danh sách task tại đây
 * để tránh xung đột dữ liệu giữa các task/dự án và giữ tài sản thuần túy là catalog.
 */
export interface Asset {
  id: string;
  code: string;
  name: string;
  layerId: LayerId;
  layerName: string;
  category?: string; // Phân nhóm kỹ thuật chi tiết (vd: Cột đèn cao áp hoa sen, Hố ga thu nước hàm ếch...)
  route: string; // Tên tuyến đường
  chainage?: string; // Lý trình (vd: Km0+050, Km1+200...)
  lat: number;
  lng: number;
  address: string;
  specs?: string; // Thông số kỹ thuật gốc (vd: Trụ thép mạ kẽm 9m, LED 150W; Đan gang tải trọng 40T...)
  commissioningDate?: string; // Ngày đưa vào sử dụng / ngày lắp đặt
  managementUnit?: string; // Đơn vị quản lý vận hành / sở hữu
  assignedProjectId?: string; // Dự án duy tu hiện đang gán tài sản này (nếu có)
  notes?: string; // Ghi chú hồ sơ kỹ thuật tĩnh
  status?: AssetMaintenanceStatus; // Thuộc tính tương thích ngược nếu cần
  assignedTaskId?: string; // Legacy compatibility
  assignedTaskTitle?: string; // Legacy compatibility
  beforePhotoUrl?: string; // Legacy compatibility
  completedPhotoUrl?: string; // Legacy compatibility
  // Hỗ trợ tài sản dạng tuyến / dạng đường / dạng vùng (Line / Polyline / Polygon)
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  lengthMeters?: number; // Chiều dài đoạn tuyến (m)
  widthMeters?: number;  // Chiều rộng mặt đường (m)
  areaSquareMeters?: number; // Diện tích mặt đường / thi công (m2)
  startPoint?: { lat: number; lng: number; label?: string };
  endPoint?: { lat: number; lng: number; label?: string };
  polygonCoords?: [number, number][]; // Danh sách tọa độ đa giác [[lat, lng], ...]
}

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; badgeClass: string; color: string }> = {
  NOT_STARTED: { label: 'Chưa bắt đầu', badgeClass: 'badge-secondary', color: '#64748b' },
  IN_PROGRESS: { label: 'Đang thực hiện', badgeClass: 'badge-primary', color: '#2563eb' },
  PAUSED: { label: 'Tạm dừng', badgeClass: 'badge-warning', color: '#f59e0b' },
  COMPLETED: { label: 'Hoàn thành', badgeClass: 'badge-success', color: '#10b981' }
};

/**
 * Model liên kết Tài sản trong từng Task công việc (TaskAssetItem)
 * Lưu trạng thái tại Task:
 * - Trạng thái thực hiện (isCompleted)
 * - Hiện trạng tài sản được ghi nhận/đánh giá trong lần thực hiện task đó (condition)
 * - Lưu vết lịch sử thay đổi hiện trạng của tài sản theo từng lần kiểm tra/bảo trì
 */
export interface TaskAssetItem {
  assetId: string;
  assetCode: string;
  assetName: string;
  layerId?: LayerId;
  condition: AssetCondition; // Hiện trạng tài sản ghi nhận trong task này: Bình thường | Hư hỏng | Cần thay thế | Hoạt động tốt
  isCompleted: boolean; // Trạng thái xử lý trong task này
  completedDate?: string;
  notes?: string; // Đánh giá hiện trạng / ghi chú thi công
  photoBeforeUrl?: string; // Ảnh hiện trạng trước khi làm
  photoAfterUrl?: string; // Ảnh kết quả sau khi hoàn thành
  // Thuộc tính hình học cho tài sản dạng tuyến / dạng đường / dạng vùng
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  lengthMeters?: number;
  widthMeters?: number;
  areaSquareMeters?: number;
  chainage?: string;
  startPoint?: { lat: number; lng: number; label?: string };
  endPoint?: { lat: number; lng: number; label?: string };
  polygonCoords?: [number, number][];
}

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
  status: TaskStatus; // Chưa bắt đầu | Đang thực hiện | Tạm dừng | Hoàn thành
  priority: TaskPriority;
  deadline: string;
  progress: number;
  taskAssets: TaskAssetItem[]; // Danh sách tài sản gắn với task kèm hiện trạng và trạng thái thực hiện
  assetIds: string[]; // Danh sách assetId (hỗ trợ tra cứu nhanh)
  completedAssetIds: string[]; // Danh sách assetId đã hoàn thành
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
  photoBeforeUrl?: string; // Ảnh trước khi khắc phục / thi công do nhà thầu nộp
  photoAfterUrl?: string;  // Ảnh sau khi khắc phục / nghiệm thu do nhà thầu nộp
  lat: number;
  lng: number;
  cost: number;
  inspectorApproved: boolean;
  inspectorNotes?: string;
  // Thuộc tính hình học cho tài sản dạng tuyến / dạng đường / dạng vùng
  geometryType?: 'POINT' | 'LINE' | 'POLYGON';
  lengthMeters?: number;
  widthMeters?: number;
  areaSquareMeters?: number;
  chainage?: string;
  startPoint?: { lat: number; lng: number; label?: string };
  endPoint?: { lat: number; lng: number; label?: string };
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
