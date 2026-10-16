export type MaintenanceExecutorType = 'CONTRACTOR' | 'INTERNAL_TEAM';

export type HistoryLayerId = 'LIGHTING' | 'GREENERY' | 'DRAINAGE' | 'ROADWAY';

export interface LinkedAssetInfo {
  code: string;
  name: string;
  type: string;
  isCurrent?: boolean;
}

export interface MaintenanceTeamMember {
  name: string;
  role: string;
  phone?: string;
}

export interface InternalTeamMaintenanceDetails {
  incidentTicketCode: string;
  incidentSummary: string;
  linkedAssets: LinkedAssetInfo[];
  slaResponseTime: string;
  materialsUsed: string[];
  reportedAt: string;
  resolvedAt: string;
  actionLog: string;
  teamMembers?: MaintenanceTeamMember[];
}

export interface EvidencePhotoItem {
  id?: string;
  url: string;
  caption: string;
  timestamp: string;
  gpsCoordinates?: string;
  note?: string;
}

export interface MaintenanceHistoryItem {
  id: string;
  completedAt: string; // e.g. '20/05/2025' or '25/05/2025 10:15'
  periodLabel: string; // e.g. 'Đợt 2 - Q2/2025' or 'SLA: 1h45p'
  assetCode: string; // e.g. 'CS-VK-042'
  assetName: string; // e.g. 'Trụ đèn LED chiếu sáng 150W đôi'
  layerId: HistoryLayerId;
  layerName: string; // 'Chiếu sáng', 'Cây xanh', 'Thoát nước'
  taskContent: string; // 'Thay thế bóng LED & chấn lưu xung áp 150W'
  locationDetail: string; // 'Vị trí: Cột Km4+200, Dải phân cách giữa'
  routeName: string; // 'Đại lộ Võ Văn Kiệt'

  // Executor Type & Classification
  executorType: MaintenanceExecutorType; // 'CONTRACTOR' | 'INTERNAL_TEAM'
  projectOrIncidentCode: string; // 'DT-2025-VVK-02' or 'SC-2025-089'
  projectOrIncidentName: string; // 'Duy tu hệ thống chiếu sáng Võ Văn Kiệt' or 'Khắc phục sự cố mất điện nhánh VVK Km4'

  // Executor Info
  executorName: string; // 'CTCP Chiếu sáng Đô thị Sài Gòn' or 'Đội Cơ động 1 - Ban QLDA'
  supervisorOrTechnician?: string; // Tên cán bộ đại diện nghiệm thu (nếu là nhà thầu)

  // Evidence Status Badge
  evidenceStatus: 'FULL_EXIF_VALID' | 'SHARED_INCIDENT_PHOTOS' | 'MISSING_AFTER';
  evidenceLabel: string; // 'Đủ 2 ảnh Trước/Sau (EXIF OK)' or 'Ảnh chung cụm sự cố (4 tài sản)'

  // Detailed Evidence Photos (1-1 for Contractor)
  beforePhoto: {
    url: string;
    caption: string;
    timestamp: string;
    gpsCoordinates: string; // '10.7523° N, 106.6821° E'
    exifStatus: string; // 'EXIF: Hợp lệ'
    initialStateNote: string; // 'Chập cháy linh kiện kích áp'
    deviceInfo: string; // 'Galaxy Tab Active4 Pro (Cán bộ GIS)'
    isGroupPhoto?: boolean;
  };
  afterPhoto: {
    url: string;
    caption: string;
    timestamp: string;
    gpsCoordinates: string; // '10.7523° N, 106.6821° E'
    matchGpsPercent: string; // 'Khớp tọa độ 100%'
    inspectionResult: string; // 'Đạt chuẩn quang thông (>130 lm/W)'
    inspectorName: string; // 'KS. Lê Minh Tuấn (Ký số OK)'
    isGroupPhoto?: boolean;
  };

  // Up to 5 photos for Internal Team (Cụm sự cố)
  beforePhotos?: EvidencePhotoItem[];
  afterPhotos?: EvidencePhotoItem[];

  // Technical Notes / Verification memo (Original from field)
  technicalNotes: string;

  // Additional note from Ban QLDA / Management
  managementNote?: string;
  managementNoteUpdatedAt?: string;
  managementNoteUpdatedBy?: string;

  // Contractor Specifics (When executorType === 'CONTRACTOR')
  contractorDetails?: {
    contractNumber: string;
    packagePeriod: string;
    unitPrice: number;
    warrantyMonths: number;
    digitalSignStatus: string;
  };

  // Internal Team Specifics (When executorType === 'INTERNAL_TEAM')
  internalTeamDetails?: InternalTeamMaintenanceDetails;
}

export interface HistoryFilterCriteria {
  layerId: HistoryLayerId | 'ALL';
  startDate: string;
  endDate: string;
  routeName: string;
  projectIdOrCode: string;
  executorType: 'ALL' | 'CONTRACTOR' | 'INTERNAL_TEAM';
  contractorOrTeamFilter: string; // Filter specifically by contractor name or internal team
  searchKeyword: string;
}
