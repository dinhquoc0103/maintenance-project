import { Injectable, inject, signal } from '@angular/core';
import { ProjectService } from './project.service';
import { ToastService } from './toast.service';
import {
  IssueCategory,
  PatrolTeam,
  PatrolPersonnel,
  PatrolSchedule,
  PatrolIssue,
  PatrolLog,
  IssuePriority,
  IssueStatus,
  ShiftType,
  AttendanceStatus,
  AssetCondition,
} from '../models/patrol.model';
import { LayerId } from '../models/maintenance.model';

@Injectable({
  providedIn: 'root',
})
export class PatrolService {
  private projectService = inject(ProjectService);
  private toast = inject(ToastService);

  // --- 1. DANH MỤC LOẠI VẤN ĐỀ (UC 2) ---
  readonly categories = signal<IssueCategory[]>([
    {
      id: 'cat-1',
      code: 'SC-CS-01',
      name: 'Đèn tín hiệu / Đèn chiếu sáng tắt, chập cháy',
      layerId: 'LIGHTING',
      defaultPriority: 'HIGH',
      estimatedFixHours: 4,
      description:
        'Bóng đèn led hỏng nguồn, chập cháy dây cáp ngầm, nhảy aptomat tủ điều khiển',
      isActive: true,
      standardCostEstimate: 4500000,
    },
    {
      id: 'cat-2',
      code: 'SC-CX-02',
      name: 'Cây gãy cành, nghiêng đổ nguy hiểm',
      layerId: 'GREENERY',
      defaultPriority: 'URGENT',
      estimatedFixHours: 2,
      description:
        'Cành cây lớn gãy mục đe dọa người đi bộ và phương tiện giao thông sau giông lốc',
      isActive: true,
      standardCostEstimate: 6000000,
    },
    {
      id: 'cat-3',
      code: 'SC-TN-03',
      name: 'Hố ga mất nắp, rách lưới thu nước, nghẹt cống',
      layerId: 'DRAINAGE',
      defaultPriority: 'URGENT',
      estimatedFixHours: 3,
      description:
        'Mất nắp đan gang hố ga tạo bẫy giao thông, ngập úng cục bộ do rác bít kín',
      isActive: true,
      standardCostEstimate: 8500000,
    },
    {
      id: 'cat-4',
      code: 'SC-MD-04',
      name: 'Mặt đường sụt lún, ổ gà, lượn sóng nguy hiểm',
      layerId: 'ROADWAY',
      defaultPriority: 'HIGH',
      estimatedFixHours: 12,
      description:
        'Vết nứt chân chim kéo dài, sụt lún vỉa hè lát đá hoa cương, lún ổ gà mặt đường',
      isActive: true,
      standardCostEstimate: 15000000,
    },
    {
      id: 'cat-5',
      code: 'SC-BB-05',
      name: 'Biển báo giao thông xiêu vẹo, mờ chữ phản quang',
      layerId: 'ROADWAY',
      defaultPriority: 'MEDIUM',
      estimatedFixHours: 24,
      description:
        'Cột biển báo bị xe va quẹt cong vênh, màng phản quang bong tróc giảm tầm nhìn',
      isActive: true,
      standardCostEstimate: 2800000,
    },
    {
      id: 'cat-6',
      code: 'SC-CS-06',
      name: 'Hở nắp hộp đấu nối chân cột đèn, rò điện',
      layerId: 'LIGHTING',
      defaultPriority: 'URGENT',
      estimatedFixHours: 2,
      description:
        'Nắp kiểm tra chân cột bị bung hoặc mất, tiềm ẩn nguy cơ phóng điện giật',
      isActive: true,
      standardCostEstimate: 1200000,
    },
  ]);

  // --- 2. CỤM NHÂN SỰ & NHÓM QUYỀN (UC 1) ---
  readonly teams = signal<PatrolTeam[]>([
    {
      id: 'team-1',
      code: 'DOI-TK-Q1',
      name: 'Đội Tuần kiểm Trung tâm Quận 1 (Tuyến Nguyễn Huệ - Lê Lợi)',
      leaderId: 'ns-1',
      leaderName: 'Trần Đình Nam',
      assignedArea: 'Phường Bến Nghé & Bến Thành, Quận 1',
      permissionGroup: 'TRƯỞNG ĐỘI TUẦN KIỂM',
      description:
        'Phụ trách tuần tra thường trực trục đường phố đi bộ và khu vực quảng trường trung tâm',
      memberCount: 6,
    },
    {
      id: 'team-2',
      code: 'DOI-TK-VD',
      name: 'Đội Tuần kiểm Hạ tầng Ven Sông (Bến Bạch Đằng - Cầu Ba Son)',
      leaderId: 'ns-3',
      leaderName: 'Lê Hoàng Long',
      assignedArea: 'Dọc tuyến Tôn Đức Thắng & Bến Bạch Đằng',
      permissionGroup: 'NHÂN VIÊN HIỆN TRƯỜNG',
      description:
        'Tuần kiểm hệ thống chiếu sáng công viên cảnh quan, cây xanh ven bờ sông Sài Gòn',
      memberCount: 5,
    },
    {
      id: 'team-3',
      code: 'DOI-TK-TN',
      name: 'Tổ Phản ứng nhanh Thoát nước & Giao thông Đô thị',
      leaderId: 'ns-5',
      leaderName: 'Vũ Quốc Toàn',
      assignedArea: 'Trục Nam Kỳ Khởi Nghĩa, Hàm Nghi, Pasteur',
      permissionGroup: 'QUẢN TRỊ VẬN HÀNH',
      description:
        'Tuần tra phát hiện sự cố hố ga, sụt lún mặt đường và biển báo chỉ dẫn giao thông',
      memberCount: 8,
    },
  ]);

  // --- 3. DANH SÁCH NHÂN SỰ TUẦN KIỂM (UC 1 & UC 5) ---
  readonly personnel = signal<PatrolPersonnel[]>([
    {
      id: 'ns-1',
      code: 'NS-001',
      name: 'Trần Đình Nam',
      phone: '0903.112.456',
      role: 'TEAM_LEADER',
      teamId: 'team-1',
      teamName: 'Đội Tuần kiểm Trung tâm Quận 1',
      assignedRoutes: ['Tuyến Nguyễn Huệ', 'Tuyến Lê Lợi'],
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '06:45 13/10/2026',
      checkInLocation: 'Công viên Tượng đài Bác Hồ (GPS: 10.7762, 106.7022)',
      isValidAttendance: true,
    },
    {
      id: 'ns-2',
      code: 'NS-002',
      name: 'Nguyễn Văn Minh',
      phone: '0918.445.890',
      role: 'INSPECTOR',
      teamId: 'team-1',
      teamName: 'Đội Tuần kiểm Trung tâm Quận 1',
      assignedRoutes: ['Tuyến Nguyễn Huệ'],
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '06:55 13/10/2026',
      checkInLocation: 'Đầu đường Nguyễn Huệ - Lê Thánh Tôn',
      isValidAttendance: true,
    },
    {
      id: 'ns-3',
      code: 'NS-003',
      name: 'Lê Hoàng Long',
      phone: '0937.228.991',
      role: 'TEAM_LEADER',
      teamId: 'team-2',
      teamName: 'Đội Tuần kiểm Hạ tầng Ven Sông',
      assignedRoutes: ['Tuyến Tôn Đức Thắng'],
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '07:10 13/10/2026',
      checkInLocation: 'Ga tàu thủy Bạch Đằng (GPS: 10.7743, 106.7071)',
      isValidAttendance: true,
    },
    {
      id: 'ns-4',
      code: 'NS-004',
      name: 'Phạm Thị Thúy Hằng',
      phone: '0982.551.342',
      role: 'INSPECTOR',
      teamId: 'team-2',
      teamName: 'Đội Tuần kiểm Hạ tầng Ven Sông',
      assignedRoutes: ['Tuyến Tôn Đức Thắng', 'Cột cờ Thủ Ngữ'],
      isActive: true,
      todayAttendance: 'LATE',
      checkInTime: '07:42 13/10/2026',
      checkInLocation: 'Công viên Cột cờ Thủ Ngữ',
      isValidAttendance: false, // Chờ Cán bộ đánh giá
    },
    {
      id: 'ns-5',
      code: 'NS-005',
      name: 'Vũ Quốc Toàn',
      phone: '0908.776.331',
      role: 'SUPERVISOR',
      teamId: 'team-3',
      teamName: 'Tổ Phản ứng nhanh Thoát nước & Giao thông Đô thị',
      assignedRoutes: ['Tuyến Nam Kỳ Khởi Nghĩa - Hàm Nghi'],
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '06:30 13/10/2026',
      checkInLocation: 'Ngã tư Pasteur - Lê Lợi',
      isValidAttendance: true,
    },
    {
      id: 'ns-6',
      code: 'NS-006',
      name: 'Đặng Thanh Tùng',
      phone: '0979.663.210',
      role: 'INSPECTOR',
      teamId: 'team-3',
      teamName: 'Tổ Phản ứng nhanh Thoát nước & Giao thông Đô thị',
      assignedRoutes: ['Tuyến Nam Kỳ Khởi Nghĩa'],
      isActive: true,
      todayAttendance: 'NOT_CHECKED_IN',
      isValidAttendance: false,
    },
  ]);

