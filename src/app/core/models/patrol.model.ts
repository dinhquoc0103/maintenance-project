import {
  LayerId,
  Asset,
  AssetCondition,
  TaskStatus,
  ASSET_CONDITION_CONFIG,
  TASK_STATUS_CONFIG
} from './maintenance.model';

export type {
  Asset,
  AssetCondition,
  TaskStatus
};

export {
  ASSET_CONDITION_CONFIG,
  TASK_STATUS_CONFIG
};

export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type IssueStatus = 'NEW' | 'QUICK_FIXING' | 'RESOLVED' | 'MOVED_TO_PROJECT' | 'REJECTED';

export type ShiftType = 'SANG' | 'CHIEU' | 'TOI';

export type AttendanceStatus = 'CHECKED_IN' | 'NOT_CHECKED_IN' | 'LATE';

// UC 2: Cấu hình loại vấn đề
export interface IssueCategory {
  id: string;
  code: string;
  name: string;
  layerId: LayerId;
  defaultPriority: IssuePriority;
  estimatedFixHours: number;
  description: string;
  isActive: boolean;
  standardCostEstimate: number; // VNĐ
}

// UC 1: Cấu hình nhân sự & Cụm nhóm quyền
export interface PatrolTeam {
  id: string;
  code: string;
  name: string;
  leaderId: string;
  leaderName: string;
  assignedArea: string;
  permissionGroup: 'QUẢN TRỊ VẬN HÀNH' | 'TRƯỞNG ĐỘI TUẦN KIỂM' | 'NHÂN VIÊN HIỆN TRƯỜNG';
  description: string;
  memberCount: number;
}

// UC 1 & UC 5: Nhân sự tuần kiểm
export interface PatrolPersonnel {
  id: string;
  code: string;
  name: string;
  phone: string;
  role: 'INSPECTOR' | 'TEAM_LEADER' | 'SUPERVISOR';
  teamId: string;
  teamName: string;
  assignedRoutes: string[];
  isActive: boolean;
  todayAttendance: AttendanceStatus;
  checkInTime?: string;
  checkInLocation?: string;
  isValidAttendance?: boolean; // Cán bộ đánh giá hợp lệ
}

/**
 * Model liên kết Tài sản trong từng ca / nhiệm vụ tuần kiểm (Patrol Task Asset)
 * Lưu hiện trạng được đánh giá tại hiện trường
 */
export interface PatrolTaskAsset {
  assetId: string;
  assetCode: string;
  assetName: string;
  layerId?: LayerId;
  address?: string;
  lat?: number;
  lng?: number;
  condition: AssetCondition; // Hiện trạng tài sản: Hoạt động tốt | Bình thường | Hư hỏng | Cần thay thế
  inspectionStatus: 'PENDING' | 'INSPECTED' | 'ISSUE_FOUND';
  inspectedAt?: string;
  notes?: string;
  photoUrl?: string;
}

/**
 * Model Nhiệm vụ tuần kiểm (Patrol Task)
 * Phân công tuần tra cụ thể theo danh sách tài sản và tuyến
 */
export interface PatrolTask {
  id: string;
  code: string; // TK-TASK-001
  scheduleId?: string;
  title: string;
  description?: string;
  assignedPersonnelId: string;
  assignedPersonnelName: string;
  teamId?: string;
  teamName?: string;
  status: TaskStatus; // Chưa bắt đầu | Đang thực hiện | Tạm dừng | Hoàn thành
  priority: IssuePriority;
  deadline?: string;
  targetAssets: PatrolTaskAsset[];
  createdAt: string;
  completedAt?: string;
}

// UC 3 & UC 7 & UC 8: Lịch & phân công tuần kiểm
export interface PatrolSchedule {
  id: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  routeName: string;
  startPointName: string;
  endPointName: string;
  routeCoordinates: [number, number][]; // Leaflet latlngs
  targetAssetIds: string[];
  targetAssets?: PatrolTaskAsset[];
  teamId: string;
  teamName: string;
  assignedPersonnel: {
    id: string;
    name: string;
    phone: string;
    checkedIn: boolean;
  }[];
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  checkpointsTotal: number;
  checkpointsInspected: number;
  notes?: string;
}

// UC 4 & UC 6 & UC 9 & UC 10: Vấn đề tuần kiểm (Sự cố)
export interface PatrolIssue {
  id: string;
  code: string; // SC-2026-001
  title: string;
  reportedAt: string;
  reportedBy: {
    id: string;
    name: string;
    phone: string;
  };
  categoryId: string;
  categoryName: string;
  layerId: LayerId;
  priority: IssuePriority;
  status: IssueStatus;
  description: string;
  photoBeforeUrl: string;
  photoAfterUrl?: string;
  lat: number;
  lng: number;
  address: string;
  routeName: string;
  assetId?: string;
  assetCode?: string;
  assetName?: string;
  assetCondition?: AssetCondition; // Hiện trạng tài sản khi phát hiện sự cố: Hư hỏng | Cần thay thế

  // Đính kèm nhiều tài sản cùng loại theo Nguyên tắc 2
  attachedAssets?: {
    assetId: string;
    assetCode: string;
    assetName: string;
    condition?: AssetCondition;
    lat?: number;
    lng?: number;
    address?: string;
  }[];

  // Luồng từ chối tiếp nhận của Cán bộ Quản lý
  rejectReason?: string;
  rejectedAt?: string;
  rejectedBy?: string;

  // Luồng cập nhật & gửi lại của Người tuần kiểm (Resubmit)
  resubmittedAt?: string;
  resubmitNotes?: string;

  // Luồng khắc phục nhanh (Trường hợp 1 - UC 10)
  quickFixDetails?: {
    contractorOrTeam: string;
    assignedWorker: string;
    estimatedCost: number;
    deadline: string;
    startedAt?: string;
    completedAt?: string;
    resolutionNote?: string;
    acceptedBy?: string; // Cán bộ nghiệm thu
    finalCondition?: AssetCondition; // Hiện trạng sau khi khắc phục xong (Hoạt động tốt | Bình thường)
  };

  // Luồng chuyển thành dự án duy tu (Trường hợp 2 - Kết nối Phân hệ Duy tu)
  projectLinkDetails?: {
    projectId: string;
    projectCode: string;
    projectName: string;
    linkedAt: string;
    linkedBy: string;
  };
}

// UC 9: Nhật ký tuần kiểm
export interface PatrolLog {
  id: string;
  scheduleId?: string;
  issueId?: string;
  personnelName: string;
  action: 'CHECK_IN' | 'START_ROUTE' | 'REPORT_ISSUE' | 'INSPECT_ASSET' | 'END_ROUTE' | 'QUICK_FIX';
  title: string;
  details: string;
  timestamp: string;
  lat: number;
  lng: number;
  status: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER';
}

