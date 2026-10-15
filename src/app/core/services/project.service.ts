import { Injectable, signal } from '@angular/core';
import {
  Project,
  ProjectDocument,
  DocumentCategory,
  DataLayer,
  Asset,
  LayerId,
  AssetMaintenanceStatus,
  AssetCondition,
  ASSET_CONDITION_CONFIG,
  MaintenanceTask,
  TaskStatus,
  TASK_STATUS_CONFIG,
  TaskAssetItem,
  ReportPayment,
  ReportItem,
  PaymentStatus,
  FieldPhoto
} from '../models/maintenance.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  // Layers catalog
  readonly layers = signal<DataLayer[]>([
    {
      id: 'LIGHTING',
      name: 'Chiếu sáng đô thị',
      code: 'CSDT',
      color: '#f59e0b',
      icon: 'bi-lightbulb-fill',
      description: 'Cột đèn cao áp, đèn led thông minh, tủ điện hạ thế, cáp ngầm',
      totalCount: 140
    },
    {
      id: 'GREENERY',
      name: 'Cây xanh & Công viên',
      code: 'CXCP',
      color: '#10b981',
      icon: 'bi-tree-fill',
      description: 'Cây bóng mát loại 2 & 3, bồn hoa dải phân cách, thảm cỏ đô thị',
      totalCount: 95
    },
    {
      id: 'DRAINAGE',
      name: 'Thoát nước & Hố ga',
      code: 'TNNN',
      color: '#06b6d4',
      icon: 'bi-droplet-half',
      description: 'Hố ga thu nước, cống hộp, van ngăn triều, cửa xả',
      totalCount: 82
    },
    {
      id: 'ROADWAY',
      name: 'Mặt đường & Biển báo',
      code: 'MDBB',
      color: '#8b5cf6',
      icon: 'bi-signpost-split-fill',
      description: 'Vỉa hè lát đá, mặt đường asphalt, gờ giảm tốc, biển báo giao thông',
      totalCount: 110
    }
  ]);

  // Projects list
  private projectsData: Project[] = [
    {
      id: 'p-1',
      code: 'DA-2026-001',
      name: 'Duy tu, thay thế đèn chiếu sáng & cắt tỉa cây xanh tuyến trung tâm Nguyễn Huệ - Lê Lợi',
      type: 'Định kỳ',
      status: 'Đang thi công',
      startDate: '2026-03-01',
      endDate: '2026-06-30',
      budget: 1850000000,
      contractor: 'Công ty CP Chiếu sáng & Cây xanh Đô thị Sài Gòn',
      managementUnit: 'Ban QLDA Hạ tầng Kỹ thuật số 1',
      description: 'Bảo trì định kỳ toàn diện hệ thống chiếu sáng nghệ thuật và cây xanh cảnh quan trung tâm thành phố phục vụ các sự kiện văn hóa quý 2.',
      routeName: 'Tuyến Nguyễn Huệ - Lê Lợi (Quận 1)',
      progressPercent: 65,
      totalAssetsCount: 12,
      completedAssetsCount: 7,
      createdAt: '2026-02-15'
    },
    {
      id: 'p-2',
      code: 'DA-2026-002',
      name: 'Nạo vét khẩn cấp hố ga, cống ngầm và chỉnh trang mặt đường tuyến Nam Kỳ Khởi Nghĩa',
      type: 'Khẩn cấp',
      status: 'Đang thi công',
      startDate: '2026-03-10',
      endDate: '2026-04-30',
      budget: 950000000,
      contractor: 'Công ty TNHH Thoát nước & Công trình Giao thông Đô thị',
      managementUnit: 'Ban QLDA Hạ tầng Kỹ thuật số 2',
      description: 'Khắc phục sự cố ngập úng cục bộ và nạo vét bùn đất hố ga trục đường ngoại giao Nam Kỳ Khởi Nghĩa trước mùa mưa lớn.',
      routeName: 'Tuyến Nam Kỳ Khởi Nghĩa - Hàm Nghi',
      progressPercent: 40,
      totalAssetsCount: 8,
      completedAssetsCount: 3,
      createdAt: '2026-03-05'
    },
    {
      id: 'p-3',
      code: 'DA-2026-003',
      name: 'Sửa chữa thường xuyên vỉa hè lát đá granit và biển báo chỉ dẫn đường Tôn Đức Thắng',
      type: 'Sửa chữa thường xuyên',
      status: 'Chuẩn bị',
      startDate: '2026-04-15',
      endDate: '2026-07-15',
      budget: 1200000000,
      contractor: 'Công ty CP Xây dựng Hạ tầng Đô thị Đông Á',
      managementUnit: 'Ban QLDA Hạ tầng Kỹ thuật số 1',
      description: 'Thay thế các phiến đá vỉa hè sụt lún, cải tạo bó vỉa dốc cho người khuyết tật và làm mới hệ thống biển báo giao thông ven sông.',
      routeName: 'Tuyến Tôn Đức Thắng (Công viên Bến Bạch Đằng)',
      progressPercent: 10,
      totalAssetsCount: 6,
      completedAssetsCount: 0,
      createdAt: '2026-03-25'
    },
    {
      id: 'p-4',
      code: 'DA-2026-004',
      name: 'Xử lý đột xuất gãy đổ cây xanh và chập cháy cột đèn sau giông bão tại vòng xoay Quách Thị Trang',
      type: 'Đột xuất',
      status: 'Hoàn thành',
      startDate: '2026-02-01',
      endDate: '2026-02-20',
      budget: 320000000,
      contractor: 'Đội Phản ứng nhanh Hạ tầng Đô thị',
      managementUnit: 'Ban QLDA Hạ tầng Kỹ thuật số 1',
      description: 'Thu dọn cành gãy, thay mới 2 cột đèn cao áp bị xe va chạm và khôi phục hệ thống chiếu sáng an toàn.',
      routeName: 'Vòng xoay Quách Thị Trang - Chợ Bến Thành',
      progressPercent: 100,
      totalAssetsCount: 4,
      completedAssetsCount: 4,
      createdAt: '2026-02-01'
    }
  ];

  projects = signal<Project[]>(this.projectsData);

  // Documents store
  private documentsData: ProjectDocument[] = [
    // Project 1
    {
      id: 'doc-1',
      projectId: 'p-1',
      category: 'DECISION',
      name: 'Quyết định phê duyệt dự toán & kế hoạch duy tu năm 2026',
      fileName: 'QD_PHE_DUYET_DU_TOAN_2026.pdf',
      fileSize: '2.4 MB',
      fileType: 'PDF',
      uploadDate: '2026-02-20',
      uploadedBy: 'Nguyễn Văn Hùng (Chánh VP)',
      notes: 'Số hiệu 1284/QĐ-UBND, ký ngày 18/02/2026'
    },
    {
      id: 'doc-2',
      projectId: 'p-1',
      category: 'DECISION',
      name: 'Quyết định chỉ định thầu đơn vị thi công bảo trì số 45/QĐ-QLDA',
      fileName: 'QD_CHI_DINH_THAU_45.pdf',
      fileSize: '1.8 MB',
      fileType: 'PDF',
      uploadDate: '2026-02-24',
      uploadedBy: 'Trần Thị Mai (Phòng Kế hoạch)',
      notes: 'Giao cho Công ty CP Chiếu sáng & Cây xanh Sài Gòn'
    },
    {
      id: 'doc-3',
      projectId: 'p-1',
      category: 'CAPITAL_PLAN',
      name: 'Thông báo phân bổ kế hoạch vốn sự nghiệp kinh tế Q1/2026',
      fileName: 'PHAN_BO_VON_Q1_2026.xlsx',
      fileSize: '850 KB',
      fileType: 'EXCEL',
      uploadDate: '2026-02-25',
      uploadedBy: 'Lê Hoàng Long (Phòng Tài chính)',
      notes: 'Hạn mức giải ngân đợt 1: 1.200.000.000 VNĐ'
    },
    {
      id: 'doc-4',
      projectId: 'p-1',
      category: 'CAPITAL_PLAN',
      name: 'Bảo lãnh thực hiện hợp đồng và bảo lãnh tạm ứng vốn',
      fileName: 'BAO_LANH_BIDV_TAM_UNG.pdf',
      fileSize: '3.1 MB',
      fileType: 'PDF',
      uploadDate: '2026-02-28',
      uploadedBy: 'Đại diện Nhà thầu',
      notes: 'Bảo lãnh phát hành bởi Ngân hàng BIDV chi nhánh Nam Kỳ'
    },
    {
      id: 'doc-5',
      projectId: 'p-1',
      category: 'RELATED_DOC',
      name: 'Biên bản khảo sát hiện trạng tài sản trước duy tu',
      fileName: 'BIEN_BAN_KHAO_SAT_HIEN_TRANG.pdf',
      fileSize: '5.2 MB',
      fileType: 'PDF',
      uploadDate: '2026-03-01',
      uploadedBy: 'Đội Khảo sát Kỹ thuật',
      notes: 'Có đính kèm tọa độ 12 điểm tài sản cần duy tu'
    },
    {
      id: 'doc-6',
      projectId: 'p-1',
      category: 'RELATED_DOC',
      name: 'Bản vẽ mặt bằng phân vị trí cột đèn & cây bóng mát',
      fileName: 'BAN_VE_SO_DO_MAT_BANG_NGUYENHUE.dwg',
      fileSize: '14.6 MB',
      fileType: 'CAD',
      uploadDate: '2026-03-02',
      uploadedBy: 'KTS Phạm Minh Khoa',
      notes: 'Tỉ lệ 1/500 tích hợp tọa độ VN-2000'
    }
  ];

  documents = signal<ProjectDocument[]>(this.documentsData);

  // Master Map Assets (Static Asset Catalog / Master Data)
  private masterAssetsData: Asset[] = [
    // LIGHTING on Nguyễn Huệ
    {
      id: 'ast-01',
      code: 'CS-NH-01',
      name: 'Cột đèn cao áp số 01 - Trụ hoa sen 4 bóng LED 150W',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      category: 'Trụ đèn cao áp hoa sen cảnh quan',
      route: 'Tuyến Nguyễn Huệ',
      chainage: 'Km0+050 (Phải tuyến)',
      lat: 10.77584,
      lng: 106.70281,
      address: 'Số 02 Nguyễn Huệ, P. Bến Nghé, Q.1',
      specs: 'Trụ thép nhúng kẽm 9m, 4 cần đèn LED Philips 150W/220V IP66, đế gang đúc D350',
      commissioningDate: '2022-04-30',
      managementUnit: 'Trung tâm Quản lý Hạ tầng Kỹ thuật TP.HCM',
      assignedProjectId: 'p-1',
      notes: 'Hồ sơ hoàn công số 12/BXD-2022. Đạt chuẩn chiếu sáng TCVN 259:2001'
    },
    {
      id: 'ast-02',
      code: 'CS-NH-02',
      name: 'Cột đèn cao áp số 02 - Trụ đôi cảnh quan đi bộ',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      category: 'Trụ đèn đôi cảnh quan',
      route: 'Tuyến Nguyễn Huệ',
      chainage: 'Km0+120 (Trái tuyến)',
      lat: 10.77526,
      lng: 106.70329,
      address: 'Số 22 Nguyễn Huệ, P. Bến Nghé, Q.1',
      specs: 'Trụ thép mạ kẽm mỹ thuật 6m, 2 bóng LED 80W tiết kiệm điện, chống chói',
      commissioningDate: '2022-04-30',
      managementUnit: 'Trung tâm Quản lý Hạ tầng Kỹ thuật TP.HCM',
      assignedProjectId: 'p-1',
      notes: 'Hồ sơ hoàn công số 12/BXD-2022. Khu vực phố đi bộ đi dạo ban đêm'
    },
    {
      id: 'ast-03',
      code: 'CS-NH-03',
      name: 'Tủ điều khiển chiếu sáng trung tâm T01-NH',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      category: 'Tủ điều khiển chiếu sáng thông minh',
      route: 'Tuyến Nguyễn Huệ',
      chainage: 'Km0+180 (Giao lộ)',
      lat: 10.77478,
      lng: 106.70375,
      address: 'Giao lộ Nguyễn Huệ - Ngô Đức Kế',
      specs: 'Vỏ tủ composite ngoài trời 2 lớp IP65, aptomat tổng 3P-100A Schneider, đồng hồ công tơ điện tử, bộ điều khiển IoT hẹn giờ tự động',
      commissioningDate: '2021-11-20',
      managementUnit: 'Trung tâm Quản lý Hạ tầng Kỹ thuật TP.HCM',
      assignedProjectId: 'p-1',
      notes: 'Tủ cấp nguồn phân nhánh cho 24 cột đèn trục đi bộ Nguyễn Huệ'
    },
    {
      id: 'ast-04',
      code: 'CS-NH-04',
      name: 'Đèn hắt cây bồn hoa dải phân cách số 04',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      category: 'Đèn hắt cây cảnh quan sân vườn',
      route: 'Tuyến Nguyễn Huệ',
      chainage: 'Km0+240 (Dải phân cách)',
      lat: 10.77415,
      lng: 106.70425,
      address: 'Số 68 Nguyễn Huệ, P. Bến Nghé, Q.1',
      specs: 'Đèn âm đất inox 304, kính cường lực 10mm chịu tải 2T, LED COB 36W vàng ấm 3000K, cấp bảo vệ chống ngập nước IP68',
      commissioningDate: '2022-04-30',
      managementUnit: 'Trung tâm Quản lý Hạ tầng Kỹ thuật TP.HCM',
      assignedProjectId: 'p-1',
      notes: 'Đấu nối từ lộ cáp ngầm bồn hoa số 2'
    },

    // GREENERY on Lê Lợi & Nguyễn Huệ
    {
      id: 'ast-05',
      code: 'CX-LL-01',
      name: 'Cây Dầu rái cổ thụ số 12 (Đường kính thân 80cm)',
      layerId: 'GREENERY',
      layerName: 'Cây xanh & Công viên',
      category: 'Cây bóng mát loại 3 (Cổ thụ bảo tồn)',
      route: 'Tuyến Lê Lợi',
      chainage: 'Km0+080 (Vỉa hè bắc)',
      lat: 10.77382,
      lng: 106.70115,
      address: 'Số 15 Lê Lợi, P. Bến Nghé, Q.1',
      specs: 'Loài Dipterocarpus alatus, D=80cm, chiều cao vút ngọn H=18m, bán kính tán lá 14m, tuổi thọ ước tính >65 năm',
      commissioningDate: '2015-01-01',
      managementUnit: 'Công ty TNHH MTV Công viên Cây xanh TP.HCM',
      assignedProjectId: 'p-1',
      notes: 'Cây có gắn mã QR và chip theo dõi sinh trưởng đô thị'
    },
    {
      id: 'ast-06',
      code: 'CX-LL-02',
      name: 'Cây Bằng lăng tím số 18',
      layerId: 'GREENERY',
      layerName: 'Cây xanh & Công viên',
      category: 'Cây bóng mát loại 2 (Cây hoa đô thị)',
      route: 'Tuyến Lê Lợi',
      chainage: 'Km0+150 (Vỉa hè nam)',
      lat: 10.77321,
      lng: 106.69985,
      address: 'Số 45 Lê Lợi, P. Bến Thành, Q.1',
      specs: 'Loài Lagerstroemia speciosa, D=35cm, chiều cao H=8m, tán hoa mùa hè màu tím',
      commissioningDate: '2023-03-10',
      managementUnit: 'Công ty TNHH MTV Công viên Cây xanh TP.HCM',
      assignedProjectId: 'p-1',
      notes: 'Trồng bổ sung sau khi tái lập mặt bằng tuyến Metro số 1'
    },
    {
      id: 'ast-07',
      code: 'CX-NH-03',
      name: 'Bồn hoa dải phân cách trung tâm đoạn số 3',
      layerId: 'GREENERY',
      layerName: 'Cây xanh & Công viên',
      category: 'Bồn hoa cảnh quan & Thảm cỏ',
      route: 'Tuyến Nguyễn Huệ',
      chainage: 'Km0+200 (Dải trung tâm)',
      lat: 10.77450,
      lng: 106.70390,
      address: 'Phố đi bộ Nguyễn Huệ đoạn Mạc Thị Bưởi',
      specs: 'Bồn xây gạch ốp đá granite, diện tích 45m2, tầng cao dừa cạn + chuỗi ngọc + thảm cỏ lá gừng, hệ thống tưới phun tự động',
      commissioningDate: '2022-04-30',
      managementUnit: 'Ban QLDA Đầu tư Xây dựng Khu vực Quận 1',
      assignedProjectId: 'p-1',
      notes: 'Được chăm sóc tưới tự động 2 lần/ngày'
    },
    {
      id: 'ast-08',
      code: 'CX-LL-04',
      name: 'Hàng cây Sao đen số 05-09 dải vỉa hè phía Nam',
      layerId: 'GREENERY',
      layerName: 'Cây xanh & Công viên',
      category: 'Cây bóng mát loại 2',
      route: 'Tuyến Lê Lợi',
      chainage: 'Km0+260 (Vỉa hè nam)',
      lat: 10.77280,
      lng: 106.69890,
      address: 'Gần ga Metro Bến Thành, Lê Lợi',
      specs: 'Cụm 5 cây Hopea odorata, D trung bình 40cm, chiều cao H=12m, khoảng cách trồng 6m/cây',
      commissioningDate: '2023-01-15',
      managementUnit: 'Công ty TNHH MTV Công viên Cây xanh TP.HCM',
      assignedProjectId: 'p-1',
      notes: 'Hồ sơ bàn giao cảnh quan tuyến Metro số 1'
    },

    // LIGHTING on Lê Lợi
    {
      id: 'ast-09',
      code: 'CS-LL-05',
      name: 'Trụ đèn chiếu sáng đa hướng ngã tư Pasteur - Lê Lợi',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      category: 'Trụ đèn giao lộ đa hướng',
      route: 'Tuyến Lê Lợi',
      chainage: 'Km0+110 (Giao lộ)',
      lat: 10.77350,
      lng: 106.70050,
      address: 'Giao lộ Lê Lợi - Pasteur, Q.1',
      specs: 'Trụ giàn thép mạ kẽm 11m, 6 bóng LED pha 200W/220V góc chiếu 60 độ, chịu gió bão cấp 12',
      commissioningDate: '2022-12-25',
      managementUnit: 'Trung tâm Quản lý Hạ tầng Kỹ thuật TP.HCM',
      assignedProjectId: 'p-1',
      notes: 'Chiếu sáng chính cho cụm nút giao ngã tư đông phương tiện'
    },
    {
      id: 'ast-10',
      code: 'CS-LL-06',
      name: 'Cột đèn cao áp số 08 vỉa hè chợ Bến Thành',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      category: 'Cột đèn cao áp đơn',
      route: 'Tuyến Lê Lợi',
      chainage: 'Km0+320 (Vỉa hè bắc)',
      lat: 10.77240,
      lng: 106.69820,
      address: 'Số 136 Lê Lợi, P. Bến Thành, Q.1',
      specs: 'Trụ côn tròn thép mạ kẽm 8m, cần đơn vươn 1.5m, đèn LED 120W Philips CityCharm',
      commissioningDate: '2023-02-18',
      managementUnit: 'Trung tâm Quản lý Hạ tầng Kỹ thuật TP.HCM',
      assignedProjectId: 'p-1',
      notes: 'Vị trí giáp cửa Đông chợ Bến Thành'
    },
    {
      id: 'ast-11',
      code: 'CS-NH-07',
      name: 'Cột đèn hoa sen trước tòa nhà UBND Thành phố',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      category: 'Trụ đèn nghệ thuật kiến trúc',
      route: 'Tuyến Nguyễn Huệ',
      chainage: 'Km0+010 (Khu vực tượng đài)',
      lat: 10.77660,
      lng: 106.70180,
      address: 'Số 86 Lê Thánh Tôn - Nguyễn Huệ',
      specs: 'Trụ hoa sen đúc hợp kim nhôm mỹ nghệ 10m, 5 bông hoa LED đổi màu RGB kết hợp chiếu sáng công cộng 150W',
      commissioningDate: '2021-04-30',
      managementUnit: 'Trung tâm Quản lý Hạ tầng Kỹ thuật TP.HCM',
      assignedProjectId: 'p-1',
      notes: 'Công trình biểu tượng kiến trúc chiếu sáng cảnh quan thành phố'
    },
    {
      id: 'ast-12',
      code: 'CX-NH-08',
      name: 'Cây Sứ đại hoa trắng bồn cảnh tượng đài Bác Hồ',
      layerId: 'GREENERY',
      layerName: 'Cây xanh & Công viên',
      category: 'Cây cảnh quan di tích',
      route: 'Tuyến Nguyễn Huệ',
      chainage: 'Km0+025 (Công viên)',
      lat: 10.77620,
      lng: 106.70220,
      address: 'Công viên Tượng đài Bác, Nguyễn Huệ',
      specs: 'Plumeria alba thế cổ điển, D=25cm, cao H=4.5m, hoa trắng nhụy vàng thơm',
      commissioningDate: '2020-05-19',
      managementUnit: 'Ban Quản lý Công viên Tượng đài Bác Hồ',
      assignedProjectId: 'p-1',
      notes: 'Khu vực tâm linh trang trọng'
    },

    // ROADWAY LINEAR ASSETS (TÀI SẢN DẠNG ĐƯỜNG / TUYẾN GIAO THÔNG)
    {
      id: 'ast-road-01',
      code: 'MD-LL-01',
      name: 'Đoạn mặt đường bê tông nhựa nóng C12.5 (Từ Pasteur đến Nam Kỳ Khởi Nghĩa)',
      layerId: 'ROADWAY',
      layerName: 'Mặt đường & Biển báo',
      category: 'Mặt đường bê tông nhựa nóng (Asphalt)',
      route: 'Tuyến Lê Lợi',
      chainage: 'Km0+100 - Km0+600',
      geometryType: 'LINE',
      lengthMeters: 500,
      widthMeters: 14.5,
      areaSquareMeters: 7250,
      startPoint: { lat: 10.77350, lng: 106.70050, label: 'Ngã tư Pasteur - Lê Lợi' },
      endPoint: { lat: 10.77580, lng: 106.70280, label: 'Ngã tư Nam Kỳ Khởi Nghĩa - Lê Lợi' },
      lat: 10.77465,
      lng: 106.70165,
      address: 'Đoạn Km0+100 - Km0+600, Tuyến Lê Lợi, Quận 1',
      specs: 'Cào bóc 5cm mặt đường cũ nứt rạn; thảm bù vênh BTN C19; thảm mặt BTN C12.5 dày 5cm (TCVN 8819); tưới dính bám nhũ tương 0.5kg/m2; sơn dẻo nhiệt phản quang 2mm',
      commissioningDate: '2023-04-30',
      managementUnit: 'Trung tâm Quản lý Hạ tầng Giao thông Đường bộ TP.HCM',
      assignedProjectId: 'p-1',
      notes: 'Trục đường giao thông đô thị huyết mạch, lưu lượng xe cao, yêu cầu độ nhám và độ bằng phẳng thước 3m nghiêm ngặt'
    },
    {
      id: 'ast-road-02',
      code: 'VS-NH-02',
      name: 'Vạch sơn kẻ đường dẻo nhiệt & vạch đi bộ phố Nguyễn Huệ',
      layerId: 'ROADWAY',
      layerName: 'Mặt đường & Biển báo',
      category: 'Vạch sơn tín hiệu giao thông đường bộ',
      route: 'Tuyến Nguyễn Huệ',
      chainage: 'Km0+000 - Km0+650',
      geometryType: 'LINE',
      lengthMeters: 650,
      widthMeters: 12.0,
      areaSquareMeters: 7800,
      startPoint: { lat: 10.77660, lng: 106.70180, label: 'Trước UBND TP' },
      endPoint: { lat: 10.77200, lng: 106.70600, label: 'Bến Bạch Đằng' },
      lat: 10.77430,
      lng: 106.70390,
      address: 'Toàn tuyến phố đi bộ Nguyễn Huệ, Quận 1',
      specs: 'Sơn dẻo nhiệt màu trắng - vàng dày 2.0mm đạt tiêu chuẩn TCVN 8791, rắc bi thủy tinh phản quang ban đêm hệ số phản quang > 200 mcd/lux/m2',
      commissioningDate: '2022-09-02',
      managementUnit: 'Sở Giao thông Vận tải TP.HCM',
      assignedProjectId: 'p-1',
      notes: 'Vạch người đi bộ qua đường và viền mép bảo vệ an toàn cho sự kiện đông người'
    },

    // DRAINAGE & ROADWAY on Nam Kỳ Khởi Nghĩa & Hàm Nghi (Project 2 & Master pool)
    {
      id: 'ast-13',
      code: 'TN-NKKN-01',
      name: 'Hố ga thu nước miệng hàm ếch số 14',
      layerId: 'DRAINAGE',
      layerName: 'Thoát nước & Hố ga',
      category: 'Hố ga thu nước mặt đường hàm ếch',
      route: 'Tuyến Nam Kỳ Khởi Nghĩa',
      chainage: 'Km0+340 (Mép đường)',
      lat: 10.77720,
      lng: 106.69910,
      address: 'Số 65 Nam Kỳ Khởi Nghĩa, P. Bến Thành',
      specs: 'Hố bê tông đúc sẵn M300, nắp gang cầu D400 tải trọng 40 tấn, cửa thu nước hàm ếch mở rộng 80x30cm, lưới chắn rác inox',
      commissioningDate: '2020-10-15',
      managementUnit: 'Công ty TNHH MTV Thoát nước Đô thị TP.HCM',
      assignedProjectId: 'p-2',
      notes: 'Đấu nối trực tiếp vào tuyến cống chính D1000 NKKN'
    },
    {
      id: 'ast-14',
      code: 'TN-NKKN-02',
      name: 'Hố ga thu nước kết hợp van ngăn mùi số 18',
      layerId: 'DRAINAGE',
      layerName: 'Thoát nước & Hố ga',
      category: 'Hố ga ngăn mùi công nghệ mới',
      route: 'Tuyến Nam Kỳ Khởi Nghĩa',
      chainage: 'Km0+410 (Mép đường)',
      lat: 10.77650,
      lng: 106.69980,
      address: 'Số 85 Nam Kỳ Khởi Nghĩa',
      specs: 'Kích thước 1.2x1.2x1.8m, van ngăn mùi cao su tổng hợp EPDM đóng mở một chiều chống trào ngược',
      commissioningDate: '2021-06-20',
      managementUnit: 'Công ty TNHH MTV Thoát nước Đô thị TP.HCM',
      assignedProjectId: 'p-2',
      notes: 'Công nghệ ngăn mùi tự động đạt chứng chỉ đô thị xanh'
    },
    {
      id: 'ast-15',
      code: 'TN-HN-03',
      name: 'Cửa xả cống hộp Hàm Nghi ra rạch Bến Nghé',
      layerId: 'DRAINAGE',
      layerName: 'Thoát nước & Hố ga',
      category: 'Cửa xả tiêu thoát nước chính',
      route: 'Tuyến Hàm Nghi',
      chainage: 'Km0+850 (Điểm cuối)',
      lat: 10.76980,
      lng: 106.70610,
      address: 'Cuối đường Hàm Nghi - Bến Vân Đồn',
      specs: 'Cửa xả đôi cống hộp 2x(2m x 2m), van lật tự động ngăn triều composite tải nặng, bờ kè bê tông cốt thép gia cố rọ đá',
      commissioningDate: '2019-08-30',
      managementUnit: 'Trung tâm Quản lý Hạ tầng Kỹ thuật TP.HCM',
      assignedProjectId: 'p-2',
      notes: 'Trọng điểm kiểm soát ngập triều khu vực trung tâm quận 1'
    },
    {
      id: 'ast-16',
      code: 'DB-HN-01',
      name: 'Mặt đường asphalt đoạn nút giao Hàm Nghi - Pasteur',
      layerId: 'ROADWAY',
      layerName: 'Mặt đường & Biển báo',
      category: 'Mặt đường bê tông nhựa nóng (Asphalt)',
      route: 'Tuyến Hàm Nghi',
      chainage: 'Km0+220 - Km0+280',
      lat: 10.77120,
      lng: 106.70310,
      address: 'Nút giao Hàm Nghi - Pasteur',
      specs: 'Bê tông nhựa chặt C12.5 dày 7cm trên lớp BTN C19 dày 8cm, mô đun đàn hồi yêu cầu Eyc >= 160 MPa',
      commissioningDate: '2021-03-15',
      managementUnit: 'Sở Giao thông Vận tải TP.HCM',
      assignedProjectId: 'p-2',
      notes: 'Lưu lượng giao thông trung bình ngày đêm > 45.000 PCU'
    },
    {
      id: 'ast-17',
      code: 'DB-TDT-01',
      name: 'Vỉa hè lát đá granite trước Bảo tàng Tôn Đức Thắng',
      layerId: 'ROADWAY',
      layerName: 'Mặt đường & Biển báo',
      category: 'Vỉa hè lát đá tự nhiên cao cấp',
      route: 'Tuyến Tôn Đức Thắng',
      chainage: 'Km0+140 (Phía bờ sông)',
      lat: 10.77850,
      lng: 106.70680,
      address: 'Số 05 Tôn Đức Thắng, P. Bến Nghé',
      specs: 'Đá granite tự nhiên bề mặt băm nhám 30x60x5cm, lớp vữa lót M100 dày 5cm, bo vỉa đá xám nguyên khối 15x30cm',
      commissioningDate: '2022-09-02',
      managementUnit: 'Ban QLDA Đầu tư Xây dựng Công trình Giao thông',
      assignedProjectId: 'p-3',
      notes: 'Đồng bộ kiến trúc cảnh quan công viên ven sông Sài Gòn'
    },
    {
      id: 'ast-18',
      code: 'DB-TDT-02',
      name: 'Biển báo giao thông phân làn xe ô tô giá long môn',
      layerId: 'ROADWAY',
      layerName: 'Mặt đường & Biển báo',
      category: 'Giá long môn biển báo phân làn',
      route: 'Tuyến Tôn Đức Thắng',
      chainage: 'Km0+300 (Cầu Ba Son)',
      lat: 10.77710,
      lng: 106.70610,
      address: 'Đầu cầu Ba Son - Tôn Đức Thắng',
      specs: 'Khung giàn thép ống phi 219 mạ kẽm nhúng nóng, biển báo tôn mạ kẽm dán màng phản quang 3M kim cương Series 4000',
      commissioningDate: '2022-04-28',
      managementUnit: 'Sở Giao thông Vận tải TP.HCM',
      assignedProjectId: 'p-3',
      notes: 'Biển chỉ dẫn phân làn vào hầm chui và lên cầu Ba Son'
    },

    // UNASSIGNED ASSETS IN MASTER POOL (READY FOR TESTING ASSET MAPPING)
    {
      id: 'ast-19',
      code: 'CS-TDT-09',
      name: 'Cột đèn trang trí công viên Bến Bạch Đằng số 09',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      category: 'Trụ đèn cảnh quan ven sông',
      route: 'Tuyến Tôn Đức Thắng',
      chainage: 'Km0+450 (Công viên)',
      lat: 10.77490,
      lng: 106.70690,
      address: 'Công viên Bạch Đằng, Tôn Đức Thắng',
      specs: 'Trụ thép mỹ thuật 5m kiểu cổ điển, đèn LED 60W ánh sáng vàng 2700K',
      commissioningDate: '2022-01-20',
      managementUnit: 'Trung tâm Quản lý Hạ tầng Kỹ thuật TP.HCM',
      notes: 'Tài sản trong kho dữ liệu tổng, chưa gán vào dự án'
    },
    {
      id: 'ast-20',
      code: 'CS-TDT-10',
      name: 'Cột đèn trang trí công viên Bến Bạch Đằng số 10',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      category: 'Trụ đèn cảnh quan ven sông',
      route: 'Tuyến Tôn Đức Thắng',
      chainage: 'Km0+510 (Bến tàu)',
      lat: 10.77430,
      lng: 106.70710,
      address: 'Bến tàu thủy Bạch Đằng',
      specs: 'Trụ thép sơn tĩnh điện xám sẫm, 2 chao đèn LED nón 75W, chân đế bắt bu lông neo mạ kẽm',
      commissioningDate: '2022-01-20',
      managementUnit: 'Trung tâm Quản lý Hạ tầng Kỹ thuật TP.HCM',
      notes: 'Tài sản trong kho dữ liệu tổng, chưa gán vào dự án'
    },
    {
      id: 'ast-21',
      code: 'CX-TDT-11',
      name: 'Cây Bàng vuông Trường Sa trước Cột cờ Thủ Ngữ',
      layerId: 'GREENERY',
      layerName: 'Cây xanh & Công viên',
      category: 'Cây lưu niệm lịch sử',
      route: 'Tuyến Tôn Đức Thắng',
      chainage: 'Km0+680 (Cột cờ Thủ Ngữ)',
      lat: 10.77250,
      lng: 106.70650,
      address: 'Công viên Cột cờ Thủ Ngữ, Tôn Đức Thắng',
      specs: 'Barringtonia asiatica chuyển từ Trường Sa, D=20cm, cao H=5m, sinh trưởng tốt',
      commissioningDate: '2021-02-03',
      managementUnit: 'Công ty TNHH MTV Công viên Cây xanh TP.HCM',
      notes: 'Tài sản trong kho dữ liệu tổng, chưa gán vào dự án'
    },
    {
      id: 'ast-22',
      code: 'CX-NH-12',
      name: 'Hàng hoa giấy leo giàn vòm số 02 đường Nguyễn Huệ',
      layerId: 'GREENERY',
      layerName: 'Cây xanh & Công viên',
      category: 'Giàn leo hoa cảnh quan đô thị',
      route: 'Tuyến Nguyễn Huệ',
      chainage: 'Km0+310 (Vỉa hè đông)',
      lat: 10.77390,
      lng: 106.70450,
      address: 'Gần khách sạn Kim Đô, Nguyễn Huệ',
      specs: 'Giàn thép uốn mỹ thuật cao 4m dài 15m, 12 gốc hoa giấy Bougainvillea spectabilis nhiều màu sắc',
      commissioningDate: '2022-04-30',
      managementUnit: 'Ban QLDA Đầu tư Xây dựng Khu vực Quận 1',
      notes: 'Tài sản trong kho dữ liệu tổng, chưa gán vào dự án'
    },
    {
      id: 'ast-23',
      code: 'TN-NH-05',
      name: 'Hố ga kỹ thuật điện - nước ngầm ngã tư Ngô Đức Kế',
      layerId: 'DRAINAGE',
      layerName: 'Thoát nước & Hố ga',
      category: 'Hố ga hào kỹ thuật dùng chung',
      route: 'Tuyến Nguyễn Huệ',
      chainage: 'Km0+190 (Góc ngã tư)',
      lat: 10.77495,
      lng: 106.70360,
      address: 'Góc Nguyễn Huệ - Ngô Đức Kế',
      specs: 'Hầm cáp bê tông M350 kích thước 2.0x1.5x2.2m, nắp gang đậy 4 cánh chịu lực 60T, hệ thống thoát nước đọng tự động',
      commissioningDate: '2021-10-10',
      managementUnit: 'Trung tâm Quản lý Hạ tầng Kỹ thuật TP.HCM',
      notes: 'Tài sản trong kho dữ liệu tổng, chưa gán vào dự án'
    },
    {
      id: 'ast-24',
      code: 'DB-NH-06',
      name: 'Gờ giảm tốc cao su đúc phản quang ngã ba Hải Triều',
      layerId: 'ROADWAY',
      layerName: 'Mặt đường & Biển báo',
      category: 'Gờ giảm tốc an toàn giao thông',
      route: 'Tuyến Nguyễn Huệ',
      chainage: 'Km0+390 (Lối rẽ)',
      lat: 10.77340,
      lng: 106.70480,
      address: 'Ngã ba Nguyễn Huệ - Hải Triều',
      specs: 'Cao su chịu lực tổng hợp đúc khối màu vàng-đen, kích thước rộng 35cm x cao 5cm, có mắt phản quang ban đêm',
      commissioningDate: '2022-05-15',
      managementUnit: 'Sở Giao thông Vận tải TP.HCM',
      notes: 'Tài sản trong kho dữ liệu tổng, chưa gán vào dự án'
    },
    {
      id: 'ast-25',
      code: 'CS-LL-11',
      name: 'Đèn cảnh quan âm đất lối đi bộ ga Nhà Hát',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      category: 'Đèn hắt viền lối đi ngầm',
      route: 'Tuyến Lê Lợi',
      chainage: 'Km0+040 (Cửa ga Metro)',
      lat: 10.77430,
      lng: 106.70200,
      address: 'Cửa Nam Nhà Hát Thành Phố, Lê Lợi',
      specs: 'Đèn LED thanh định hướng 18W/24V IP68, vỏ nhôm đúc tản nhiệt, mặt kính sapphire chống trầy xước',
      commissioningDate: '2023-08-15',
      managementUnit: 'Ban Quản lý Đường sắt Đô thị (MAUR)',
      notes: 'Tài sản trong kho dữ liệu tổng, chưa gán vào dự án'
    },
    {
      id: 'ast-26',
      code: 'CX-LL-14',
      name: 'Cây Me tây cổ thụ số 32 trước Khách sạn Rex',
      layerId: 'GREENERY',
      layerName: 'Cây xanh & Công viên',
      category: 'Cây bóng mát loại 3 (Cổ thụ đô thị)',
      route: 'Tuyến Lê Lợi',
      chainage: 'Km0+020 (Góc Lê Lợi - Nguyễn Huệ)',
      lat: 10.77480,
      lng: 106.70130,
      address: 'Góc Lê Lợi - Nguyễn Huệ',
      specs: 'Samanea saman, D=95cm, chiều cao H=22m, độ xòe tán 18m, tuổi thọ trên 75 năm',
      commissioningDate: '2015-01-01',
      managementUnit: 'Công ty TNHH MTV Công viên Cây xanh TP.HCM',
      notes: 'Tài sản trong kho dữ liệu tổng, chưa gán vào dự án'
    }
  ];

  masterAssets = signal<Asset[]>(this.masterAssetsData);

  // Tasks Data: Quản lý công việc và lưu vết hiện trạng tài sản theo từng task
  private tasksData: MaintenanceTask[] = [
    {
      id: 't-1',
      projectId: 'p-1',
      code: 'CV-2026-001',
      title: 'Thay thế đèn LED & bảo dưỡng tủ điện tuyến Nguyễn Huệ',
      description: 'Tiến hành tháo dỡ các chóa đèn huỳnh quang cũ, thay bằng đèn LED 150W tiết kiệm điện, kiểm tra cách điện tủ điện T01-NH.',
      contractor: 'Công ty CP Chiếu sáng & Cây xanh Đô thị Sài Gòn',
      assignedTeam: 'Tổ Kỹ thuật Điện Chiếu sáng 1',
      targetLayerId: 'LIGHTING',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      deadline: '2026-04-10',
      progress: 75,
      assetIds: ['ast-01', 'ast-02', 'ast-03', 'ast-04'],
      completedAssetIds: ['ast-01', 'ast-02'],
      taskAssets: [
        {
          assetId: 'ast-01',
          assetCode: 'CS-NH-01',
          assetName: 'Cột đèn cao áp số 01 - Trụ hoa sen 4 bóng LED 150W',
          layerId: 'LIGHTING',
          condition: 'GOOD',
          isCompleted: true,
          completedDate: '2026-03-28',
          notes: 'Đã thay chóa đèn LED 150W tiết kiệm điện, kiểm tra dây tiếp địa an toàn. Hoạt động tốt.',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80',
          photoAfterUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80'
        },
        {
          assetId: 'ast-02',
          assetCode: 'CS-NH-02',
          assetName: 'Cột đèn cao áp số 02 - Trụ đôi cảnh quan đi bộ',
          layerId: 'LIGHTING',
          condition: 'GOOD',
          isCompleted: true,
          completedDate: '2026-03-29',
          notes: 'Đã căn chỉnh góc rọi đèn và sơn lại chân đế cột. Hoạt động tốt.',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=500&q=80',
          photoAfterUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80'
        },
        {
          assetId: 'ast-03',
          assetCode: 'CS-NH-03',
          assetName: 'Tủ điều khiển chiếu sáng trung tâm T01-NH',
          layerId: 'LIGHTING',
          condition: 'NORMAL',
          isCompleted: false,
          notes: 'Đang đấu nối thêm bộ điều khiển hẹn giờ thông minh IoT',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&q=80'
        },
        {
          assetId: 'ast-04',
          assetCode: 'CS-NH-04',
          assetName: 'Đèn hắt cây bồn hoa dải phân cách số 04',
          layerId: 'LIGHTING',
          condition: 'DAMAGED',
          isCompleted: false,
          notes: 'Chờ xử lý bóng cháy chập ẩm nước, cần thay bộ nguồn chống ngập IP68',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80'
        }
      ],
      fieldPhotos: [
        {
          id: 'pht-1',
          assetId: 'ast-01',
          assetName: 'Cột đèn cao áp số 01 - Trụ hoa sen',
          url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
          timestamp: '2026-03-28 14:35:10',
          lat: 10.77584,
          lng: 106.70281,
          note: 'Đã hoàn thành lắp ráp chóa LED mới, đấu nối an toàn',
          uploadedBy: 'Thợ điện Trần Đình Nam'
        },
        {
          id: 'pht-2',
          assetId: 'ast-02',
          assetName: 'Cột đèn cao áp số 02 - Trụ đôi cảnh quan',
          url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
          timestamp: '2026-03-29 09:15:22',
          lat: 10.77526,
          lng: 106.70329,
          note: 'Đã hoàn tất đo điện áp tải 220V ổn định',
          uploadedBy: 'Thợ điện Trần Đình Nam'
        }
      ],
      createdAt: '2026-03-02'
    },
    {
      id: 't-2',
      projectId: 'p-1',
      code: 'CV-2026-002',
      title: 'Cắt tỉa hạ cành tán cây nguy hiểm trục Lê Lợi',
      description: 'Sử dụng xe cẩu chuyên dụng cắt tỉa các cành khô, vươn cao che khuất tầm nhìn biển báo và đe dọa an toàn người đi bộ.',
      contractor: 'Công ty CP Chiếu sáng & Cây xanh Đô thị Sài Gòn',
      assignedTeam: 'Tổ Cắt tỉa & Công viên Cây xanh 2',
      targetLayerId: 'GREENERY',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      deadline: '2026-04-15',
      progress: 60,
      assetIds: ['ast-05', 'ast-06', 'ast-07'],
      completedAssetIds: ['ast-05', 'ast-07'],
      taskAssets: [
        {
          assetId: 'ast-05',
          assetCode: 'CX-LL-01',
          assetName: 'Cây Dầu rái cổ thụ số 12',
          layerId: 'GREENERY',
          condition: 'GOOD',
          isCompleted: true,
          completedDate: '2026-03-27',
          notes: 'Đã tỉa 4 cành khô mục vươn ra lòng đường nguy hiểm. Cây phát triển an toàn.',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=500&q=80',
          photoAfterUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80'
        },
        {
          assetId: 'ast-06',
          assetCode: 'CX-LL-02',
          assetName: 'Cây Bằng lăng tím số 18',
          layerId: 'GREENERY',
          condition: 'NEEDS_REPLACEMENT',
          isCompleted: false,
          notes: 'Đang chống cọc sắt cố định gốc nghiêng 15 độ, thân rỗng mục cần xem xét thay thế trong quý 3',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=500&q=80'
        },
        {
          assetId: 'ast-07',
          assetCode: 'CX-NH-03',
          assetName: 'Bồn hoa dải phân cách trung tâm đoạn số 3',
          layerId: 'GREENERY',
          condition: 'GOOD',
          isCompleted: true,
          completedDate: '2026-03-30',
          notes: 'Đã trồng bổ sung 250 cây hoa dừa cạn và tỉa cỏ chuốt. Cảnh quan tươi tốt.',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&q=80',
          photoAfterUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80'
        }
      ],
      fieldPhotos: [
        {
          id: 'pht-3',
          assetId: 'ast-05',
          assetName: 'Cây Dầu rái cổ thụ số 12',
          url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80',
          timestamp: '2026-03-27 11:20:05',
          lat: 10.77382,
          lng: 106.70115,
          note: 'Hạ cành nguy hiểm hướng vỉa hè, bôi vôi sát khuẩn vết cắt',
          uploadedBy: 'Tổ trưởng Nguyễn Văn Hùng'
        },
        {
          id: 'pht-4',
          assetId: 'ast-07',
          assetName: 'Bồn hoa dải phân cách trung tâm',
          url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80',
          timestamp: '2026-03-30 16:45:18',
          lat: 10.77450,
          lng: 106.70390,
          note: 'Đã hoàn tất trồng dặm hoa và tưới nước tạo ẩm',
          uploadedBy: 'Tổ trưởng Nguyễn Văn Hùng'
        }
      ],
      createdAt: '2026-03-05'
    },
    {
      id: 't-3',
      projectId: 'p-1',
      code: 'CV-2026-003',
      title: 'Sơn phủ bảo vệ chân cột & kiểm tra hộp đầu cáp',
      description: 'Làm sạch bề mặt rỉ sét, sơn lót chống kiềm và sơn epoxy hoàn thiện các chân cột đèn trên tuyến Lê Lợi - Nguyễn Huệ.',
      contractor: 'Công ty CP Chiếu sáng & Cây xanh Đô thị Sài Gòn',
      assignedTeam: 'Tổ Sơn bảo dưỡng cơ khí 3',
      targetLayerId: 'LIGHTING',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      deadline: '2026-03-25',
      progress: 100,
      assetIds: ['ast-09', 'ast-10', 'ast-11', 'ast-road-01'],
      completedAssetIds: ['ast-09', 'ast-10', 'ast-11', 'ast-road-01'],
      taskAssets: [
        {
          assetId: 'ast-09',
          assetCode: 'CS-LL-05',
          assetName: 'Trụ đèn chiếu sáng đa hướng ngã tư Pasteur - Lê Lợi',
          layerId: 'LIGHTING',
          condition: 'GOOD',
          isCompleted: true,
          completedDate: '2026-03-22',
          notes: 'Sơn 2 lớp epoxy chống rỉ sét và dán decal phản quang. Bề mặt đạt chuẩn.',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80',
          photoAfterUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80'
        },
        {
          assetId: 'ast-10',
          assetCode: 'CS-LL-06',
          assetName: 'Cột đèn cao áp số 08 vỉa hè chợ Bến Thành',
          layerId: 'LIGHTING',
          condition: 'GOOD',
          isCompleted: true,
          completedDate: '2026-03-23',
          notes: 'Đã thay đệm gioăng chống nước hộp đấu nối chân cột. Đạt an toàn điện.',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=500&q=80',
          photoAfterUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80'
        },
        {
          assetId: 'ast-11',
          assetCode: 'CS-NH-07',
          assetName: 'Cột đèn hoa sen trước tòa nhà UBND Thành phố',
          layerId: 'LIGHTING',
          condition: 'GOOD',
          isCompleted: true,
          completedDate: '2026-03-24',
          notes: 'Bảo dưỡng hoàn tất, ánh sáng đạt tiêu chuẩn 100 Lux. Hoạt động rất tốt.',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80',
          photoAfterUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80'
        },
        {
          assetId: 'ast-road-01',
          assetCode: 'MD-LL-01',
          assetName: 'Đoạn mặt đường bê tông nhựa nóng C12.5 (Từ Pasteur đến Nam Kỳ Khởi Nghĩa)',
          layerId: 'ROADWAY',
          condition: 'GOOD',
          isCompleted: true,
          completedDate: '2026-03-24',
          notes: 'Đã cào bóc 5cm, thảm BTN C12.5 độ chặt K>=0.98, kiểm tra độ bằng phẳng thước 3m đạt chuẩn TCVN 8819.',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&q=80',
          photoAfterUrl: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=600&q=80',
          geometryType: 'LINE',
          lengthMeters: 500,
          widthMeters: 14.5,
          areaSquareMeters: 7250,
          chainage: 'Km0+100 - Km0+600',
          startPoint: { lat: 10.77350, lng: 106.70050, label: 'Ngã tư Pasteur - Lê Lợi' },
          endPoint: { lat: 10.77580, lng: 106.70280, label: 'Ngã tư Nam Kỳ Khởi Nghĩa - Lê Lợi' }
        }
      ],
      fieldPhotos: [
        {
          id: 'pht-5',
          assetId: 'ast-09',
          assetName: 'Trụ đèn ngã tư Pasteur - Lê Lợi',
          url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
          timestamp: '2026-03-22 10:10:00',
          lat: 10.77350,
          lng: 106.70050,
          note: 'Đã sơn phủ 2 lớp xám ghi đạt độ dày màng sơn',
          uploadedBy: 'Kỹ thuật viên Lê Tuấn'
        },
        {
          id: 'pht-6',
          assetId: 'ast-10',
          assetName: 'Cột đèn cao áp số 08 chợ Bến Thành',
          url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
          timestamp: '2026-03-23 15:30:00',
          lat: 10.77240,
          lng: 106.69820,
          note: 'Hoàn tất đóng siết nắp hộp đấu nối',
          uploadedBy: 'Kỹ thuật viên Lê Tuấn'
        },
        {
          id: 'pht-7',
          assetId: 'ast-11',
          assetName: 'Cột đèn hoa sen trước UBND TP',
          url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
          timestamp: '2026-03-24 16:00:00',
          lat: 10.77660,
          lng: 106.70180,
          note: 'Nghiệm thu bề mặt bóng đẹp không trầy xước',
          uploadedBy: 'Kỹ thuật viên Lê Tuấn'
        }
      ],
      createdAt: '2026-03-08'
    },
    {
      id: 't-4',
      projectId: 'p-1',
      code: 'CV-2026-004',
      title: 'Cào bóc, thảm bê tông nhựa nóng & duy tu vạch sơn mặt đường (2 đoạn tuyến)',
      description: 'Duy tu định kỳ toàn diện mặt đường và vạch sơn tín hiệu giao thông bảo đảm êm thuận cho các phương tiện lưu thông.',
      contractor: 'Công ty CP Chiếu sáng & Cây xanh Đô thị Sài Gòn',
      assignedTeam: 'Đội Thi công Đường bộ & Nhựa nóng 1',
      targetLayerId: 'ROADWAY',
      status: 'COMPLETED',
      priority: 'HIGH',
      deadline: '2026-04-10',
      progress: 100,
      assetIds: ['ast-road-01', 'ast-road-02'],
      completedAssetIds: ['ast-road-01', 'ast-road-02'],
      taskAssets: [
        {
          assetId: 'ast-road-01',
          assetCode: 'MD-LL-01',
          assetName: 'Đoạn mặt đường bê tông nhựa nóng C12.5 (Từ Pasteur đến Nam Kỳ Khởi Nghĩa)',
          layerId: 'ROADWAY',
          condition: 'GOOD',
          isCompleted: true,
          completedDate: '2026-04-01',
          notes: 'Đã cào bóc 5cm, thảm BTN C12.5 độ dày 5cm đầm lèn đạt K>=0.98, kiểm tra độ bằng phẳng thước 3m khe hở < 3mm đạt TCVN 8819.',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&q=80',
          photoAfterUrl: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=600&q=80',
          geometryType: 'LINE',
          lengthMeters: 500,
          widthMeters: 14.5,
          areaSquareMeters: 7250,
          chainage: 'Km0+100 - Km0+600',
          startPoint: { lat: 10.77350, lng: 106.70050, label: 'Ngã tư Pasteur - Lê Lợi' },
          endPoint: { lat: 10.77580, lng: 106.70280, label: 'Ngã tư Nam Kỳ Khởi Nghĩa - Lê Lợi' }
        },
        {
          assetId: 'ast-road-02',
          assetCode: 'VS-NH-02',
          assetName: 'Vạch sơn kẻ đường dẻo nhiệt & vạch đi bộ phố Nguyễn Huệ',
          layerId: 'ROADWAY',
          condition: 'GOOD',
          isCompleted: true,
          completedDate: '2026-04-02',
          notes: 'Sơn dẻo nhiệt màu trắng và vàng dày 2.0mm, rắc bi thủy tinh phản quang phản xạ ánh sáng ban đêm đạt chuẩn TCVN 8791.',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1578874691223-a4558a07c9c7?w=600&q=80',
          photoAfterUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600&q=80',
          geometryType: 'LINE',
          lengthMeters: 650,
          widthMeters: 12.0,
          areaSquareMeters: 7800,
          chainage: 'Km0+000 - Km0+650',
          startPoint: { lat: 10.77660, lng: 106.70180, label: 'Trước UBND TP' },
          endPoint: { lat: 10.77200, lng: 106.70600, label: 'Bến Bạch Đằng' }
        }
      ],
      fieldPhotos: [],
      createdAt: '2026-03-12'
    }
  ];

  tasks = signal<MaintenanceTask[]>(this.tasksData);

  // Reports & Payments Store
  private reportsData: ReportPayment[] = [
    {
      id: 'rep-1',
      projectId: 'p-1',
      projectCode: 'DA-2026-001',
      projectName: 'Duy tu, thay thế đèn chiếu sáng & cắt tỉa cây xanh tuyến trung tâm',
      code: 'BCNT-2026-01',
      periodTitle: 'Báo cáo nghiệm thu & Đề nghị thanh toán Đợt 1 (Hạng mục Chiếu sáng & Cắt tỉa)',
      contractor: 'Công ty CP Chiếu sáng & Cây xanh Đô thị Sài Gòn',
      createdDate: '2026-04-02',
      totalCompletedTasks: 1,
      totalCompletedAssets: 5,
      amountRequested: 485000000,
      status: 'PENDING_INSPECTION', // Ready for Split-view testing
      items: [
        {
          assetId: 'ast-01',
          assetCode: 'CS-NH-01',
          assetName: 'Cột đèn cao áp số 01 - Trụ hoa sen 4 bóng LED 150W',
          layerId: 'LIGHTING',
          layerName: 'Chiếu sáng đô thị',
          taskId: 't-1',
          taskTitle: 'Thay thế đèn LED & bảo dưỡng tủ điện tuyến Nguyễn Huệ',
          completedDate: '2026-03-28',
          photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80',
          photoAfterUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
          lat: 10.77584,
          lng: 106.70281,
          cost: 85000000,
          inspectorApproved: true,
          inspectorNotes: 'Đèn sáng đạt quang thông chuẩn'
        },
        {
          assetId: 'ast-02',
          assetCode: 'CS-NH-02',
          assetName: 'Cột đèn cao áp số 02 - Trụ đôi cảnh quan đi bộ',
          layerId: 'LIGHTING',
          layerName: 'Chiếu sáng đô thị',
          taskId: 't-1',
          taskTitle: 'Thay thế đèn LED & bảo dưỡng tủ điện tuyến Nguyễn Huệ',
          completedDate: '2026-03-29',
          photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=500&q=80',
          photoAfterUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
          lat: 10.77526,
          lng: 106.70329,
          cost: 65000000,
          inspectorApproved: true,
          inspectorNotes: 'Vệ sinh cột sạch sẽ'
        },
        {
          assetId: 'ast-05',
          assetCode: 'CX-LL-01',
          assetName: 'Cây Dầu rái cổ thụ số 12',
          layerId: 'GREENERY',
          layerName: 'Cây xanh & Công viên',
          taskId: 't-2',
          taskTitle: 'Cắt tỉa hạ cành tán cây nguy hiểm trục Lê Lợi',
          completedDate: '2026-03-27',
          photoUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&q=80',
          photoAfterUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80',
          lat: 10.77382,
          lng: 106.70115,
          cost: 45000000,
          inspectorApproved: true,
          inspectorNotes: 'Hạ cành đúng kỹ thuật lâm sinh'
        },
        {
          assetId: 'ast-09',
          assetCode: 'CS-LL-05',
          assetName: 'Trụ đèn đa hướng Pasteur - Lê Lợi',
          layerId: 'LIGHTING',
          layerName: 'Chiếu sáng đô thị',
          taskId: 't-3',
          taskTitle: 'Sơn phủ bảo vệ chân cột & kiểm tra hộp đầu cáp',
          completedDate: '2026-03-22',
          photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80',
          photoAfterUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
          lat: 10.77350,
          lng: 106.70050,
          cost: 55000000,
          inspectorApproved: false,
          inspectorNotes: 'Cần kiểm tra lại màng phản quang'
        },
        {
          assetId: 'ast-10',
          assetCode: 'CS-LL-06',
          assetName: 'Cột đèn cao áp số 08 chợ Bến Thành',
          layerId: 'LIGHTING',
          layerName: 'Chiếu sáng đô thị',
          taskId: 't-3',
          taskTitle: 'Sơn phủ bảo vệ chân cột & kiểm tra hộp đầu cáp',
          completedDate: '2026-03-23',
          photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=500&q=80',
          photoAfterUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
          lat: 10.77240,
          lng: 106.69820,
          cost: 55000000,
          inspectorApproved: true,
          inspectorNotes: 'Đạt yêu cầu nghiệm thu'
        },
        {
          assetId: 'ast-road-01',
          assetCode: 'MD-LL-01',
          assetName: 'Đoạn mặt đường bê tông nhựa nóng C12.5 (Từ Pasteur đến Nam Kỳ Khởi Nghĩa)',
          layerId: 'ROADWAY',
          layerName: 'Mặt đường & Biển báo',
          taskId: 't-3',
          taskTitle: 'Cào bóc & thảm bê tông nhựa nóng C12.5 hoàn trả mặt đường',
          completedDate: '2026-03-24',
          photoUrl: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=600&q=80',
          photoBeforeUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&q=80',
          photoAfterUrl: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=600&q=80',
          lat: 10.77465,
          lng: 106.70165,
          cost: 185000000,
          inspectorApproved: true,
          inspectorNotes: 'Độ bằng phẳng thước 3m và độ nhám mặt đường đạt tiêu chuẩn TCVN 8819',
          geometryType: 'LINE',
          lengthMeters: 500,
          widthMeters: 14.5,
          areaSquareMeters: 7250,
          chainage: 'Km0+100 - Km0+600',
          startPoint: { lat: 10.77350, lng: 106.70050, label: 'Ngã tư Pasteur - Lê Lợi' },
          endPoint: { lat: 10.77580, lng: 106.70280, label: 'Ngã tư Nam Kỳ Khởi Nghĩa - Lê Lợi' }
        }
      ]
    }
  ];

  reports = signal<ReportPayment[]>(this.reportsData);

  // Active Role simulation: 'OPERATOR' (Cán bộ QLDA) | 'CONTRACTOR' (Nhà thầu)
  activeRole = signal<'OPERATOR' | 'CONTRACTOR'>('OPERATOR');

  toggleRole() {
    this.activeRole.update(r => r === 'OPERATOR' ? 'CONTRACTOR' : 'OPERATOR');
  }

  // --- PROJECTS METHODS ---
  getProjects() {
    return this.projects();
  }

  getProjectById(id: string): Project | undefined {
    return this.projects().find(p => p.id === id);
  }

  createProject(newProj: Partial<Project>): Project {
    const id = 'p-' + (this.projects().length + 1);
    const code = 'DA-2026-00' + (this.projects().length + 1);
    const project: Project = {
      id,
      code,
      name: newProj.name || 'Dự án mới',
      type: newProj.type || 'Định kỳ',
      status: newProj.status || 'Khởi tạo',
      startDate: newProj.startDate || new Date().toISOString().split('T')[0],
      endDate: newProj.endDate || '2026-12-31',
      budget: Number(newProj.budget) || 500000000,
      contractor: newProj.contractor || 'Chưa chỉ định',
      managementUnit: newProj.managementUnit || 'Ban QLDA Hạ tầng Kỹ thuật số 1',
      description: newProj.description || '',
      routeName: newProj.routeName || 'Tuyến đô thị trung tâm',
      progressPercent: 0,
      totalAssetsCount: 0,
      completedAssetsCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    this.projects.update(list => [project, ...list]);
    return project;
  }

  updateProject(id: string, updates: Partial<Project>) {
    this.projects.update(list =>
      list.map(p => p.id === id ? { ...p, ...updates } : p)
    );
  }

  // --- DOCUMENTS METHODS ---
  getDocuments(projectId: string, category?: DocumentCategory): ProjectDocument[] {
    return this.documents().filter(d =>
      d.projectId === projectId && (!category || d.category === category)
    );
  }

  addDocument(doc: Partial<ProjectDocument>): ProjectDocument {
    const id = 'doc-' + (this.documents().length + 1);
    const newDoc: ProjectDocument = {
      id,
      projectId: doc.projectId!,
      category: doc.category || 'DECISION',
      name: doc.name || 'Hồ sơ mới',
      fileName: doc.fileName || 'tai_lieu.pdf',
      fileSize: doc.fileSize || '1.5 MB',
      fileType: doc.fileType || 'PDF',
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: doc.uploadedBy || (this.activeRole() === 'OPERATOR' ? 'Cán bộ QLDA' : 'Đại diện Nhà thầu'),
      notes: doc.notes || ''
    };

    this.documents.update(docs => [newDoc, ...docs]);
    return newDoc;
  }

  deleteDocument(docId: string) {
    this.documents.update(docs => docs.filter(d => d.id !== docId));
  }

  // --- ASSET MAPPING METHODS ---
  getProjectAssets(projectId: string): Asset[] {
    return this.masterAssets().filter(a => a.assignedProjectId === projectId);
  }

  getMasterPoolAssets(layerId?: LayerId): Asset[] {
    return this.masterAssets().filter(a => {
      const matchLayer = !layerId || a.layerId === layerId;
      return matchLayer;
    });
  }

  // Map selected assets into project (Many-to-Many relation as specified)
  mapAssetsToProject(projectId: string, assetIds: string[]) {
    this.masterAssets.update(assets =>
      assets.map(a => {
        if (assetIds.includes(a.id)) {
          return {
            ...a,
            assignedProjectId: projectId,
            lastUpdated: new Date().toISOString()
          };
        }
        return a;
      })
    );
    this.recalculateProjectStats(projectId);
  }

  removeAssetFromProject(projectId: string, assetId: string) {
    this.masterAssets.update(assets =>
      assets.map(a => {
        if (a.id === assetId && a.assignedProjectId === projectId) {
          return {
            ...a,
            assignedProjectId: undefined
          };
        }
        return a;
      })
    );

    // Gỡ tài sản khỏi các công việc trong dự án này nếu có
    this.tasks.update(tasks =>
      tasks.map(t => {
        if (t.projectId === projectId && t.assetIds.includes(assetId)) {
          const updatedAssetIds = t.assetIds.filter(id => id !== assetId);
          const updatedCompleted = t.completedAssetIds.filter(id => id !== assetId);
          const updatedTaskAssets = (t.taskAssets || []).filter(ta => ta.assetId !== assetId);
          const progress = updatedAssetIds.length > 0 ? Math.round((updatedCompleted.length / updatedAssetIds.length) * 100) : 0;
          return {
            ...t,
            assetIds: updatedAssetIds,
            completedAssetIds: updatedCompleted,
            taskAssets: updatedTaskAssets,
            progress
          };
        }
        return t;
      })
    );

    this.recalculateProjectStats(projectId);
  }

  // Legacy compatibility: cập nhật status nếu có luồng cũ gọi
  updateAssetStatus(assetId: string, status: AssetMaintenanceStatus) {
    let affectedProjectId: string | undefined;
    this.masterAssets.update(assets =>
      assets.map(a => {
        if (a.id === assetId) {
          affectedProjectId = a.assignedProjectId;
          return {
            ...a,
            status
          };
        }
        return a;
      })
    );

    if (affectedProjectId) {
      this.recalculateProjectStats(affectedProjectId);
    }
  }

  // Tra cứu các công việc có thao tác trên một tài sản cụ thể
  getTasksForAsset(assetId: string): MaintenanceTask[] {
    return this.tasks().filter(t => t.assetIds.includes(assetId));
  }

  // Tra cứu hiện trạng ghi nhận gần nhất của một tài sản từ các task đã thực hiện
  getAssetLatestCondition(assetId: string): { condition: AssetCondition; taskTitle: string; date?: string; notes?: string } | undefined {
    const tasksWithAsset = this.getTasksForAsset(assetId);
    for (const t of tasksWithAsset) {
      const item = t.taskAssets?.find(a => a.assetId === assetId);
      if (item) {
        return {
          condition: item.condition,
          taskTitle: t.title,
          date: item.completedDate || t.createdAt,
          notes: item.notes
        };
      }
    }
    return undefined;
  }

  // Helper nhãn hiện trạng
  getAssetConditionLabel(condition: AssetCondition): string {
    return ASSET_CONDITION_CONFIG[condition]?.label || condition;
  }

  // Helper nhãn trạng thái công việc
  getTaskStatusLabel(status: TaskStatus): string {
    return TASK_STATUS_CONFIG[status]?.label || status;
  }

  // --- TASK MANAGEMENT METHODS ---
  getProjectTasks(projectId: string): MaintenanceTask[] {
    return this.tasks().filter(t => t.projectId === projectId);
  }

  getTaskById(taskId: string): MaintenanceTask | undefined {
    return this.tasks().find(t => t.id === taskId);
  }

  createTask(newTask: Partial<MaintenanceTask>): MaintenanceTask {
    const id = 't-' + (this.tasks().length + 1);
    const code = 'CV-2026-0' + (this.tasks().length + 1);
    const assetIds = newTask.assetIds || [];
    const masterAssetsList = this.masterAssets();

    // Khởi tạo danh sách TaskAssetItem đính kèm trong task với hiện trạng ban đầu
    const taskAssets: TaskAssetItem[] = assetIds.map(aid => {
      const ast = masterAssetsList.find(a => a.id === aid);
      return {
        assetId: aid,
        assetCode: ast?.code || aid,
        assetName: ast?.name || 'Tài sản',
        layerId: ast?.layerId,
        condition: 'NORMAL',
        isCompleted: false,
        notes: 'Chưa thực hiện kiểm tra / thi công hiện trường'
      };
    });

    const task: MaintenanceTask = {
      id,
      projectId: newTask.projectId!,
      code,
      title: newTask.title || 'Công việc mới',
      description: newTask.description || '',
      contractor: newTask.contractor || 'Công ty CP Chiếu sáng & Cây xanh Sài Gòn',
      assignedTeam: newTask.assignedTeam || 'Tổ Kỹ thuật Hiện trường',
      targetLayerId: newTask.targetLayerId || 'ALL',
      status: newTask.status || 'NOT_STARTED',
      priority: newTask.priority || 'MEDIUM',
      deadline: newTask.deadline || '2026-05-30',
      progress: 0,
      taskAssets,
      assetIds,
      completedAssetIds: [],
      fieldPhotos: [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    // LƯU Ý: Không gán trực tiếp assignedTaskId vào Asset Master Data catalog!
    this.tasks.update(tasks => [task, ...tasks]);
    return task;
  }

  // Cập nhật hiện trạng tài sản trực tiếp trong 1 Task cụ thể
  updateTaskAssetCondition(taskId: string, assetId: string, condition: AssetCondition, notes?: string) {
    this.tasks.update(tasks =>
      tasks.map(t => {
        if (t.id === taskId) {
          const updatedTaskAssets = (t.taskAssets || []).map(ta => {
            if (ta.assetId === assetId) {
              return {
                ...ta,
                condition,
                notes: notes !== undefined ? notes : ta.notes
              };
            }
            return ta;
          });
          return { ...t, taskAssets: updatedTaskAssets };
        }
        return t;
      })
    );
  }

  // Inline update task status: NOT_STARTED | IN_PROGRESS | PAUSED | COMPLETED
  updateTaskStatus(taskId: string, status: TaskStatus) {
    this.tasks.update(tasks =>
      tasks.map(t => {
        if (t.id === taskId) {
          const progress = status === 'COMPLETED' ? 100 : (status === 'IN_PROGRESS' ? (t.progress === 0 ? 30 : t.progress) : t.progress);
          return { ...t, status, progress };
        }
        return t;
      })
    );
  }

  // Field Contractor: hoàn thành tài sản trong task & đính kèm ảnh hiện trường & lưu hiện trạng đánh giá
  completeAssetInTask(taskId: string, assetId: string, photoUrl: string, note: string, condition: AssetCondition = 'GOOD') {
    const task = this.tasks().find(t => t.id === taskId);
    const asset = this.masterAssets().find(a => a.id === assetId);
    if (!task || !asset) return;

    const newPhoto: FieldPhoto = {
      id: 'pht-' + Date.now(),
      assetId,
      assetName: asset.name,
      url: photoUrl,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      lat: asset.lat,
      lng: asset.lng,
      note,
      uploadedBy: 'Thợ thi công hiện trường'
    };

    // Cập nhật trạng thái và hiện trạng tài sản trong Task
    this.tasks.update(tasks =>
      tasks.map(t => {
        if (t.id === taskId) {
          const updatedCompleted = Array.from(new Set([...t.completedAssetIds, assetId]));
          const progress = Math.round((updatedCompleted.length / (t.assetIds.length || 1)) * 100);
          const status: TaskStatus = progress === 100 ? 'COMPLETED' : 'IN_PROGRESS';

          const updatedTaskAssets = (t.taskAssets || []).map(ta => {
            if (ta.assetId === assetId) {
              return {
                ...ta,
                isCompleted: true,
                condition,
                completedDate: new Date().toISOString().substring(0, 10),
                photoAfterUrl: photoUrl,
                notes: note || ta.notes
              };
            }
            return ta;
          });

          return {
            ...t,
            completedAssetIds: updatedCompleted,
            progress,
            status,
            taskAssets: updatedTaskAssets,
            fieldPhotos: [newPhoto, ...t.fieldPhotos]
          };
        }
        return t;
      })
    );

    this.recalculateProjectStats(task.projectId);
  }

  // Cập nhật trạng thái hoàn thành và hiện trạng của 1 tài sản trong 1 task cụ thể (Độc lập, không xung đột giữa các task)
  setTaskAssetCompletion(taskId: string, assetId: string, completed: boolean, photoUrl?: string, note?: string, condition?: AssetCondition, photoBeforeUrl?: string) {
    const asset = this.masterAssets().find(a => a.id === assetId);
    let targetProjectId = '';

    this.tasks.update(tasks =>
      tasks.map(t => {
        if (t.id === taskId) {
          targetProjectId = t.projectId;
          let updatedCompleted = [...t.completedAssetIds];
          let updatedPhotos = [...t.fieldPhotos];

          if (completed) {
            if (!updatedCompleted.includes(assetId)) {
              updatedCompleted.push(assetId);
            }
            if (photoUrl) {
              const newPhoto: FieldPhoto = {
                id: 'photo-' + Date.now(),
                assetId,
                assetName: asset?.name || 'Tài sản',
                url: photoUrl,
                timestamp: new Date().toLocaleString('vi-VN'),
                lat: asset?.lat || 10.7769,
                lng: asset?.lng || 106.7009,
                note: note || 'Nghiệm thu tiến độ theo task',
                uploadedBy: 'Cán bộ giám sát / Đội thi công'
              };
              const existingIndex = updatedPhotos.findIndex(p => p.assetId === assetId);
              if (existingIndex >= 0) {
                updatedPhotos[existingIndex] = newPhoto;
              } else {
                updatedPhotos = [newPhoto, ...updatedPhotos];
              }
            }
          } else {
            updatedCompleted = updatedCompleted.filter(id => id !== assetId);
          }

          const progress = Math.round((updatedCompleted.length / (t.assetIds.length || 1)) * 100);
          const status: TaskStatus = progress === 100 ? 'COMPLETED' : (progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED');

          const updatedTaskAssets = (t.taskAssets || []).map(ta => {
            if (ta.assetId === assetId) {
              return {
                ...ta,
                isCompleted: completed,
                condition: condition || (completed ? 'GOOD' : ta.condition || 'NORMAL'),
                completedDate: completed ? new Date().toISOString().substring(0, 10) : undefined,
                photoBeforeUrl: photoBeforeUrl || ta.photoBeforeUrl,
                photoAfterUrl: photoUrl || ta.photoAfterUrl,
                notes: note !== undefined ? note : ta.notes
              };
            }
            return ta;
          });

          return {
            ...t,
            completedAssetIds: updatedCompleted,
            progress,
            status,
            taskAssets: updatedTaskAssets,
            fieldPhotos: updatedPhotos
          };
        }
        return t;
      })
    );

    if (targetProjectId) {
      this.recalculateProjectStats(targetProjectId);
    }
  }

  // --- REPORTING & PAYMENT METHODS ---
  // Section 5 Auto-fill: scan all COMPLETED tasks & photos in project
  generateAutoFillReport(projectId: string): ReportPayment {
    const project = this.getProjectById(projectId);
    const completedTasks = this.getProjectTasks(projectId).filter(t => t.status === 'COMPLETED' || t.completedAssetIds.length > 0);
    const projectAssets = this.getProjectAssets(projectId);

    const items: ReportItem[] = [];
    let totalRequested = 0;

    completedTasks.forEach(task => {
      task.completedAssetIds.forEach(astId => {
        const asset = projectAssets.find(a => a.id === astId);
        if (asset) {
          const photo = task.fieldPhotos.find(p => p.assetId === astId);
          const cost = asset.layerId === 'LIGHTING' ? 65000000 :
                       asset.layerId === 'GREENERY' ? 35000000 :
                       asset.layerId === 'DRAINAGE' ? 45000000 : 40000000;
          totalRequested += cost;

          items.push({
            assetId: asset.id,
            assetCode: asset.code,
            assetName: asset.name,
            layerId: asset.layerId,
            layerName: asset.layerName,
            taskId: task.id,
            taskTitle: task.title,
            completedDate: new Date().toISOString().split('T')[0],
            photoUrl: photo?.url || asset.completedPhotoUrl || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
            lat: asset.lat,
            lng: asset.lng,
            cost,
            inspectorApproved: false,
            inspectorNotes: ''
          });
        }
      });
    });

    const reportCode = 'BCNT-2026-0' + (this.reports().length + 1);
    const report: ReportPayment = {
      id: 'rep-' + Date.now(),
      projectId,
      projectCode: project?.code || '',
      projectName: project?.name || '',
      code: reportCode,
      periodTitle: `Báo cáo nghiệm thu & Đề nghị thanh toán khối lượng hoàn thành (${reportCode})`,
      contractor: project?.contractor || 'Đơn vị thi công',
      createdDate: new Date().toISOString().split('T')[0],
      totalCompletedTasks: completedTasks.length,
      totalCompletedAssets: items.length,
      amountRequested: totalRequested > 0 ? totalRequested : 250000000,
      status: 'PENDING_INSPECTION',
      items: items.length > 0 ? items : [
        {
          assetId: 'ast-01',
          assetCode: 'CS-NH-01',
          assetName: 'Cột đèn cao áp số 01',
          layerId: 'LIGHTING',
          layerName: 'Chiếu sáng đô thị',
          taskId: 't-1',
          taskTitle: 'Thay thế đèn LED',
          completedDate: new Date().toISOString().split('T')[0],
          photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
          lat: 10.77584,
          lng: 106.70281,
          cost: 85000000,
          inspectorApproved: true,
          inspectorNotes: 'Đèn sáng ổn định'
        }
      ]
    };

    this.reports.update(reports => [report, ...reports]);
    return report;
  }

  getReports(projectId?: string): ReportPayment[] {
    if (projectId) {
      return this.reports().filter(r => r.projectId === projectId);
    }
    return this.reports();
  }

  getReportById(reportId: string): ReportPayment | undefined {
    return this.reports().find(r => r.id === reportId);
  }

  approveReportItem(reportId: string, assetId: string, approved: boolean, notes?: string) {
    this.reports.update(reports =>
      reports.map(r => {
        if (r.id === reportId) {
          const updatedItems = r.items.map(it => {
            if (it.assetId === assetId) {
              return { ...it, inspectorApproved: approved, inspectorNotes: notes || it.inspectorNotes };
            }
            return it;
          });
          return { ...r, items: updatedItems };
        }
        return r;
      })
    );
  }

  finalizeReportApproval(reportId: string, approvedBy: string) {
    this.reports.update(reports =>
      reports.map(r => {
        if (r.id === reportId) {
          const approvedItems = r.items.filter(it => it.inspectorApproved);
          const approvedAmount = approvedItems.reduce((acc, it) => acc + it.cost, 0);
          return {
            ...r,
            status: 'APPROVED',
            amountApproved: approvedAmount,
            approvedBy,
            approvedDate: new Date().toISOString().split('T')[0]
          };
        }
        return r;
      })
    );
  }

  rejectReport(reportId: string, reason: string) {
    this.reports.update(reports =>
      reports.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            status: 'REJECTED',
            rejectedReason: reason
          };
        }
        return r;
      })
    );
  }

  markReportPaid(reportId: string) {
    this.reports.update(reports =>
      reports.map(r => r.id === reportId ? { ...r, status: 'PAID' } : r)
    );
  }

  // Nhà thầu tạo & nộp báo cáo nghiệm thu khối lượng hoàn thành lên Ban QLDA
  submitContractorReport(data: {
    projectId: string;
    periodTitle: string;
    contractor: string;
    items: ReportItem[];
    amountRequested: number;
  }): ReportPayment {
    const project = this.getProjectById(data.projectId);
    const reportCode = 'BCNT-2026-0' + (this.reports().length + 1);
    const newReport: ReportPayment = {
      id: 'rep-' + Date.now(),
      projectId: data.projectId,
      projectCode: project?.code || '',
      projectName: project?.name || '',
      code: reportCode,
      periodTitle: data.periodTitle || `Báo cáo nghiệm thu & Đề nghị thanh toán (${reportCode})`,
      contractor: data.contractor || project?.contractor || 'Đơn vị thi công',
      createdDate: new Date().toISOString().split('T')[0],
      totalCompletedTasks: new Set(data.items.map(it => it.taskId)).size,
      totalCompletedAssets: data.items.length,
      amountRequested: data.amountRequested,
      status: 'PENDING_INSPECTION',
      items: data.items
    };

    this.reports.update(reports => [newReport, ...reports]);
    return newReport;
  }

  // Internal helper to keep project stats synced dựa trên tiến độ hoàn thành từ các Task
  private recalculateProjectStats(projectId: string) {
    const assets = this.getProjectAssets(projectId);
    const total = assets.length;
    const tasks = this.getProjectTasks(projectId);
    const completedSet = new Set<string>();
    tasks.forEach(t => (t.completedAssetIds || []).forEach(id => completedSet.add(id)));
    const completed = assets.filter(a => completedSet.has(a.id)).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    this.projects.update(list =>
      list.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            totalAssetsCount: total,
            completedAssetsCount: completed,
            progressPercent: percent
          };
        }
        return p;
      })
    );
  }
}