  // --- 4. LỊCH & ĐIỀU PHỐI TUẦN KIỂM (UC 3, UC 7, UC 8) ---
  readonly schedules = signal<PatrolSchedule[]>([
    {
      id: 'sch-1',
      date: '2026-10-13',
      shift: 'SANG',
      routeName: 'Tuyến Phố đi bộ Nguyễn Huệ',
      startPointName: 'UBND TP (Lê Thánh Tôn)',
      endPointName: 'Cột cờ Thủ Ngữ (Bến Bạch Đằng)',
      routeCoordinates: [
        [10.7766, 106.7018],
        [10.77584, 106.70281],
        [10.77495, 106.7036],
        [10.7739, 106.7045],
        [10.7725, 106.7065],
      ],
      targetAssetIds: [
        'ast-01',
        'ast-02',
        'ast-07',
        'ast-11',
        'ast-22',
        'ast-23',
      ],
      teamId: 'team-1',
      teamName: 'Đội Tuần kiểm Trung tâm Quận 1',
      assignedPersonnel: [
        {
          id: 'ns-1',
          name: 'Trần Đình Nam',
          phone: '0903.112.456',
          checkedIn: true,
        },
        {
          id: 'ns-2',
          name: 'Nguyễn Văn Minh',
          phone: '0918.445.890',
          checkedIn: true,
        },
      ],
      status: 'IN_PROGRESS',
      checkpointsTotal: 6,
      checkpointsInspected: 4,
      notes:
        'Trọng tâm kiểm tra các chóa đèn led nghệ thuật và hố ga kỹ thuật ngầm dọc phố đi bộ',
    },
    {
      id: 'sch-2',
      date: '2026-10-13',
      shift: 'CHIEU',
      routeName: 'Tuyến Tôn Đức Thắng - Ven sông Sài Gòn',
      startPointName: 'Đầu cầu Ba Son',
      endPointName: 'Cầu Khánh Hội',
      routeCoordinates: [
        [10.7771, 106.7061],
        [10.7749, 106.7069],
        [10.7743, 106.7071],
        [10.7725, 106.7065],
      ],
      targetAssetIds: ['ast-19', 'ast-20', 'ast-21'],
      teamId: 'team-2',
      teamName: 'Đội Tuần kiểm Hạ tầng Ven Sông',
      assignedPersonnel: [
        {
          id: 'ns-3',
          name: 'Lê Hoàng Long',
          phone: '0937.228.991',
          checkedIn: true,
        },
        {
          id: 'ns-4',
          name: 'Phạm Thị Thúy Hằng',
          phone: '0982.551.342',
          checkedIn: true,
        },
      ],
      status: 'PLANNED',
      checkpointsTotal: 5,
      checkpointsInspected: 0,
      notes:
        'Kiểm tra hành lang an toàn công viên ven sông, cành cây cổ thụ đón gió sông',
    },
    {
      id: 'sch-3',
      date: '2026-10-13',
      shift: 'TOI',
      routeName: 'Tuyến Trục Nam Kỳ Khởi Nghĩa - Hàm Nghi',
      startPointName: 'Ngã tư Lê Lợi - Nam Kỳ Khởi Nghĩa',
      endPointName: 'Chợ Bến Thành',
      routeCoordinates: [
        [10.7772, 106.6991],
        [10.7765, 106.6998],
        [10.7724, 106.6982],
      ],
      targetAssetIds: ['ast-13', 'ast-14', 'ast-10'],
      teamId: 'team-3',
      teamName: 'Tổ Phản ứng nhanh Thoát nước & Giao thông Đô thị',
      assignedPersonnel: [
        {
          id: 'ns-5',
          name: 'Vũ Quốc Toàn',
          phone: '0908.776.331',
          checkedIn: true,
        },
      ],
      status: 'PLANNED',
      checkpointsTotal: 4,
      checkpointsInspected: 0,
      notes:
        'Giám sát lưới thu nước hố ga và hệ thống chiếu sáng giao thông ban đêm',
    },
    {
      id: 'sch-4',
      date: '2026-10-14',
      shift: 'SANG',
      routeName: 'Tuyến Đại lộ Lê Lợi (Khu vực Ga ngầm Metro Nhà Hát)',
      startPointName: 'Nhà Hát Thành Phố',
      endPointName: 'Chợ Bến Thành',
      routeCoordinates: [
        [10.7748, 106.7013],
        [10.7743, 106.702],
        [10.7735, 106.7005],
        [10.7724, 106.6982],
      ],
      targetAssetIds: ['ast-05', 'ast-06', 'ast-09', 'ast-25', 'ast-26'],
      teamId: 'team-1',
      teamName: 'Đội Tuần kiểm Trung tâm Quận 1',
      assignedPersonnel: [
        {
          id: 'ns-1',
          name: 'Trần Đình Nam',
          phone: '0903.112.456',
          checkedIn: false,
        },
        {
          id: 'ns-2',
          name: 'Nguyễn Văn Minh',
          phone: '0918.445.890',
          checkedIn: false,
        },
      ],
      status: 'PLANNED',
      checkpointsTotal: 5,
      checkpointsInspected: 0,
      notes:
        'Định kỳ kiểm tra hạ tầng vỉa hè lát đá và cây xanh sau khi hoàn trả mặt bằng',
    },
    {
      id: 'sch-5',
      date: '2026-10-15',
      shift: 'CHIEU',
      routeName: 'Tuyến Công viên Bến Bạch Đằng - Cầu Mống',
      startPointName: 'Cột cờ Thủ Ngữ',
      endPointName: 'Cầu Mống (Bến Vân Đồn)',
      routeCoordinates: [
        [10.7725, 106.7065],
        [10.7698, 106.7052],
        [10.7681, 106.7039],
      ],
      targetAssetIds: ['ast-17', 'ast-18', 'ast-21'],
      teamId: 'team-1',
      teamName: 'Đội Tuần kiểm Trung tâm Quận 1',
      assignedPersonnel: [
        {
          id: 'ns-1',
          name: 'Trần Đình Nam',
          phone: '0903.112.456',
          checkedIn: false,
        },
        {
          id: 'ns-2',
          name: 'Nguyễn Văn Minh',
          phone: '0918.445.890',
          checkedIn: false,
        },
      ],
      status: 'PLANNED',
      checkpointsTotal: 4,
      checkpointsInspected: 0,
      notes:
        'Giám sát hệ thống lan can thép bảo vệ bờ kè và hệ thống van ngăn triều',
    },
  ]);

