import { Injectable, signal } from '@angular/core';
import {
  Project,
  ProjectDocument,
  DocumentCategory,
  DataLayer,
  Asset,
  LayerId,
  AssetMaintenanceStatus,
  MaintenanceTask,
  TaskStatus,
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

  // Master Map Assets (All urban assets)
  private masterAssetsData: Asset[] = [
    // LIGHTING on Nguyễn Huệ
    {
      id: 'ast-01',
      code: 'CS-NH-01',
      name: 'Cột đèn cao áp số 01 - Trụ hoa sen 4 bóng LED 150W',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      route: 'Tuyến Nguyễn Huệ',
      lat: 10.77584,
      lng: 106.70281,
      address: 'Số 02 Nguyễn Huệ, P. Bến Nghé, Q.1',
      status: 'COMPLETED',
      assignedProjectId: 'p-1',
      assignedTaskId: 't-1',
      assignedTaskTitle: 'Thay thế đèn LED & bảo dưỡng tủ điện tuyến Nguyễn Huệ',
      beforePhotoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80',
      completedPhotoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80',
      notes: 'Đã thay chóa đèn LED 150W tiết kiệm điện, kiểm tra dây tiếp địa an toàn'
    },
    {
      id: 'ast-02',
      code: 'CS-NH-02',
      name: 'Cột đèn cao áp số 02 - Trụ đôi cảnh quan đi bộ',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      route: 'Tuyến Nguyễn Huệ',
      lat: 10.77526,
      lng: 106.70329,
      address: 'Số 22 Nguyễn Huệ, P. Bến Nghé, Q.1',
      status: 'COMPLETED',
      assignedProjectId: 'p-1',
      assignedTaskId: 't-1',
      assignedTaskTitle: 'Thay thế đèn LED & bảo dưỡng tủ điện tuyến Nguyễn Huệ',
      beforePhotoUrl: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=500&q=80',
      completedPhotoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80',
      notes: 'Đã căn chỉnh góc rọi đèn và sơn lại chân đế cột'
    },
    {
      id: 'ast-03',
      code: 'CS-NH-03',
      name: 'Tủ điều khiển chiếu sáng trung tâm T01-NH',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      route: 'Tuyến Nguyễn Huệ',
      lat: 10.77478,
      lng: 106.70375,
      address: 'Giao lộ Nguyễn Huệ - Ngô Đức Kế',
      status: 'IN_PROGRESS',
      assignedProjectId: 'p-1',
      assignedTaskId: 't-1',
      assignedTaskTitle: 'Thay thế đèn LED & bảo dưỡng tủ điện tuyến Nguyễn Huệ',
      notes: 'Đang đấu nối thêm bộ điều khiển hẹn giờ thông minh IoT'
    },
    {
      id: 'ast-04',
      code: 'CS-NH-04',
      name: 'Đèn hắt cây bồn hoa dải phân cách số 04',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      route: 'Tuyến Nguyễn Huệ',
      lat: 10.77415,
      lng: 106.70425,
      address: 'Số 68 Nguyễn Huệ, P. Bến Nghé, Q.1',
      status: 'PENDING',
      assignedProjectId: 'p-1',
      assignedTaskId: 't-1',
      notes: 'Chờ xử lý bóng cháy chập ẩm nước'
    },

    // GREENERY on Lê Lợi & Nguyễn Huệ
    {
      id: 'ast-05',
      code: 'CX-LL-01',
      name: 'Cây Dầu rái cổ thụ số 12 (Đường kính thân 80cm)',
      layerId: 'GREENERY',
      layerName: 'Cây xanh & Công viên',
      route: 'Tuyến Lê Lợi',
      lat: 10.77382,
      lng: 106.70115,
      address: 'Số 15 Lê Lợi, P. Bến Nghé, Q.1',
      status: 'COMPLETED',
      assignedProjectId: 'p-1',
      assignedTaskId: 't-2',
      assignedTaskTitle: 'Cắt tỉa hạ cành tán cây nguy hiểm trục Lê Lợi',
      beforePhotoUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=500&q=80',
      completedPhotoUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&q=80',
      notes: 'Đã tỉa 4 cành khô mục vươn ra lòng đường nguy hiểm'
    },
    {
      id: 'ast-06',
      code: 'CX-LL-02',
      name: 'Cây Bằng lăng tím số 18',
      layerId: 'GREENERY',
      layerName: 'Cây xanh & Công viên',
      route: 'Tuyến Lê Lợi',
      lat: 10.77321,
      lng: 106.69985,
      address: 'Số 45 Lê Lợi, P. Bến Thành, Q.1',
      status: 'IN_PROGRESS',
      assignedProjectId: 'p-1',
      assignedTaskId: 't-2',
      assignedTaskTitle: 'Cắt tỉa hạ cành tán cây nguy hiểm trục Lê Lợi',
      notes: 'Đang chống cọc sắt cố định gốc nghiêng 15 độ'
    },
    {
      id: 'ast-07',
      code: 'CX-NH-03',
      name: 'Bồn hoa dải phân cách trung tâm đoạn số 3',
      layerId: 'GREENERY',
      layerName: 'Cây xanh & Công viên',
      route: 'Tuyến Nguyễn Huệ',
      lat: 10.77450,
      lng: 106.70390,
      address: 'Phố đi bộ Nguyễn Huệ đoạn Mạc Thị Bưởi',
      status: 'COMPLETED',
      assignedProjectId: 'p-1',
      assignedTaskId: 't-2',
      beforePhotoUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&q=80',
      completedPhotoUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&q=80',
      notes: 'Đã trồng bổ sung 250 cây hoa dừa cạn và tỉa cỏ chuốt'
    },
    {
      id: 'ast-08',
      code: 'CX-LL-04',
      name: 'Hàng cây Sao đen số 05-09 dải vỉa hè phía Nam',
      layerId: 'GREENERY',
      layerName: 'Cây xanh & Công viên',
      route: 'Tuyến Lê Lợi',
      lat: 10.77280,
      lng: 106.69890,
      address: 'Gần ga Metro Bến Thành, Lê Lợi',
      status: 'PENDING',
      assignedProjectId: 'p-1',
      notes: 'Chờ xe cẩu chuyên dụng tiếp cận cắt ngọn'
    },

    // LIGHTING on Lê Lợi
    {
      id: 'ast-09',
      code: 'CS-LL-05',
      name: 'Trụ đèn chiếu sáng đa hướng ngã tư Pasteur - Lê Lợi',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      route: 'Tuyến Lê Lợi',
      lat: 10.77350,
      lng: 106.70050,
      address: 'Giao lộ Lê Lợi - Pasteur, Q.1',
      status: 'COMPLETED',
      assignedProjectId: 'p-1',
      assignedTaskId: 't-3',
      assignedTaskTitle: 'Sơn phủ bảo vệ chân cột & kiểm tra hộp đầu cáp',
      beforePhotoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80',
      completedPhotoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80',
      notes: 'Sơn 2 lớp expoxy chống rỉ sét và dán decal phản quang'
    },
    {
      id: 'ast-10',
      code: 'CS-LL-06',
      name: 'Cột đèn cao áp số 08 vỉa hè chợ Bến Thành',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      route: 'Tuyến Lê Lợi',
      lat: 10.77240,
      lng: 106.69820,
      address: 'Số 136 Lê Lợi, P. Bến Thành, Q.1',
      status: 'COMPLETED',
      assignedProjectId: 'p-1',
      assignedTaskId: 't-3',
      assignedTaskTitle: 'Sơn phủ bảo vệ chân cột & kiểm tra hộp đầu cáp',
      beforePhotoUrl: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=500&q=80',
      completedPhotoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80',
      notes: 'Đã thay đệm gioăng chống nước hộp đấu nối chân cột'
    },
    {
      id: 'ast-11',
      code: 'CS-NH-07',
      name: 'Cột đèn hoa sen trước tòa nhà UBND Thành phố',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      route: 'Tuyến Nguyễn Huệ',
      lat: 10.77660,
      lng: 106.70180,
      address: 'Số 86 Lê Thánh Tôn - Nguyễn Huệ',
      status: 'COMPLETED',
      assignedProjectId: 'p-1',
      assignedTaskId: 't-3',
      assignedTaskTitle: 'Sơn phủ bảo vệ chân cột & kiểm tra hộp đầu cáp',
      beforePhotoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80',
      completedPhotoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80',
      notes: 'Bảo dưỡng hoàn tất, ánh sáng đạt tiêu chuẩn 100 Lux'
    },
    {
      id: 'ast-12',
      code: 'CX-NH-08',
      name: 'Cây Sứ đại hoa trắng bồn cảnh tượng đài Bác Hồ',
      layerId: 'GREENERY',
      layerName: 'Cây xanh & Công viên',
      route: 'Tuyến Nguyễn Huệ',
      lat: 10.77620,
      lng: 106.70220,
      address: 'Công viên Tượng đài Bác, Nguyễn Huệ',
      status: 'IN_PROGRESS',
      assignedProjectId: 'p-1',
      notes: 'Đang bón phân hữu cơ vi sinh và tỉa tán tạo thế'
    },

    // DRAINAGE & ROADWAY on Nam Kỳ Khởi Nghĩa & Hàm Nghi (Project 2 & Master pool)
    {
      id: 'ast-13',
      code: 'TN-NKKN-01',
      name: 'Hố ga thu nước miệng hàm ếch số 14',
      layerId: 'DRAINAGE',
      layerName: 'Thoát nước & Hố ga',
      route: 'Tuyến Nam Kỳ Khởi Nghĩa',
      lat: 10.77720,
      lng: 106.69910,
      address: 'Số 65 Nam Kỳ Khởi Nghĩa, P. Bến Thành',
      status: 'COMPLETED',
      assignedProjectId: 'p-2',
      notes: 'Nạo vét 1.2m3 bùn cát, thay nắp đan gang chịu tải D400'
    },
    {
      id: 'ast-14',
      code: 'TN-NKKN-02',
      name: 'Hố ga thu nước kết hợp van ngăn mùi số 18',
      layerId: 'DRAINAGE',
      layerName: 'Thoát nước & Hố ga',
      route: 'Tuyến Nam Kỳ Khởi Nghĩa',
      lat: 10.77650,
      lng: 106.69980,
      address: 'Số 85 Nam Kỳ Khởi Nghĩa',
      status: 'IN_PROGRESS',
      assignedProjectId: 'p-2',
      notes: 'Đang thông cống ngầm đường kính D800 bằng xe hút áp lực cao'
    },
    {
      id: 'ast-15',
      code: 'TN-HN-03',
      name: 'Cửa xả cống hộp Hàm Nghi ra rạch Bến Nghé',
      layerId: 'DRAINAGE',
      layerName: 'Thoát nước & Hố ga',
      route: 'Tuyến Hàm Nghi',
      lat: 10.76980,
      lng: 106.70610,
      address: 'Cuối đường Hàm Nghi - Bến Vân Đồn',
      status: 'PENDING',
      assignedProjectId: 'p-2',
      notes: 'Cần sửa chữa van lật tự động chống triều cường'
    },
    {
      id: 'ast-16',
      code: 'DB-HN-01',
      name: 'Mặt đường asphalt đoạn nút giao Hàm Nghi - Pasteur',
      layerId: 'ROADWAY',
      layerName: 'Mặt đường & Biển báo',
      route: 'Tuyến Hàm Nghi',
      lat: 10.77120,
      lng: 106.70310,
      address: 'Nút giao Hàm Nghi - Pasteur',
      status: 'IN_PROGRESS',
      assignedProjectId: 'p-2',
      notes: 'Đang cào bóc mặt đường rạn nứt diện tích 45m2 và thảm nhựa nóng'
    },
    {
      id: 'ast-17',
      code: 'DB-TDT-01',
      name: 'Vỉa hè lát đá granite trước Bảo tàng Tôn Đức Thắng',
      layerId: 'ROADWAY',
      layerName: 'Mặt đường & Biển báo',
      route: 'Tuyến Tôn Đức Thắng',
      lat: 10.77850,
      lng: 106.70680,
      address: 'Số 05 Tôn Đức Thắng, P. Bến Nghé',
      status: 'PENDING',
      assignedProjectId: 'p-3',
      notes: 'Bị sụt lún do xe tải dừng đỗ sai quy định'
    },
    {
      id: 'ast-18',
      code: 'DB-TDT-02',
      name: 'Biển báo giao thông phân làn xe ô tô giá long môn',
      layerId: 'ROADWAY',
      layerName: 'Mặt đường & Biển báo',
      route: 'Tuyến Tôn Đức Thắng',
      lat: 10.77710,
      lng: 106.70610,
      address: 'Đầu cầu Ba Son - Tôn Đức Thắng',
      status: 'PENDING',
      assignedProjectId: 'p-3',
      notes: 'Màng phản quang bị mờ sau thời gian dài sử dụng'
    },

    // UNASSIGNED ASSETS IN MASTER POOL (READY FOR TESTING ASSET MAPPING)
    {
      id: 'ast-19',
      code: 'CS-TDT-09',
      name: 'Cột đèn trang trí công viên Bến Bạch Đằng số 09',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      route: 'Tuyến Tôn Đức Thắng',
      lat: 10.77490,
      lng: 106.70690,
      address: 'Công viên Bạch Đằng, Tôn Đức Thắng',
      status: 'PENDING',
      notes: 'Tài sản trong kho dữ liệu tổng, chưa gán vào dự án'
    },
    {
      id: 'ast-20',
      code: 'CS-TDT-10',
      name: 'Cột đèn trang trí công viên Bến Bạch Đằng số 10',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      route: 'Tuyến Tôn Đức Thắng',
      lat: 10.77430,
      lng: 106.70710,
      address: 'Bến tàu thủy Bạch Đằng',
      status: 'PENDING',
      notes: 'Tài sản trong kho dữ liệu tổng, chưa gán vào dự án'
    },
    {
      id: 'ast-21',
      code: 'CX-TDT-11',
      name: 'Cây Bàng vuông Trường Sa trước Cột cờ Thủ Ngữ',
      layerId: 'GREENERY',
      layerName: 'Cây xanh & Công viên',
      route: 'Tuyến Tôn Đức Thắng',
      lat: 10.77250,
      lng: 106.70650,
      address: 'Công viên Cột cờ Thủ Ngữ, Tôn Đức Thắng',
      status: 'PENDING',
      notes: 'Tài sản trong kho dữ liệu tổng, chưa gán vào dự án'
    },
    {
      id: 'ast-22',
      code: 'CX-NH-12',
      name: 'Hàng hoa giấy leo giàn vòm số 02 đường Nguyễn Huệ',
      layerId: 'GREENERY',
      layerName: 'Cây xanh & Công viên',
      route: 'Tuyến Nguyễn Huệ',
      lat: 10.77390,
      lng: 106.70450,
      address: 'Gần khách sạn Kim Đô, Nguyễn Huệ',
      status: 'PENDING',
      notes: 'Tài sản trong kho dữ liệu tổng, chưa gán vào dự án'
    },
    {
      id: 'ast-23',
      code: 'TN-NH-05',
      name: 'Hố ga kỹ thuật điện - nước ngầm ngã tư Ngô Đức Kế',
      layerId: 'DRAINAGE',
      layerName: 'Thoát nước & Hố ga',
      route: 'Tuyến Nguyễn Huệ',
      lat: 10.77495,
      lng: 106.70360,
      address: 'Góc Nguyễn Huệ - Ngô Đức Kế',
      status: 'PENDING',
      notes: 'Tài sản trong kho dữ liệu tổng, chưa gán vào dự án'
    },
    {
      id: 'ast-24',
      code: 'DB-NH-06',
      name: 'Gờ giảm tốc cao su đúc phản quang ngã ba Hải Triều',
      layerId: 'ROADWAY',
      layerName: 'Mặt đường & Biển báo',
      route: 'Tuyến Nguyễn Huệ',
      lat: 10.77340,
      lng: 106.70480,
      address: 'Ngã ba Nguyễn Huệ - Hải Triều',
      status: 'PENDING',
      notes: 'Tài sản trong kho dữ liệu tổng, chưa gán vào dự án'
    },
    {
      id: 'ast-25',
      code: 'CS-LL-11',
      name: 'Đèn cảnh quan âm đất lối đi bộ ga Nhà Hát',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng đô thị',
      route: 'Tuyến Lê Lợi',
      lat: 10.77430,
      lng: 106.70200,
      address: 'Cửa Nam Nhà Hát Thành Phố, Lê Lợi',
      status: 'PENDING',
      notes: 'Tài sản trong kho dữ liệu tổng, chưa gán vào dự án'
    },
    {
      id: 'ast-26',
      code: 'CX-LL-14',
      name: 'Cây Me tây cổ thụ số 32 trước Khách sạn Rex',
      layerId: 'GREENERY',
      layerName: 'Cây xanh & Công viên',
      route: 'Tuyến Lê Lợi',
      lat: 10.77480,
      lng: 106.70130,
      address: 'Góc Lê Lợi - Nguyễn Huệ',
      status: 'PENDING',
      notes: 'Tài sản trong kho dữ liệu tổng, chưa gán vào dự án'
    }
  ];

  masterAssets = signal<Asset[]>(this.masterAssetsData);

  // Tasks Data
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
      assetIds: ['ast-09', 'ast-10', 'ast-11'],
      completedAssetIds: ['ast-09', 'ast-10', 'ast-11'],
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
          lat: 10.77240,
          lng: 106.69820,
          cost: 55000000,
          inspectorApproved: true,
          inspectorNotes: 'Đạt yêu cầu nghiệm thu'
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
            assignedProjectId: undefined,
            assignedTaskId: undefined,
            assignedTaskTitle: undefined,
            status: 'PENDING'
          };
        }
        return a;
      })
    );
    this.recalculateProjectStats(projectId);
  }

  // Inline editing asset status: PENDING | IN_PROGRESS | COMPLETED
  updateAssetStatus(assetId: string, status: AssetMaintenanceStatus) {
    let affectedProjectId: string | undefined;
    this.masterAssets.update(assets =>
      assets.map(a => {
        if (a.id === assetId) {
          affectedProjectId = a.assignedProjectId;
          return {
            ...a,
            status,
            lastUpdated: new Date().toISOString()
          };
        }
        return a;
      })
    );

    if (affectedProjectId) {
      this.recalculateProjectStats(affectedProjectId);
    }
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
      assetIds: newTask.assetIds || [],
      completedAssetIds: [],
      fieldPhotos: [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Update assets assignedTaskId
    if (task.assetIds.length > 0) {
      this.masterAssets.update(assets =>
        assets.map(a => {
          if (task.assetIds.includes(a.id)) {
            return {
              ...a,
              assignedTaskId: task.id,
              assignedTaskTitle: task.title
            };
          }
          return a;
        })
      );
    }

    this.tasks.update(tasks => [task, ...tasks]);
    return task;
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

  // Field Contractor: complete asset & attach photo
  completeAssetInTask(taskId: string, assetId: string, photoUrl: string, note: string) {
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

    // Update asset status
    this.updateAssetStatus(assetId, 'COMPLETED');
    this.masterAssets.update(assets =>
      assets.map(a => a.id === assetId ? { ...a, completedPhotoUrl: photoUrl } : a)
    );

    // Update task
    this.tasks.update(tasks =>
      tasks.map(t => {
        if (t.id === taskId) {
          const updatedCompleted = Array.from(new Set([...t.completedAssetIds, assetId]));
          const progress = Math.round((updatedCompleted.length / (t.assetIds.length || 1)) * 100);
          const status = progress === 100 ? 'COMPLETED' : 'IN_PROGRESS';
          return {
            ...t,
            completedAssetIds: updatedCompleted,
            progress,
            status,
            fieldPhotos: [newPhoto, ...t.fieldPhotos]
          };
        }
        return t;
      })
    );
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

  // Internal helper to keep project stats synced
  private recalculateProjectStats(projectId: string) {
    const assets = this.getProjectAssets(projectId);
    const total = assets.length;
    const completed = assets.filter(a => a.status === 'COMPLETED').length;
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