  // --- 5. DANH SÁCH VẤN ĐỀ / SỰ CỐ TUẦN KIỂM (UC 4, UC 6, UC 9, UC 10) ---
  readonly issues = signal<PatrolIssue[]>([
    {
      id: 'iss-1',
      code: 'SC-2026-101',
      title:
        'Đèn cảnh quan âm đất lối đi bộ ga Nhà Hát bị vỡ kính bảo vệ, chập điện',
      reportedAt: '13/10/2026 07:15',
      reportedBy: { id: 'ns-1', name: 'Trần Đình Nam', phone: '0903.112.456' },
      categoryId: 'cat-1',
      categoryName: 'Đèn tín hiệu / Đèn chiếu sáng tắt, chập cháy',
      layerId: 'LIGHTING',
      priority: 'HIGH',
      status: 'NEW',
      description:
        'Mặt kính cường lực bảo vệ bóng đèn âm sàn bị xe máy leo vỉa hè làm nứt vỡ, đọng nước mưa bên trong gây chập nổ aptomat nhánh.',
      photoBeforeUrl:
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=700&q=80',
      lat: 10.7743,
      lng: 106.702,
      address: 'Cửa Nam Nhà Hát Thành Phố, Lê Lợi, P. Bến Nghé, Q.1',
      routeName: 'Tuyến Lê Lợi',
      assetId: 'ast-25',
      assetCode: 'CS-LL-11',
      assetName: 'Đèn cảnh quan âm đất lối đi bộ ga Nhà Hát',
    },
    {
      id: 'iss-2',
      code: 'SC-2026-102',
      title:
        'Cây Me tây cổ thụ có nhánh khô đường kính 25cm nứt toác vươn ra đường',
      reportedAt: '13/10/2026 07:32',
      reportedBy: { id: 'ns-1', name: 'Trần Đình Nam', phone: '0903.112.456' },
      categoryId: 'cat-2',
      categoryName: 'Cây gãy cành, nghiêng đổ nguy hiểm',
      layerId: 'GREENERY',
      priority: 'URGENT',
      status: 'NEW',
      description:
        'Nhánh cây lớn ở độ cao 6m bị sâu đục thân làm gãy nứt dở, có nguy cơ rơi xuống lòng đường khi gió lớn, cần xe thang xử lý gấp.',
      photoBeforeUrl:
        'https://images.unsplash.com/photo-1448375240586-882707db888b?w=700&q=80',
      lat: 10.7748,
      lng: 106.7013,
      address: 'Góc Lê Lợi - Nguyễn Huệ (Trước Khách sạn Rex)',
      routeName: 'Tuyến Lê Lợi',
      assetId: 'ast-26',
      assetCode: 'CX-LL-14',
      assetName: 'Cây Me tây cổ thụ số 32 trước Khách sạn Rex',
    },
    {
      id: 'iss-3',
      code: 'SC-2026-103',
      title: 'Hố ga kỹ thuật ngầm bị nứt vỡ mép đan bê tông ngã tư Ngô Đức Kế',
      reportedAt: '13/10/2026 08:05',
      reportedBy: {
        id: 'ns-2',
        name: 'Nguyễn Văn Minh',
        phone: '0918.445.890',
      },
      scheduleId: 'sch-1',
      categoryId: 'cat-3',
      categoryName: 'Hố ga mất nắp, rách lưới thu nước, nghẹt cống',
      layerId: 'DRAINAGE',
      priority: 'HIGH',
      status: 'NEW',
      description:
        'Mép cổ hố ga kỹ thuật bị sứt vỡ một mảng lớn tạo gờ thụt sâu 8cm, người đi bộ và xe đạp rất dễ vấp ngã.',
      photoBeforeUrl:
        'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=700&q=80',
      lat: 10.77495,
      lng: 106.7036,
      address: 'Góc Nguyễn Huệ - Ngô Đức Kế, P. Bến Nghé, Q.1',
      routeName: 'Tuyến Nguyễn Huệ',
      assetId: 'ast-23',
      assetCode: 'TN-NH-05',
      assetName: 'Hố ga kỹ thuật điện - nước ngầm ngã tư Ngô Đức Kế',
    },
    {
      id: 'iss-4',
      code: 'SC-2026-104',
      title: 'Gờ giảm tốc cao su bị bật vít nở bung một nửa chiều dài',
      reportedAt: '13/10/2026 08:20',
      reportedBy: {
        id: 'ns-2',
        name: 'Nguyễn Văn Minh',
        phone: '0918.445.890',
      },
      categoryId: 'cat-4',
      categoryName: 'Mặt đường sụt lún, ổ gà, lượn sóng nguy hiểm',
      layerId: 'ROADWAY',
      priority: 'MEDIUM',
      status: 'QUICK_FIXING',
      description:
        'Thanh cao su giảm tốc bị xe tải nhỏ chèn làm đứt vít neo, chĩa đầu sắt lên trên gây nguy hiểm cho lốp xe máy.',
      photoBeforeUrl:
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&q=80',
      lat: 10.7734,
      lng: 106.7048,
      address: 'Ngã ba Nguyễn Huệ - Hải Triều, Q.1',
      routeName: 'Tuyến Nguyễn Huệ',
      assetId: 'ast-24',
      assetCode: 'DB-NH-06',
      assetName: 'Gờ giảm tốc cao su đúc phản quang ngã ba Hải Triều',
      attachedAssets: [
        {
          assetId: 'ast-24',
          assetCode: 'DB-NH-06',
          assetName: 'Gờ giảm tốc cao su đúc phản quang ngã ba Hải Triều',
          condition: 'DAMAGED',
          lat: 10.7734,
          lng: 106.7048,
          address: 'Ngã ba Nguyễn Huệ - Hải Triều, Q.1',
        },
      ],
      quickFixDetails: {
        contractorOrTeam: 'Đội Phản ứng nhanh Duy tu Quận 1',
        assignedWorker: 'Nguyễn Văn Hải (Thợ cơ khí)',
        estimatedCost: 1500000,
        deadline: '13/10/2026 14:00',
        startedAt: '13/10/2026 09:00',
        resolutionNote:
          'Đang dùng máy khoan bê tông thay thế 8 bu lông neo inox phi 12',
      },
    },
    {
      id: 'iss-5',
      code: 'SC-2026-098',
      title:
        'Cột đèn trang trí công viên Bến Bạch Đằng bị tróc sơn và rò điện nhẹ chân trụ',
      reportedAt: '12/10/2026 15:40',
      reportedBy: { id: 'ns-3', name: 'Lê Hoàng Long', phone: '0937.228.991' },
      categoryId: 'cat-6',
      categoryName: 'Hở nắp hộp đấu nối chân cột đèn, rò điện',
      layerId: 'LIGHTING',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      description:
        'Nắp hộp đấu nối bị bung gioăng cao su, hơi nước sông ẩm làm mốc rỉ sứ cách điện.',
      photoBeforeUrl:
        'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=700&q=80',
      photoAfterUrl:
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=700&q=80',
      lat: 10.7749,
      lng: 106.7069,
      address: 'Công viên Bạch Đằng, Tôn Đức Thắng, Q.1',
      routeName: 'Tuyến Tôn Đức Thắng',
      assetId: 'ast-19',
      assetCode: 'CS-TDT-09',
      assetName: 'Cột đèn trang trí công viên Bến Bạch Đằng số 09',
      quickFixDetails: {
        contractorOrTeam: 'Tổ Kỹ thuật Điện Chiếu sáng 1',
        assignedWorker: 'Phạm Minh Trí',
        estimatedCost: 850000,
        deadline: '12/10/2026 18:00',
        startedAt: '12/10/2026 16:00',
        completedAt: '12/10/2026 17:30',
        resolutionNote:
          'Đã thay mới nắp đậy hợp kim nhôm, đi lại cáp nối đất an toàn tiêu chuẩn 4 Ohm',
        acceptedBy: 'Cán bộ Nguyễn Văn Hùng',
      },
    },
    {
      id: 'iss-6',
      code: 'SC-2026-095',
      title:
        'Cây Bàng vuông Trường Sa trước Cột cờ Thủ Ngữ bị nghiêng gốc sau bão số 2',
      reportedAt: '11/10/2026 10:15',
      reportedBy: {
        id: 'ns-4',
        name: 'Phạm Thị Thúy Hằng',
        phone: '0982.551.342',
      },
      categoryId: 'cat-2',
      categoryName: 'Cây gãy cành, nghiêng đổ nguy hiểm',
      layerId: 'GREENERY',
      priority: 'HIGH',
      status: 'MOVED_TO_PROJECT',
      description:
        'Bộ rễ cây bị đứt một phần do gió giật, đã chuyển vào dự án duy tu cải tạo cảnh quan công viên ven sông.',
      photoBeforeUrl:
        'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=700&q=80',
      lat: 10.7725,
      lng: 106.7065,
      address: 'Công viên Cột cờ Thủ Ngữ, Tôn Đức Thắng',
      routeName: 'Tuyến Tôn Đức Thắng',
      assetId: 'ast-21',
      assetCode: 'CX-TDT-11',
      assetName: 'Cây Bàng vuông Trường Sa trước Cột cờ Thủ Ngữ',
      projectLinkDetails: {
        projectId: 'p-3',
        projectCode: 'DA-2026-003',
        projectName:
          'Sửa chữa thường xuyên vỉa hè lát đá granit và biển báo chỉ dẫn đường Tôn Đức Thắng',
        linkedAt: '11/10/2026 14:00',
        linkedBy: 'Cán bộ Ban QLDA 1',
      },
    },
    {
      id: 'iss-7',
      code: 'SC-2026-105',
      title:
        'Sụt lún vỉa hè lát đá đoạn trước số 82 Nguyễn Huệ (kèm 2 vị trí liên tiếp)',
      reportedAt: '13/10/2026 08:45',
      reportedBy: { id: 'ns-1', name: 'Trần Đình Nam', phone: '0903.112.456' },
      scheduleId: 'sch-1',
      categoryId: 'cat-4',
      categoryName: 'Mặt đường sụt lún, ổ gà, lượn sóng nguy hiểm',
      layerId: 'ROADWAY',
      priority: 'HIGH',
      status: 'REJECTED',
      description:
        'Vỉa hè lát đá bị lún võng 5cm, đọng nước mưa khi triều cường. Có 2 điểm kế tiếp nhau.',
      photoBeforeUrl:
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=700&q=80',
      lat: 10.7738,
      lng: 106.7042,
      address: 'Số 82 Phố đi bộ Nguyễn Huệ, P. Bến Nghé, Q.1',
      routeName: 'Tuyến Nguyễn Huệ',
      assetId: 'ast-24',
      assetCode: 'DB-NH-06',
      assetName: 'Gờ giảm tốc & Vỉa hè Nguyễn Huệ',
      attachedAssets: [
        {
          assetId: 'ast-24',
          assetCode: 'DB-NH-06',
          assetName: 'Gờ giảm tốc & Vỉa hè Nguyễn Huệ',
          condition: 'DAMAGED',
          lat: 10.7734,
          lng: 106.7048,
          address: 'Ngã ba Nguyễn Huệ - Hải Triều, Q.1',
        },
      ],
      rejectReason:
        'Ảnh chụp hiện trường bị mờ và góc chụp không thể hiện rõ độ lún so với cao độ vỉa hè chuẩn. Đề nghị chụp lại góc nghiêng 45 độ và đo khoảng lún cụ thể.',
      rejectedAt: '13/10/2026 09:15',
      rejectedBy: 'Lê Hoàng Long (Cán bộ Quản lý Vận hành)',
    },
  ]);

  // --- 6. NHẬT KÝ TUẦN KIỂM (UC 9) ---
  readonly logs = signal<PatrolLog[]>([
    {
      id: 'log-1',
      scheduleId: 'sch-1',
      personnelName: 'Trần Đình Nam',
      action: 'CHECK_IN',
      title: 'Điểm danh vào ca tuần kiểm sáng',
      details:
        'Điểm danh thành công qua App Mobile tại tọa độ 10.7762, 106.7022 (Công viên Tượng đài Bác Hồ)',
      timestamp: '13/10/2026 06:45',
      lat: 10.7762,
      lng: 106.7022,
      status: 'SUCCESS',
    },
    {
      id: 'log-2',
      scheduleId: 'sch-1',
      personnelName: 'Nguyễn Văn Minh',
      action: 'CHECK_IN',
      title: 'Điểm danh vào ca tuần kiểm sáng',
      details: 'Điểm danh thành công tại đầu đường Nguyễn Huệ - Lê Thánh Tôn',
      timestamp: '13/10/2026 06:55',
      lat: 10.7766,
      lng: 106.7018,
      status: 'SUCCESS',
    },
    {
      id: 'log-3',
      scheduleId: 'sch-1',
      issueId: 'iss-1',
      personnelName: 'Trần Đình Nam',
      action: 'REPORT_ISSUE',
      title: 'Phát hiện sự cố: Đèn âm sàn lối đi vỡ kính',
      details:
        'Chụp 2 ảnh hiện trường, gán mã tài sản CS-LL-11, xếp mức ưu tiên: Cao',
      timestamp: '13/10/2026 07:15',
      lat: 10.7743,
      lng: 106.702,
      status: 'WARNING',
    },
    {
      id: 'log-4',
      scheduleId: 'sch-1',
      issueId: 'iss-2',
      personnelName: 'Trần Đình Nam',
      action: 'REPORT_ISSUE',
      title: 'Phát hiện sự cố: Nhánh Me tây nguy hiểm',
      details:
        'Chụp ảnh nhánh cây gãy nứt, tọa độ 10.7748, 106.7013, xếp mức: Khẩn cấp',
      timestamp: '13/10/2026 07:32',
      lat: 10.7748,
      lng: 106.7013,
      status: 'DANGER',
    },
    {
      id: 'log-5',
      scheduleId: 'sch-1',
      issueId: 'iss-3',
      personnelName: 'Nguyễn Văn Minh',
      action: 'REPORT_ISSUE',
      title: 'Phát hiện sự cố: Nứt vỡ hố ga kỹ thuật ngầm',
      details: 'Chụp ảnh hố ga ngã tư Ngô Đức Kế, gắn nhãn Asset TN-NH-05',
      timestamp: '13/10/2026 08:05',
      lat: 10.77495,
      lng: 106.7036,
      status: 'WARNING',
    },
  ]);

  // Selected State
  selectedIssueId = signal<string | null>('iss-1');
  selectedScheduleId = signal<string | null>('sch-1');
  demoFlowGuideVisible = signal<boolean>(true);

  // --- METHODS: WORKSPACE & ISSUES (UC 4, UC 6, UC 9, UC 10) ---

  getSelectedIssue(): PatrolIssue | undefined {
    const id = this.selectedIssueId();
    return this.issues().find((i) => i.id === id);
  }

  selectIssue(issueId: string) {
    this.selectedIssueId.set(issueId);
  }

  // Luồng Khắc Phục Nhanh (Trường hợp 1 - UC 10)
  createQuickFixTask(
    issueId: string,
    contractorOrTeam: string,
    assignedWorker: string,
    estimatedCost: number,
    deadline: string,
    initialNote: string,
  ) {
    this.issues.update((list) =>
      list.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            status: 'QUICK_FIXING',
            quickFixDetails: {
              contractorOrTeam,
              assignedWorker,
              estimatedCost,
              deadline,
              startedAt: new Date().toLocaleString('vi-VN'),
              resolutionNote: initialNote,
            },
          };
        }
        return iss;
      }),
    );

    // Thêm nhật ký
    const target = this.issues().find((i) => i.id === issueId);
    this.addLog({
      issueId,
      personnelName: 'Cán bộ Điều Hành QLDA',
      action: 'QUICK_FIX',
      title: `Kích hoạt lệnh khắc phục nhanh cho sự cố [${target?.code}]`,
      details: `Giao cho: ${contractorOrTeam} (${assignedWorker}), Dự toán: ${estimatedCost.toLocaleString()} VNĐ, Hạn chót: ${deadline}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      lat: target?.lat || 10.7745,
      lng: target?.lng || 106.7025,
      status: 'INFO',
    });

    this.toast.success(
      'Khởi tạo Task Khắc phục nhanh thành công!',
      `Đã giao việc cho ${assignedWorker} (${contractorOrTeam})`,
    );
  }

  // Nghiệm thu / Hoàn thành Khắc phục nhanh
  completeQuickFix(
    issueId: string,
    afterPhotoUrl: string,
    acceptedBy: string,
    finalNote: string,
  ) {
    this.issues.update((list) =>
      list.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            status: 'RESOLVED',
            photoAfterUrl:
              afterPhotoUrl ||
              'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=700&q=80',
            quickFixDetails: iss.quickFixDetails
              ? {
                  ...iss.quickFixDetails,
                  completedAt: new Date().toLocaleString('vi-VN'),
                  acceptedBy,
                  resolutionNote: finalNote,
                }
              : undefined,
          };
        }
        return iss;
      }),
    );

    this.toast.success(
      'Nghiệm thu hoàn thành!',
      `Sự cố đã được sửa chữa và đánh dấu an toàn.`,
    );
  }

  // Cán bộ Quản lý Từ Chối Tiếp Nhận Sự Cố (Kèm lý do)
  rejectIssue(issueId: string, reason: string, rejectedBy?: string) {
    const mgr = rejectedBy || 'Cán bộ Quản lý Vận hành';
    const nowStr =
      new Date().toLocaleDateString('vi-VN') +
      ' ' +
      new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    let targetCode = '';

    this.issues.update((list) =>
      list.map((iss) => {
        if (iss.id === issueId) {
          targetCode = iss.code;
          return {
            ...iss,
            status: 'REJECTED' as IssueStatus,
            rejectReason: reason,
            rejectedAt: nowStr,
            rejectedBy: mgr,
          };
        }
        return iss;
      }),
    );

    this.addLog({
      issueId,
      personnelName: mgr,
      action: 'REPORT_ISSUE',
      title: `Từ chối tiếp nhận sự cố [${targetCode}]`,
      details: `Lý do từ chối: ${reason}`,
      timestamp: nowStr,
      lat: 10.7745,
      lng: 106.7025,
      status: 'DANGER',
    });

    this.toast.danger(
      'Đã từ chối tiếp nhận sự cố',
      `Mã [${targetCode}]. Người tuần kiểm có thể cập nhật lại để gửi lại.`,
    );
  }

  // Người tuần kiểm Cập nhật & Gửi lại Sự cố bị từ chối (Resubmit)
  resubmitIssue(
    issueId: string,
    updateData: {
      title?: string;
      description?: string;
      photoUrl?: string;
      layerId?: LayerId;
      categoryId?: string;
      attachedAssetIds?: string[];
      address?: string;
      routeName?: string;
      lat?: number;
      lng?: number;
    },
    resubmitNote?: string,
  ) {
    const nowStr =
      new Date().toLocaleDateString('vi-VN') +
      ' ' +
      new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    let targetCode = '';

    const category = updateData.categoryId
      ? this.categories().find((c) => c.id === updateData.categoryId)
      : undefined;

    // Thu thập danh sách tài sản đính kèm
    const attachedAssets = (updateData.attachedAssetIds || []).map((id) => {
      const ast = this.projectService.masterAssets().find((a) => a.id === id);
      return {
        assetId: id,
        assetCode: ast?.code || '',
        assetName: ast?.name || '',
        condition: 'DAMAGED' as AssetCondition,
        lat: ast?.lat,
        lng: ast?.lng,
        address: ast?.address,
      };
    });

    const firstAsset = attachedAssets[0];

    this.issues.update((list) =>
      list.map((iss) => {
        if (iss.id === issueId) {
          targetCode = iss.code;
          return {
            ...iss,
            status: 'NEW' as IssueStatus, // Trở lại trạng thái Mới để Quản lý thẩm tra lại
            title: updateData.title || iss.title,
            description:
              updateData.description !== undefined
                ? updateData.description
                : iss.description,
            photoBeforeUrl: updateData.photoUrl || iss.photoBeforeUrl,
            layerId:
              updateData.layerId || (category ? category.layerId : iss.layerId),
            categoryId: updateData.categoryId || iss.categoryId,
            categoryName: category ? category.name : iss.categoryName,
            attachedAssets:
              attachedAssets.length > 0 ? attachedAssets : iss.attachedAssets,
            assetId: firstAsset ? firstAsset.assetId : iss.assetId,
            assetCode: firstAsset ? firstAsset.assetCode : iss.assetCode,
            assetName: firstAsset ? firstAsset.assetName : iss.assetName,
            address: updateData.address || iss.address,
            routeName: updateData.routeName || iss.routeName,
            lat: updateData.lat || iss.lat,
            lng: updateData.lng || iss.lng,
            resubmittedAt: nowStr,
            resubmitNotes:
              resubmitNote ||
              'Đã cập nhật lại hình ảnh và vị trí hiện trường theo yêu cầu',
          };
        }
        return iss;
      }),
    );

    this.addLog({
      issueId,
      personnelName: 'Người tuần kiểm',
      action: 'REPORT_ISSUE',
      title: `[Hiện trường gửi lại] Cập nhật sự cố [${targetCode}]`,
      details: `Đã cập nhật lại sau khi bị từ chối. Ghi chú giải trình: ${resubmitNote || 'Hoàn tất cập nhật'}`,
      timestamp: nowStr,
      lat: updateData.lat || 10.7745,
      lng: updateData.lng || 106.7025,
      status: 'WARNING',
    });

    this.toast.success(
      'Đã gửi lại sự cố thành công!',
      `Sự cố [${targetCode}] đã được gửi lại về Bàn làm việc của Quản lý để thẩm tra.`,
    );
  }

  // Tạo mới sự cố tuân thủ 3 nguyên tắc nghiệp vụ (1 loại vấn đề - nhiều tài sản cùng loại)
  createPatrolIssue(data: {
    title: string;
    description: string;
    layerId: LayerId;
    categoryId: string;
    attachedAssetIds: string[];
    photoUrl?: string;
    lat: number;
    lng: number;
    address: string;
    routeName: string;
    reportedByName: string;
    reportedById?: string;
    scheduleId?: string;
  }): PatrolIssue {
    const category = this.categories().find((c) => c.id === data.categoryId);
    const nowStr =
      new Date().toLocaleDateString('vi-VN') +
      ' ' +
      new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });

    // Thu thập danh sách nhiều tài sản cùng loại
    const attachedAssets = (data.attachedAssetIds || []).map((id) => {
      const ast = this.projectService.masterAssets().find((a) => a.id === id);
      return {
        assetId: id,
        assetCode: ast?.code || '',
        assetName: ast?.name || '',
        condition: 'DAMAGED' as AssetCondition,
        lat: ast?.lat,
        lng: ast?.lng,
        address: ast?.address,
      };
    });

    const firstAsset = attachedAssets[0];

    const newIssue: PatrolIssue = {
      id: 'iss-' + (this.issues().length + 10),
      code: 'SC-2026-' + (100 + this.issues().length + 1),
      title: data.title,
      reportedAt: nowStr,
      reportedBy: {
        id: data.reportedById || 'ns-1',
        name: data.reportedByName || 'Trần Đình Nam (Tuần tra viên)',
        phone: '0903.112.456',
      },
      scheduleId: data.scheduleId,
      categoryId: data.categoryId,
      categoryName: category?.name || 'Sự cố hạ tầng kỹ thuật',
      layerId: data.layerId,
      priority: category?.defaultPriority || 'HIGH',
      status: 'NEW',
      description: data.description,
      photoBeforeUrl:
        data.photoUrl ||
        'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=700&q=80',
      lat: data.lat || firstAsset?.lat || 10.7745,
      lng: data.lng || firstAsset?.lng || 106.703,
      address: data.address || firstAsset?.address || 'Hiện trường tuần kiểm',
      routeName: data.routeName || 'Tuyến Nguyễn Huệ',
      assetId: firstAsset?.assetId,
      assetCode: firstAsset?.assetCode,
      assetName: firstAsset?.assetName,
      assetCondition: 'DAMAGED',
      attachedAssets: attachedAssets,
    };

    this.issues.update((list) => [newIssue, ...list]);
    this.selectedIssueId.set(newIssue.id);

    this.addLog({
      issueId: newIssue.id,
      personnelName: newIssue.reportedBy.name,
      action: 'REPORT_ISSUE',
      title: `[Hiện trường] Ghi nhận sự cố mới: ${newIssue.title}`,
      details: `Gắn ${attachedAssets.length} tài sản lớp ${data.layerId}. Địa điểm: ${newIssue.address}`,
      timestamp: nowStr,
      lat: newIssue.lat,
      lng: newIssue.lng,
      status: 'WARNING',
    });

    this.toast.success(
      `Ghi nhận thành công sự cố [${newIssue.code}]!`,
      `Đã đính kèm ${attachedAssets.length} tài sản lớp ${category?.name || data.layerId}`,
    );
    return newIssue;
  }

  // Luồng Chuyển Thành Dự Án Duy Tu (Trường hợp 2 - Kết nối trực tiếp Phân hệ Duy tu)
  convertIssuesToMaintenanceProject(
    issueIds: string[],
    projectName: string,
    projectType: 'Đột xuất' | 'Định kỳ' | 'Khẩn cấp' | 'Sửa chữa thường xuyên',
    budget: number,
    contractor: string,
    routeName: string,
  ): { projectId: string; projectCode: string } {
    const issuesToConvert = this.issues().filter((i) =>
      issueIds.includes(i.id),
    );
    if (issuesToConvert.length === 0) {
      throw new Error('Chưa chọn sự cố nào để chuyển');
    }

    // 1. Thu thập danh sách Asset IDs từ các sự cố đã chọn (bao gồm tất cả attachedAssets)
    const assetIds: string[] = [];
    issuesToConvert.forEach((iss) => {
      if (iss.assetId && !assetIds.includes(iss.assetId)) {
        assetIds.push(iss.assetId);
      }
      if (iss.attachedAssets) {
        iss.attachedAssets.forEach((a) => {
          if (a.assetId && !assetIds.includes(a.assetId)) {
            assetIds.push(a.assetId);
          }
        });
      }
    });

    // 2. Tạo một Dự Án Duy Tu mới trong ProjectService
    const createdProject = this.projectService.createProject({
      name: projectName,
      type: projectType,
      status: 'Khởi tạo',
      budget: budget || 850000000,
      contractor: contractor || 'Công ty CP Công trình Hạ tầng Đô thị',
      managementUnit: 'Ban QLDA Hạ tầng Kỹ thuật số 1',
      description: `Dự án duy tu được khởi tạo tự động từ ${issuesToConvert.length} sự cố tuần kiểm phát sinh tại ${routeName}. Bao gồm các sự cố: ${issuesToConvert.map((i) => i.code).join(', ')}.`,
      routeName: routeName || issuesToConvert[0].routeName,
      totalAssetsCount: assetIds.length,
      completedAssetsCount: 0,
      progressPercent: 0,
    });

    // 3. Map toàn bộ Asset_ID liên quan vào Tab Tài Sản của Dự án mới
    if (assetIds.length > 0) {
      this.projectService.mapAssetsToProject(createdProject.id, assetIds);
    }

    // 4. Cập nhật trạng thái các sự cố thành MOVED_TO_PROJECT và lưu liên kết
    this.issues.update((list) =>
      list.map((iss) => {
        if (issueIds.includes(iss.id)) {
          return {
            ...iss,
            status: 'MOVED_TO_PROJECT',
            projectLinkDetails: {
              projectId: createdProject.id,
              projectCode: createdProject.code,
              projectName: createdProject.name,
              linkedAt: new Date().toLocaleString('vi-VN'),
              linkedBy: 'Cán bộ Điều Hành QLDA',
            },
          };
        }
        return iss;
      }),
    );

    // 5. Thêm nhật ký
    this.addLog({
      personnelName: 'Cán bộ Điều Hành QLDA',
      action: 'START_ROUTE',
      title: `Gom ${issuesToConvert.length} sự cố -> Khởi tạo Dự Án [${createdProject.code}]`,
      details: `Đã kết nối dữ liệu sang Phân hệ Dự Án Duy Tu. Map ${assetIds.length} tài sản (Asset_ID) sang tab Tài sản của dự án.`,
      timestamp: new Date().toLocaleString('vi-VN'),
      lat: issuesToConvert[0]?.lat || 10.7745,
      lng: issuesToConvert[0]?.lng || 106.7025,
      status: 'SUCCESS',
    });

    this.toast.success(
      `Đã chuyển thành công sang Dự án [${createdProject.code}]!`,
      `Đã map ${assetIds.length} tài sản lỗi sang tab Tài sản của dự án mới.`,
    );

    return { projectId: createdProject.id, projectCode: createdProject.code };
  }

  // Mô phỏng nhân viên gửi sự cố từ App Mobile ngoài thực địa
  simulateReportFromMobile(data: {
    title: string;
    description: string;
    categoryId: string;
    assetId?: string;
    photoUrl?: string;
    lat: number;
    lng: number;
    address: string;
    routeName: string;
    reportedByName: string;
    assetCondition?: AssetCondition;
  }): PatrolIssue {
    const category = this.categories().find((c) => c.id === data.categoryId);
    const asset = data.assetId
      ? this.projectService.masterAssets().find((a) => a.id === data.assetId)
      : undefined;

    const newIssue: PatrolIssue = {
      id: 'iss-' + (this.issues().length + 10),
      code: 'SC-2026-' + (100 + this.issues().length + 1),
      title: data.title,
      reportedAt:
        new Date().toLocaleDateString('vi-VN') +
        ' ' +
        new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      reportedBy: {
        id: 'ns-mobile',
        name: data.reportedByName || 'Nhân viên thực địa Mobile',
        phone: '0909.888.777',
      },
      categoryId: data.categoryId,
      categoryName: category?.name || 'Sự cố hạ tầng',
      layerId: category?.layerId || 'LIGHTING',
      priority: category?.defaultPriority || 'HIGH',
      status: 'NEW',
      description: data.description,
      photoBeforeUrl:
        data.photoUrl ||
        'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=700&q=80',
      lat: data.lat || 10.7745,
      lng: data.lng || 106.703,
      address: data.address || 'Hiện trường trung tâm',
      routeName: data.routeName || 'Tuyến trung tâm',
      assetId: data.assetId,
      assetCode: asset?.code,
      assetName: asset?.name,
      assetCondition: data.assetCondition || 'DAMAGED',
    };

    this.issues.update((list) => [newIssue, ...list]);
    this.selectedIssueId.set(newIssue.id);

    this.addLog({
      issueId: newIssue.id,
      personnelName: newIssue.reportedBy.name,
      action: 'REPORT_ISSUE',
      title: `[Mobile GPS] Báo cáo sự cố mới: ${newIssue.title}`,
      details: `Tọa độ: ${newIssue.lat.toFixed(5)}, ${newIssue.lng.toFixed(5)}. Địa chỉ: ${newIssue.address}`,
      timestamp: newIssue.reportedAt,
      lat: newIssue.lat,
      lng: newIssue.lng,
      status: 'WARNING',
    });

    this.toast.warning(
      'Sự cố mới vừa gửi về từ App Mobile!',
      `Mã sự cố: [${newIssue.code}] - ${newIssue.title}`,
    );
    return newIssue;
  }

  // --- CRUD DANH MỤC VẤN ĐỀ (UC 2) ---
  addCategory(category: Partial<IssueCategory>): IssueCategory {
    const id = 'cat-' + (this.categories().length + 1);
    const code =
      'SC-' +
      (category.layerId === 'LIGHTING'
        ? 'CS'
        : category.layerId === 'GREENERY'
          ? 'CX'
          : category.layerId === 'DRAINAGE'
            ? 'TN'
            : 'MD') +
      '-0' +
      (this.categories().length + 1);
    const newCat: IssueCategory = {
      id,
      code,
      name: category.name || 'Loại sự cố mới',
      layerId: category.layerId || 'LIGHTING',
      defaultPriority: category.defaultPriority || 'MEDIUM',
      estimatedFixHours: category.estimatedFixHours || 4,
      description: category.description || '',
      isActive: true,
      standardCostEstimate: category.standardCostEstimate || 3000000,
    };

    this.categories.update((list) => [newCat, ...list]);
    this.toast.success(
      'Thêm loại vấn đề thành công!',
      `Mã danh mục: ${newCat.code}`,
    );
    return newCat;
  }

  updateCategory(id: string, updates: Partial<IssueCategory>) {
    this.categories.update((list) =>
      list.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
    this.toast.success('Cập nhật loại vấn đề thành công!');
  }

  deleteCategory(id: string) {
    this.categories.update((list) => list.filter((c) => c.id !== id));
    this.toast.info('Thông báo', 'Đã xóa loại vấn đề');
  }

  // --- CRUD CỤM NHÂN SỰ & QUYỀN (UC 1) ---
  addTeam(team: Partial<PatrolTeam>): PatrolTeam {
    const id = 'team-' + (this.teams().length + 1);
    const code = 'DOI-TK-0' + (this.teams().length + 1);
    const newTeam: PatrolTeam = {
      id,
      code,
      name: team.name || 'Đội tuần kiểm mới',
      leaderId: team.leaderId || 'ns-1',
      leaderName: team.leaderName || 'Trần Đình Nam',
      assignedArea: team.assignedArea || 'Khu vực trung tâm',
      permissionGroup: team.permissionGroup || 'NHÂN VIÊN HIỆN TRƯỜNG',
      description: team.description || '',
      memberCount: team.memberCount || 5,
    };

    this.teams.update((list) => [...list, newTeam]);
    this.toast.success('Thêm cụm nhân sự thành công!');
    return newTeam;
  }

  updateTeam(id: string, updates: Partial<PatrolTeam>) {
    this.teams.update((list) =>
      list.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
    this.toast.success('Cập nhật cụm nhân sự thành công!');
  }

  deleteTeam(id: string) {
    this.teams.update((list) => list.filter((t) => t.id !== id));
    this.toast.info('Thông báo', 'Đã xóa cụm nhân sự');
  }

  // --- QUẢN LÝ NHÂN VIÊN & ĐIỂM DANH (UC 5) ---
  addPersonnel(personnel: Partial<PatrolPersonnel>): PatrolPersonnel {
    const id = 'ns-' + (this.personnel().length + 1);
    const code = 'NS-00' + (this.personnel().length + 1);
    const newP: PatrolPersonnel = {
      id,
      code,
      name: personnel.name || 'Nhân viên mới',
      phone: personnel.phone || '0901.234.567',
      role: personnel.role || 'INSPECTOR',
      teamId: personnel.teamId || this.teams()[0]?.id,
      teamName: personnel.teamName || this.teams()[0]?.name,
      assignedRoutes: personnel.assignedRoutes || ['Tuyến trung tâm'],
      isActive: true,
      todayAttendance: 'NOT_CHECKED_IN',
      isValidAttendance: false,
    };

    this.personnel.update((list) => [...list, newP]);
    this.toast.success('Thêm nhân sự tuần kiểm thành công!');
    return newP;
  }

  updatePersonnel(id: string, updates: Partial<PatrolPersonnel>) {
    this.personnel.update((list) =>
      list.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
    this.toast.success('Cập nhật thông tin nhân sự thành công!');
  }

  evaluateAttendance(personnelId: string, isValid: boolean) {
    this.personnel.update((list) =>
      list.map((p) =>
        p.id === personnelId ? { ...p, isValidAttendance: isValid } : p,
      ),
    );
    this.toast.success(
      `Đã đánh giá điểm danh: ${isValid ? 'HỢP LỆ' : 'KHÔNG HỢP LỆ'}`,
    );
  }

  // --- LẬP LỊCH & ĐIỀU PHỐI (UC 3, UC 7, UC 8) ---
  addSchedule(schedule: Partial<PatrolSchedule>): PatrolSchedule {
    const id = 'sch-' + (this.schedules().length + 1);
    const team =
      this.teams().find((t) => t.id === schedule.teamId) || this.teams()[0];
    const newSch: PatrolSchedule = {
      id,
      date: schedule.date || new Date().toISOString().split('T')[0],
      shift: schedule.shift || 'SANG',
      routeName: schedule.routeName || 'Tuyến trung tâm',
      startPointName: schedule.startPointName || 'Điểm xuất phát',
      endPointName: schedule.endPointName || 'Điểm kết thúc',
      routeCoordinates: schedule.routeCoordinates || [
        [10.7766, 106.7018],
        [10.7745, 106.7035],
        [10.7725, 106.7065],
      ],
      targetAssetIds: schedule.targetAssetIds || [],
      teamId: team.id,
      teamName: team.name,
      assignedPersonnel: schedule.assignedPersonnel || [
        {
          id: 'ns-1',
          name: 'Trần Đình Nam',
          phone: '0903.112.456',
          checkedIn: true,
        },
      ],
      status: 'PLANNED',
      checkpointsTotal: schedule.checkpointsTotal || 5,
      checkpointsInspected: 0,
      notes: schedule.notes || '',
    };

    this.schedules.update((list) => [newSch, ...list]);
    this.selectedScheduleId.set(newSch.id);
    this.toast.success(
      'Tạo lịch tuần kiểm thành công!',
      `Ca trực ngày ${newSch.date} (${newSch.shift})`,
    );
    return newSch;
  }

  updateScheduleDate(scheduleId: string, newDate: string) {
    this.schedules.update((list) =>
      list.map((s) => (s.id === scheduleId ? { ...s, date: newDate } : s)),
    );
    this.toast.success(`Đã thay đổi ngày ca tuần kiểm sang: ${newDate}`);
  }

  deleteSchedule(scheduleId: string) {
    this.schedules.update((list) => list.filter((s) => s.id !== scheduleId));
    this.toast.info('Thông báo', 'Đã hủy bỏ ca tuần kiểm');
  }

  checkInSchedulePersonnel(scheduleId: string, personnelId: string) {
    this.schedules.update((list) =>
      list.map((s) => {
        if (s.id === scheduleId) {
          const updatedPersonnel = s.assignedPersonnel.map((p) =>
            p.id === personnelId ? { ...p, checkedIn: true } : p,
          );
          return { ...s, assignedPersonnel: updatedPersonnel };
        }
        return s;
      }),
    );
    this.toast.success('Điểm danh nhân viên thành công!');
  }

  updateScheduleStatus(
    scheduleId: string,
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
  ) {
    this.schedules.update((list) =>
      list.map((s) => (s.id === scheduleId ? { ...s, status } : s)),
    );
    const label =
      status === 'IN_PROGRESS'
        ? 'Bắt đầu ca tuần tra'
        : status === 'COMPLETED'
          ? 'Đã hoàn thành ca tuần tra'
          : status;
    this.toast.success(`Cập nhật trạng thái ca: ${label}`);
  }

  // --- HỖ TRỢ CỔNG NHÂN VIÊN HIỆN TRƯỜNG (WEB WORKER PORTAL - UC 8, UC 10) ---
  workerSelfCheckIn(personnelId: string, scheduleId: string, location: string) {
    const timeStr =
      new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }) +
      ' ' +
      new Date().toLocaleDateString('vi-VN');

    // Cập nhật attendance của nhân sự
    this.personnel.update((list) =>
      list.map((p) => {
        if (p.id === personnelId) {
          return {
            ...p,
            todayAttendance: 'CHECKED_IN',
            checkInTime: timeStr,
            checkInLocation: location,
            isValidAttendance: true,
          };
        }
        return p;
      }),
    );

    // Cập nhật vào ca trực
    if (scheduleId) {
      this.checkInSchedulePersonnel(scheduleId, personnelId);
    }

    const worker = this.personnel().find((p) => p.id === personnelId);
    this.addLog({
      scheduleId,
      personnelName: worker?.name || 'Nhân viên tuần kiểm',
      action: 'CHECK_IN',
      title: `Nhân viên tự điểm danh vào ca trực qua Web Portal`,
      details: `Vị trí check-in: ${location}. Thời gian: ${timeStr}`,
      timestamp: timeStr,
      lat: 10.7762,
      lng: 106.7022,
      status: 'SUCCESS',
    });

    this.toast.success(
      'Điểm danh vào ca thành công!',
      `Nhân viên: ${worker?.name}`,
    );
  }

  workerAcceptTask(issueId: string, workerName: string) {
    this.issues.update((list) =>
      list.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            status: 'QUICK_FIXING',
            quickFixDetails: iss.quickFixDetails
              ? {
                  ...iss.quickFixDetails,
                  startedAt: new Date().toLocaleString('vi-VN'),
                  resolutionNote:
                    (iss.quickFixDetails.resolutionNote || '') +
                    ` (Thợ ${workerName} đã tiếp nhận xử lý lúc ${new Date().toLocaleTimeString('vi-VN')})`,
                }
              : {
                  contractorOrTeam: 'Đội Khắc phục hiện trường',
                  assignedWorker: workerName,
                  estimatedCost: 1500000,
                  deadline: 'Trong ngày',
                  startedAt: new Date().toLocaleString('vi-VN'),
                  resolutionNote: `Thợ ${workerName} đã tiếp nhận xử lý tại hiện trường`,
                },
          };
        }
        return iss;
      }),
    );

    const target = this.issues().find((i) => i.id === issueId);
    this.addLog({
      issueId,
      personnelName: workerName,
      action: 'QUICK_FIX',
      title: `Thợ tiếp nhận xử lý sự cố [${target?.code}]`,
      details: `${workerName} đã tiếp nhận nhiệm vụ khắc phục tại hiện trường ${target?.address}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      lat: target?.lat || 10.7745,
      lng: target?.lng || 106.7025,
      status: 'INFO',
    });

    this.toast.success(
      'Đã tiếp nhận nhiệm vụ!',
      `Sự cố [${target?.code}] chuyển sang trạng thái Đang xử lý`,
    );
  }

  workerReportCompletion(
    issueId: string,
    workerName: string,
    afterPhotoUrl: string,
    note: string,
    finalCondition: AssetCondition = 'GOOD',
  ) {
    this.issues.update((list) =>
      list.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            status: 'RESOLVED',
            photoAfterUrl:
              afterPhotoUrl ||
              'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=700&q=80',
            assetCondition: finalCondition,
            quickFixDetails: iss.quickFixDetails
              ? {
                  ...iss.quickFixDetails,
                  completedAt: new Date().toLocaleString('vi-VN'),
                  resolutionNote: note,
                  finalCondition,
                }
              : undefined,
          };
        }
        return iss;
      }),
    );

    const target = this.issues().find((i) => i.id === issueId);
    this.addLog({
      issueId,
      personnelName: workerName,
      action: 'QUICK_FIX',
      title: `Thợ nộp báo cáo hoàn thành sự cố [${target?.code}]`,
      details: `Đã sửa chữa xong và tải ảnh nghiệm thu: ${note}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      lat: target?.lat || 10.7745,
      lng: target?.lng || 106.7025,
      status: 'SUCCESS',
    });

    this.toast.success(
      'Báo cáo hoàn thành thành công!',
      `Sự cố [${target?.code}] đã được khắc phục hoàn tất.`,
    );
  }

  // --- LOGS (UC 9) ---
  addLog(log: Omit<PatrolLog, 'id'>) {
    const id = 'log-' + (this.logs().length + 1);
    const newLog: PatrolLog = { id, ...log };
    this.logs.update((list) => [newLog, ...list]);
  }

  // Xuất file CSV/Excel cho demo (UC 4, UC 5, UC 6, UC 9, UC 10)
  exportToCsv(
    filename: string,
    headers: string[],
    rows: (string | number)[][],
  ) {
    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((row) =>
          row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','),
        ),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${filename}_${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success(
      'Xuất dữ liệu Excel thành công!',
      `File: ${filename}.csv đã được tải về.`,
    );
  }
}
