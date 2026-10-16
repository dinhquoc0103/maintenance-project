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
  PatrolInspectionRecord,
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
      currentShift: 'SANG',
      currentRouteName: 'Tuyến Phố đi bộ Nguyễn Huệ',
      currentScheduleId: 'sch-1',
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '06:45 13/10/2026',
      checkInLocation: 'Công viên Tượng đài Bác Hồ (GPS: 10.7762, 106.7022)',
      isGpsValid: true,
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
      currentShift: 'SANG',
      currentRouteName: 'Tuyến Phố đi bộ Nguyễn Huệ',
      currentScheduleId: 'sch-1',
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '06:55 13/10/2026',
      checkInLocation: 'Đầu đường Nguyễn Huệ - Lê Thánh Tôn',
      isGpsValid: true,
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
      currentShift: 'CHIEU',
      currentRouteName: 'Tuyến Tôn Đức Thắng - Ven sông Sài Gòn',
      currentScheduleId: 'sch-2',
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '07:10 13/10/2026',
      checkInLocation: 'Ga tàu thủy Bạch Đằng (GPS: 10.7743, 106.7071)',
      isGpsValid: true,
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
      currentShift: 'CHIEU',
      currentRouteName: 'Tuyến Tôn Đức Thắng - Ven sông Sài Gòn',
      currentScheduleId: 'sch-2',
      isActive: true,
      todayAttendance: 'LATE',
      checkInTime: '07:42 13/10/2026',
      checkInLocation: 'Công viên Cột cờ Thủ Ngữ',
      isGpsValid: false,
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
      currentShift: 'TOI',
      currentRouteName: 'Tuyến Trục Nam Kỳ Khởi Nghĩa - Hàm Nghi',
      currentScheduleId: 'sch-3',
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
      currentShift: 'TOI',
      currentRouteName: 'Tuyến Trục Nam Kỳ Khởi Nghĩa - Hàm Nghi',
      currentScheduleId: 'sch-3',
      isActive: true,
      todayAttendance: 'NOT_CHECKED_IN',
      isValidAttendance: false,
    },
    // Đội 1 (Đủ 6 nhân sự)
    {
      id: 'ns-7',
      code: 'NS-007',
      name: 'Hoàng Gia Bảo',
      phone: '0912.334.889',
      role: 'INSPECTOR',
      teamId: 'team-1',
      teamName: 'Đội Tuần kiểm Trung tâm Quận 1',
      assignedRoutes: ['Tuyến Phố đi bộ Nguyễn Huệ'],
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '06:50 13/10/2026',
      checkInLocation: 'Công viên Tượng đài Bác Hồ',
      isValidAttendance: true,
    },
    {
      id: 'ns-8',
      code: 'NS-008',
      name: 'Bùi Thị Thu Trang',
      phone: '0934.551.223',
      role: 'INSPECTOR',
      teamId: 'team-1',
      teamName: 'Đội Tuần kiểm Trung tâm Quận 1',
      assignedRoutes: ['Tuyến Lê Lợi - Nhà Hát'],
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '07:05 13/10/2026',
      checkInLocation: 'Ga ngầm Metro Nhà Hát',
      isValidAttendance: true,
    },
    {
      id: 'ns-9',
      code: 'NS-009',
      name: 'Đỗ Tuấn Kiệt',
      phone: '0988.112.990',
      role: 'INSPECTOR',
      teamId: 'team-1',
      teamName: 'Đội Tuần kiểm Trung tâm Quận 1',
      assignedRoutes: ['Tuyến Nguyễn Huệ - Hải Triều'],
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '06:40 13/10/2026',
      checkInLocation: 'Tòa nhà Bitexco - Hải Triều',
      isValidAttendance: true,
    },
    {
      id: 'ns-10',
      code: 'NS-010',
      name: 'Phan Hoàng Anh',
      phone: '0977.443.118',
      role: 'SUPERVISOR',
      teamId: 'team-1',
      teamName: 'Đội Tuần kiểm Trung tâm Quận 1',
      assignedRoutes: ['Tuyến Nguyễn Huệ', 'Tuyến Lê Lợi'],
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '06:30 13/10/2026',
      checkInLocation: 'UBND TP (Lê Thánh Tôn)',
      isValidAttendance: true,
    },
    // Đội 2 (Đủ 5 nhân sự)
    {
      id: 'ns-11',
      code: 'NS-011',
      name: 'Trương Minh Cường',
      phone: '0907.889.001',
      role: 'INSPECTOR',
      teamId: 'team-2',
      teamName: 'Đội Tuần kiểm Hạ tầng Ven Sông',
      assignedRoutes: ['Tuyến Bến Bạch Đằng - Cầu Ba Son'],
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '07:15 13/10/2026',
      checkInLocation: 'Công viên Bến Bạch Đằng',
      isValidAttendance: true,
    },
    {
      id: 'ns-12',
      code: 'NS-012',
      name: 'Nguyễn Đức Trọng',
      phone: '0919.223.447',
      role: 'INSPECTOR',
      teamId: 'team-2',
      teamName: 'Đội Tuần kiểm Hạ tầng Ven Sông',
      assignedRoutes: ['Tuyến Tôn Đức Thắng - Cầu Khánh Hội'],
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '07:00 13/10/2026',
      checkInLocation: 'Cầu Khánh Hội',
      isValidAttendance: true,
    },
    {
      id: 'ns-13',
      code: 'NS-013',
      name: 'Võ Ngọc Bích',
      phone: '0945.667.129',
      role: 'SUPERVISOR',
      teamId: 'team-2',
      teamName: 'Đội Tuần kiểm Hạ tầng Ven Sông',
      assignedRoutes: ['Dọc tuyến Tôn Đức Thắng'],
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '06:55 13/10/2026',
      checkInLocation: 'Ga tàu thủy Bạch Đằng',
      isValidAttendance: true,
    },
    // Đội 3 (Đủ 8 nhân sự)
    {
      id: 'ns-14',
      code: 'NS-014',
      name: 'Lương Văn Thắng',
      phone: '0933.221.789',
      role: 'INSPECTOR',
      teamId: 'team-3',
      teamName: 'Tổ Phản ứng nhanh Thoát nước & Giao thông Đô thị',
      assignedRoutes: ['Trục Hàm Nghi - Pasteur'],
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '06:45 13/10/2026',
      checkInLocation: 'Ngã tư Hàm Nghi - Pasteur',
      isValidAttendance: true,
    },
    {
      id: 'ns-15',
      code: 'NS-015',
      name: 'Chu Đình Dũng',
      phone: '0981.334.556',
      role: 'INSPECTOR',
      teamId: 'team-3',
      teamName: 'Tổ Phản ứng nhanh Thoát nước & Giao thông Đô thị',
      assignedRoutes: ['Trục Nam Kỳ Khởi Nghĩa'],
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '06:40 13/10/2026',
      checkInLocation: 'Ngã tư Lê Lợi - Nam Kỳ Khởi Nghĩa',
      isValidAttendance: true,
    },
    {
      id: 'ns-16',
      code: 'NS-016',
      name: 'Nguyễn Trọng Hưng',
      phone: '0902.998.112',
      role: 'INSPECTOR',
      teamId: 'team-3',
      teamName: 'Tổ Phản ứng nhanh Thoát nước & Giao thông Đô thị',
      assignedRoutes: ['Chợ Bến Thành - Lê Lai'],
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '06:35 13/10/2026',
      checkInLocation: 'Vòng xoay Chợ Bến Thành',
      isValidAttendance: true,
    },
    {
      id: 'ns-17',
      code: 'NS-017',
      name: 'Đinh Thế Hải',
      phone: '0978.114.773',
      role: 'INSPECTOR',
      teamId: 'team-3',
      teamName: 'Tổ Phản ứng nhanh Thoát nước & Giao thông Đô thị',
      assignedRoutes: ['Tuyến Pasteur'],
      isActive: true,
      todayAttendance: 'LATE',
      checkInTime: '07:35 13/10/2026',
      checkInLocation: 'Giao lộ Pasteur - Hàm Nghi',
      isGpsValid: false,
      isValidAttendance: false,
    },
    {
      id: 'ns-18',
      code: 'NS-018',
      name: 'Trần Bảo Phúc',
      phone: '0938.441.902',
      role: 'INSPECTOR',
      teamId: 'team-3',
      teamName: 'Tổ Phản ứng nhanh Thoát nước & Giao thông Đô thị',
      assignedRoutes: ['Hệ thống van ngăn triều và hố ga'],
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '06:50 13/10/2026',
      checkInLocation: 'Cửa xả Hàm Nghi',
      isValidAttendance: true,
    },
    {
      id: 'ns-19',
      code: 'NS-019',
      name: 'Ngô Phương Nam',
      phone: '0913.662.884',
      role: 'TEAM_LEADER',
      teamId: 'team-3',
      teamName: 'Tổ Phản ứng nhanh Thoát nước & Giao thông Đô thị',
      assignedRoutes: ['Trục Nam Kỳ Khởi Nghĩa, Hàm Nghi, Pasteur'],
      isActive: true,
      todayAttendance: 'CHECKED_IN',
      checkInTime: '06:25 13/10/2026',
      checkInLocation: 'Ngã tư Nam Kỳ Khởi Nghĩa - Lê Lợi',
      isValidAttendance: true,
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
          checkInTime: '06:45 13/10/2026',
          checkInLocation: 'Công viên Tượng đài Bác Hồ (GPS: 10.7762, 106.7022)',
          isValidAttendance: true,
        },
        {
          id: 'ns-2',
          name: 'Nguyễn Văn Minh',
          phone: '0918.445.890',
          checkedIn: true,
          checkInTime: '06:55 13/10/2026',
          checkInLocation: 'Đầu đường Nguyễn Huệ - Lê Thánh Tôn',
          isValidAttendance: true,
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
          checkInTime: '13:05 13/10/2026',
          checkInLocation: 'Ga tàu thủy Bạch Đằng',
          isValidAttendance: true,
        },
        {
          id: 'ns-4',
          name: 'Phạm Thị Thúy Hằng',
          phone: '0982.551.342',
          checkedIn: true,
          checkInTime: '13:42 13/10/2026',
          checkInLocation: 'Bến Nhà Rồng - Quận 4 (Lệch trạm 1.2km)',
          isValidAttendance: false,
          invalidReason:
            'Tọa độ GPS điểm danh lệch 1.2km so với trạm xuất phát Bến Bạch Đằng và vào ca trễ 42 phút. Cần đối soát giải trình.',
        },
        {
          id: 'ns-1',
          name: 'Trần Đình Nam',
          phone: '0903.112.456',
          checkedIn: true,
          checkInTime: '13:45 13/10/2026',
          checkInLocation: 'Bến Nhà Rồng (Lệch trạm xuất phát 1.2km)',
          isValidAttendance: false,
          invalidReason:
            'Tọa độ GPS điểm danh lệch 1.2km so với trạm xuất phát Bến Bạch Đằng & vào ca trễ 45 phút. Cần đối soát giải trình.',
        },
      ],
      status: 'IN_PROGRESS',
      checkpointsTotal: 5,
      checkpointsInspected: 1,
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
          checkInTime: '18:02 13/10/2026',
          checkInLocation: 'Ngã tư Lê Lợi - Nam Kỳ Khởi Nghĩa',
          isValidAttendance: undefined,
        },
        {
          id: 'ns-1',
          name: 'Trần Đình Nam',
          phone: '0903.112.456',
          checkedIn: true,
          checkInTime: '18:05 13/10/2026',
          checkInLocation: 'Giao lộ Lê Lợi - Nam Kỳ Khởi Nghĩa',
          isValidAttendance: undefined,
        },
        {
          id: 'ns-6',
          name: 'Đặng Thanh Tùng',
          phone: '0979.663.210',
          checkedIn: false,
        },
      ],
      status: 'IN_PROGRESS',
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

  // --- 7. SỔ NHẬT KÝ KẾT QUẢ TUẦN KIỂM (UC 1 -> UC 6) ---
  readonly inspectionRecords = signal<PatrolInspectionRecord[]>([
    {
      id: 'rec-1',
      code: 'NK-2026-088',
      scheduleId: 'sch-1',
      date: '16/10/2026',
      shift: 'SANG',
      routeName: 'Đại lộ Võ Văn Kiệt (Km0+000 -> Km8+500)',
      teamId: 'team-1',
      teamName: 'Đội Tuần kiểm Trung tâm Quận 1',
      leadInspector: 'KS. Trần Đình Nam',
      members: ['KS. Trần Đình Nam', 'KTV. Nguyễn Văn Minh', 'Lái xe Lê Quốc Tuấn'],
      startTime: '06:45',
      endTime: '11:30',
      distanceKm: 12.5,
      gpsTrackStatus: 'VALID',
      totalAssetsChecked: 24,
      normalAssetsCount: 22,
      issueAssetsCount: 2,
      issuesFoundCount: 2,
      issueCodes: ['SC-2026-001', 'SC-2026-002'],
      issues: [
        {
          id: 'iss-1',
          code: 'SC-2026-001',
          title: 'Đèn âm sàn lối đi vỡ kính & chập cáp',
          priority: 'HIGH',
          status: 'QUICK_FIXING',
          layerName: 'Chiếu sáng',
          photoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
          location: 'Cột Km4+200, Dải phân cách giữa'
        },
        {
          id: 'iss-2',
          code: 'SC-2026-002',
          title: 'Cành xà cừ sà thấp có nguy cơ gãy đổ',
          priority: 'URGENT',
          status: 'NEW',
          layerName: 'Cây xanh',
          photoUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=600&q=80',
          location: 'Km3+400 lề trái hướng Q1 đi Q5'
        }
      ],
      checkedAssets: [
        {
          assetCode: 'CS-VK-040',
          assetName: 'Trụ đèn chiếu sáng nhánh phụ CS-040',
          condition: 'NORMAL',
          checkedAt: '07:15 16/10/2026',
          photoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
          notes: 'Đèn hoạt động ổn định, kính sạch sẽ'
        },
        {
          assetCode: 'CS-VK-042',
          assetName: 'Trụ đèn LED chiếu sáng 150W đôi',
          condition: 'DAMAGED',
          checkedAt: '07:35 16/10/2026',
          photoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
          notes: 'Phát hiện chập cáp âm sàn chân cột, đã lập phiếu sự cố SC-2026-001'
        },
        {
          assetCode: 'TN-VK-088',
          assetName: 'Hố ga thu nước mặt composite',
          condition: 'GOOD',
          checkedAt: '08:20 16/10/2026',
          photoUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80',
          notes: 'Lưới thu nước thông thoáng, không bị tắc rác'
        },
        {
          assetCode: 'CX-VK-018',
          assetName: 'Cây Xà Cừ cổ thụ loại 3',
          condition: 'NEEDS_REPLACEMENT',
          checkedAt: '09:05 16/10/2026',
          photoUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=600&q=80',
          notes: 'Nhánh cây lớn bị mục thân đe dọa giao thông, đã phát phiếu SC-2026-002'
        }
      ],
      status: 'VERIFIED',
      evaluationGrade: 'DAT_CO_SU_CO',
      operationalNotes: 'Đội tuần tra đúng tuyến và đúng giờ quy định. Đã ghi nhận 2 sự cố và phân công khắc phục ngay trong ca sáng.',
      verifiedBy: 'KS. Lê Hoàng Long (Cán bộ Vận hành Ban QLDA)',
      verifiedAt: '16/10/2026 13:45',
      weatherCondition: 'Trời nắng ráo, nhiệt độ 31°C, tầm nhìn trên 10km',
      vehiclePlate: '51A-892.44 (Xe bán tải tuần kiểm Ban QLDA)'
    },
    {
      id: 'rec-2',
      code: 'NK-2026-087',
      scheduleId: 'sch-2',
      date: '16/10/2026',
      shift: 'SANG',
      routeName: 'Tuyến Phố đi bộ Nguyễn Huệ & Lê Lợi',
      teamId: 'team-1',
      teamName: 'Đội Tuần kiểm Trung tâm Quận 1',
      leadInspector: 'KTV. Nguyễn Văn Minh',
      members: ['KTV. Nguyễn Văn Minh', 'Trần Đình Nam'],
      startTime: '07:00',
      endTime: '10:30',
      distanceKm: 4.8,
      gpsTrackStatus: 'VALID',
      totalAssetsChecked: 18,
      normalAssetsCount: 18,
      issueAssetsCount: 0,
      issuesFoundCount: 0,
      issueCodes: [],
      issues: [],
      checkedAssets: [
        {
          assetCode: 'CS-NH-001',
          assetName: 'Đèn trang trí cảnh quan Phố đi bộ',
          condition: 'GOOD',
          checkedAt: '07:25 16/10/2026',
          notes: 'Đèn sạch sẽ, hệ thống dây ngầm nguyên vẹn'
        },
        {
          assetCode: 'CX-NH-012',
          assetName: 'Cây lộc vừng bồn hoa trung tâm',
          condition: 'NORMAL',
          checkedAt: '08:10 16/10/2026',
          notes: 'Cây phát triển bình thường, đã tỉa lá úa'
        }
      ],
      status: 'VERIFIED',
      evaluationGrade: 'DAT_YEU_CAU',
      operationalNotes: 'Tuyến phố trung tâm bảo đảm mỹ quan đô thị, không phát sinh sự cố hạ tầng.',
      verifiedBy: 'KS. Lê Hoàng Long (Cán bộ Vận hành Ban QLDA)',
      verifiedAt: '16/10/2026 11:45',
      weatherCondition: 'Nắng nhẹ, gió nhẹ, lưu lượng người đi bộ vừa phải',
      vehiclePlate: 'Đi tuần bộ và xe đạp tuần tra đô thị'
    },
    {
      id: 'rec-3',
      code: 'NK-2026-085',
      scheduleId: 'sch-3',
      date: '15/10/2026',
      shift: 'CHIEU',
      routeName: 'Tuyến Bến Bạch Đằng & Tôn Đức Thắng',
      teamId: 'team-2',
      teamName: 'Đội Tuần kiểm Hạ tầng Ven Sông',
      leadInspector: 'Lê Hoàng Long',
      members: ['Lê Hoàng Long', 'Phạm Thị Thúy Hằng'],
      startTime: '13:30',
      endTime: '17:15',
      distanceKm: 7.2,
      gpsTrackStatus: 'VALID',
      totalAssetsChecked: 20,
      normalAssetsCount: 19,
      issueAssetsCount: 1,
      issuesFoundCount: 1,
      issueCodes: ['SC-2026-003'],
      issues: [
        {
          id: 'iss-3',
          code: 'SC-2026-003',
          title: 'Hố ga mất nắp đan gang khu vực bến tàu thủy',
          priority: 'URGENT',
          status: 'RESOLVED',
          layerName: 'Thoát nước',
          location: 'Bến ga tàu thủy Bạch Đằng'
        }
      ],
      status: 'VERIFIED',
      evaluationGrade: 'DAT_CO_SU_CO',
      operationalNotes: 'Phát hiện sự cố nắp hố ga mất đã đặt biển cảnh báo ngay lập tức và chuyển đội thoát nước thay nắp trong 45 phút.',
      verifiedBy: 'Vũ Quốc Toàn (Phó phòng Vận hành)',
      verifiedAt: '15/10/2026 18:00',
      weatherCondition: 'Mây rải rác, triều cường nhẹ ven sông',
      vehiclePlate: '51B-004.12'
    },
    {
      id: 'rec-4',
      code: 'NK-2026-082',
      scheduleId: 'sch-4',
      date: '15/10/2026',
      shift: 'SANG',
      routeName: 'Trục Nam Kỳ Khởi Nghĩa - Hàm Nghi - Pasteur',
      teamId: 'team-3',
      teamName: 'Tổ Phản ứng nhanh Thoát nước & Giao thông Đô thị',
      leadInspector: 'Vũ Quốc Toàn',
      members: ['Vũ Quốc Toàn', 'Đặng Thanh Tùng', 'Nguyễn Thế Vinh'],
      startTime: '06:30',
      endTime: '11:00',
      distanceKm: 9.6,
      gpsTrackStatus: 'VALID',
      totalAssetsChecked: 26,
      normalAssetsCount: 25,
      issueAssetsCount: 1,
      issuesFoundCount: 1,
      issueCodes: ['SC-2026-004'],
      issues: [
        {
          id: 'iss-4',
          code: 'SC-2026-004',
          title: 'Sụt lún vỉa hè lát đá ngã tư NKKN - Hàm Nghi',
          priority: 'HIGH',
          status: 'MOVED_TO_PROJECT',
          layerName: 'Giao thông',
          location: 'Ngã tư Nam Kỳ Khởi Nghĩa - Hàm Nghi'
        }
      ],
      status: 'VERIFIED',
      evaluationGrade: 'DAT_CO_SU_CO',
      operationalNotes: 'Vết lún sâu 12cm có nguy cơ lan rộng, đã lập biên bản và chuyển sang dự án sửa chữa mặt đường đợt tới.',
      verifiedBy: 'KS. Lê Hoàng Long (Cán bộ Vận hành Ban QLDA)',
      verifiedAt: '15/10/2026 14:15',
      weatherCondition: 'Nắng ráo, giao thông đông đúc giờ cao điểm',
      vehiclePlate: '51A-992.81'
    },
    {
      id: 'rec-5',
      code: 'NK-2026-079',
      scheduleId: 'sch-5',
      date: '14/10/2026',
      shift: 'TOI',
      routeName: 'Cầu Calmette - Bến Vân Đồn - Cầu Ông Lãnh',
      teamId: 'team-2',
      teamName: 'Đội Tuần kiểm Hạ tầng Ven Sông',
      leadInspector: 'Phạm Thị Thúy Hằng',
      members: ['Phạm Thị Thúy Hằng', 'Trần Văn Kiên'],
      startTime: '18:30',
      endTime: '22:00',
      distanceKm: 5.4,
      gpsTrackStatus: 'PARTIAL',
      totalAssetsChecked: 15,
      normalAssetsCount: 15,
      issueAssetsCount: 0,
      issuesFoundCount: 0,
      issueCodes: [],
      issues: [],
      status: 'NEEDS_REVIEW',
      evaluationGrade: 'CHUA_THAM_DINH',
      operationalNotes: 'Có gián đoạn tín hiệu GPS khoảng 25 phút gần dốc cầu Ông Lãnh. Cán bộ vận hành đang liên hệ kiểm tra nguyên nhân thiết bị.',
      weatherCondition: 'Có mưa rào nhỏ lúc 20h15',
      vehiclePlate: 'Xe máy tuần tra 59P1-123.45'
    },
    {
      id: 'rec-6',
      code: 'NK-2026-075',
      scheduleId: 'sch-6',
      date: '13/10/2026',
      shift: 'SANG',
      routeName: 'Tuyến Phố đi bộ Nguyễn Huệ',
      teamId: 'team-1',
      teamName: 'Đội Tuần kiểm Trung tâm Quận 1',
      leadInspector: 'Trần Đình Nam',
      members: ['Trần Đình Nam', 'Nguyễn Văn Minh'],
      startTime: '06:45',
      endTime: '10:45',
      distanceKm: 4.5,
      gpsTrackStatus: 'VALID',
      totalAssetsChecked: 18,
      normalAssetsCount: 18,
      issueAssetsCount: 0,
      issuesFoundCount: 0,
      issueCodes: [],
      issues: [],
      status: 'VERIFIED',
      evaluationGrade: 'DAT_YEU_CAU',
      operationalNotes: 'Hoàn thành tốt ca tuần kiểm, chuẩn bị phục vụ sự kiện cuối tuần.',
      verifiedBy: 'KS. Lê Hoàng Long (Cán bộ Vận hành Ban QLDA)',
      verifiedAt: '13/10/2026 11:30',
      weatherCondition: 'Trời nắng mát'
    }
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

  evaluateAttendance(personnelId: string, isValid: boolean, invalidReason?: string) {
    this.personnel.update((list) =>
      list.map((p) =>
        p.id === personnelId ? { ...p, isValidAttendance: isValid } : p,
      ),
    );
    // Đồng bộ trực tiếp sang các ca tuần kiểm liên quan
    this.schedules.update((list) =>
      list.map((s) => ({
        ...s,
        assignedPersonnel: s.assignedPersonnel.map((p) =>
          p.id === personnelId
            ? {
                ...p,
                isValidAttendance: isValid,
                invalidReason: isValid
                  ? undefined
                  : invalidReason ||
                    'Tọa độ GPS điểm danh lệch >500m so với trạm xuất phát hoặc vào ca trễ quy định - Cần đối soát',
              }
            : p,
        ),
      })),
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

    // TỰ ĐỘNG ĐỒNG BỘ SANG BẢNG QUẢN LÝ ĐIỂM DANH:
    // Tạo sẵn / cập nhật trạng thái chờ điểm danh cho từng nhân viên trong ca
    newSch.assignedPersonnel.forEach((assigned) => {
      const existing = this.personnel().find((p) => p.id === assigned.id);
      if (existing) {
        this.personnel.update((list) =>
          list.map((p) => {
            if (p.id === assigned.id) {
              const checkedIn = assigned.checkedIn;
              return {
                ...p,
                currentScheduleId: newSch.id,
                currentShift: newSch.shift,
                currentRouteName: newSch.routeName,
                assignedRoutes: p.assignedRoutes.includes(newSch.routeName)
                  ? p.assignedRoutes
                  : [...p.assignedRoutes, newSch.routeName],
                todayAttendance: checkedIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
                checkInTime: checkedIn ? p.checkInTime : undefined,
                checkInLocation: checkedIn ? p.checkInLocation : undefined,
                isValidAttendance: checkedIn ? p.isValidAttendance : false,
                checkInTimestamp: checkedIn ? (p.checkInTimestamp || Date.now()) : 0,
              };
            }
            return p;
          }),
        );
      } else {
        const newP: PatrolPersonnel = {
          id: assigned.id,
          code: 'NS-0' + (this.personnel().length + 1),
          name: assigned.name,
          phone: assigned.phone,
          role: 'INSPECTOR',
          teamId: newSch.teamId,
          teamName: newSch.teamName,
          assignedRoutes: [newSch.routeName],
          isActive: true,
          todayAttendance: assigned.checkedIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
          checkInTime: assigned.checkedIn ? new Date().toLocaleTimeString('vi-VN') : undefined,
          isValidAttendance: false,
          currentScheduleId: newSch.id,
          currentShift: newSch.shift,
          currentRouteName: newSch.routeName,
          checkInTimestamp: assigned.checkedIn ? Date.now() : 0,
        };
        this.personnel.update((list) => [...list, newP]);
      }
    });

    this.toast.success(
      'Tạo lịch tuần kiểm thành công!',
      `Đã phân công ${newSch.assignedPersonnel.length} nhân sự vào ca (${newSch.shift}). Dữ liệu đã tự động đồng bộ sang bảng Quản lý điểm danh.`,
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

  checkInSchedulePersonnel(scheduleId: string, personnelId: string, location?: string) {
    const timeStr =
      new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }) +
      ' ' +
      new Date().toLocaleDateString('vi-VN');
    const nowTimestamp = Date.now();

    const targetSchedule = this.schedules().find((s) => s.id === scheduleId);
    const checkLocation = location || targetSchedule?.startPointName || 'Hiện trường tuần kiểm';

    // 1. Cập nhật trong schedules
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

    // 2. Đồng bộ sang danh sách personnel (Live Attendance List) và nhảy lên đầu
    this.personnel.update((list) =>
      list.map((p) => {
        if (p.id === personnelId) {
          return {
            ...p,
            todayAttendance: 'CHECKED_IN',
            checkInTime: timeStr,
            checkInLocation: checkLocation,
            isValidAttendance: true,
            checkInTimestamp: nowTimestamp,
            currentScheduleId: scheduleId,
            currentShift: targetSchedule?.shift || p.currentShift,
            currentRouteName: targetSchedule?.routeName || p.currentRouteName,
          };
        }
        return p;
      }),
    );

    const worker = this.personnel().find((p) => p.id === personnelId);
    this.addLog({
      scheduleId,
      personnelName: worker?.name || 'Nhân viên tuần kiểm',
      action: 'CHECK_IN',
      title: `Điểm danh thành công: ${worker?.name}`,
      details: `Vị trí: ${checkLocation}. Tuyến: ${targetSchedule?.routeName || 'Tuyến tuần tra'}`,
      timestamp: timeStr,
      lat: 10.7745,
      lng: 106.7025,
      status: 'SUCCESS',
    });

    this.toast.success('Điểm danh nhân viên thành công!', `[${worker?.name || personnelId}] đã vào ca và chuyển lên đầu danh sách điểm danh.`);
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
    const nowTimestamp = Date.now();

    const targetSchedule = scheduleId
      ? this.schedules().find((s) => s.id === scheduleId)
      : undefined;

    // Cập nhật attendance của nhân sự (nhảy lên top)
    this.personnel.update((list) =>
      list.map((p) => {
        if (p.id === personnelId) {
          return {
            ...p,
            todayAttendance: 'CHECKED_IN',
            checkInTime: timeStr,
            checkInLocation: location,
            isValidAttendance: true,
            checkInTimestamp: nowTimestamp,
            currentScheduleId: scheduleId || p.currentScheduleId,
            currentShift: targetSchedule?.shift || p.currentShift,
            currentRouteName: targetSchedule?.routeName || p.currentRouteName,
          };
        }
        return p;
      }),
    );

    // Cập nhật vào ca trực
    if (scheduleId) {
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

  // --- THAO TÁC CẬP NHẬT KẾT QUẢ TUẦN KIỂM (UC 4) ---
  updateInspectionRecord(id: string, updates: Partial<PatrolInspectionRecord>) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    
    this.inspectionRecords.update((list) =>
      list.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              updatedAt: timeStr,
              verifiedAt: updates.status === 'VERIFIED' ? timeStr : item.verifiedAt,
              verifiedBy: updates.status === 'VERIFIED' ? (updates.verifiedBy || 'Cán bộ Vận hành Ban QLDA') : item.verifiedBy
            }
          : item
      )
    );
    this.toast.success(
      'Cập nhật thông tin thành công!',
      `Đã lưu ý kiến thẩm tra & cập nhật sổ nhật ký tuần kiểm.`
    );
  }

  // --- THAO TÁC XÓA KẾT QUẢ TUẦN KIỂM (UC 5) ---
  deleteInspectionRecord(id: string) {
    const item = this.inspectionRecords().find((r) => r.id === id);
    this.inspectionRecords.update((list) => list.filter((r) => r.id !== id));
    this.toast.success(
      'Xóa kết quả tuần kiểm thành công!',
      `Đã xóa bản ghi nhật ký [${item?.code || id}] khỏi hệ thống.`
    );
  }

  // --- XUẤT NHẬT KÝ TUẦN KIỂM (UC 6) ---
  exportInspectionRecordsToCsv(records: PatrolInspectionRecord[]) {
    const headers = [
      'Mã Sổ Nhật Ký',
      'Ngày Tuần Tra',
      'Ca Trực',
      'Tuyến Đường',
      'Đội Phụ Trách',
      'Trưởng Kíp',
      'Thời Gian Bắt Đầu',
      'Thời Gian Kết Thúc',
      'Quãng Đường (km)',
      'Tổng Tài Sản Đã Rà Soát',
      'Tài Sản Bình Thường',
      'Tài Sản Có Vấn Đề',
      'Số Sự Cố Phát Hiện',
      'Trạng Thái Thẩm Định',
      'Xếp Loại Đánh Giá',
      'Ý Kiến Thẩm Định Ban QLDA',
      'Người Thẩm Định',
      'Ngày Giờ Thẩm Định'
    ];

    const rows = records.map((r) => [
      r.code,
      r.date,
      r.shift === 'SANG' ? 'Ca Sáng' : r.shift === 'CHIEU' ? 'Ca Chiều' : 'Ca Tối',
      r.routeName,
      r.teamName,
      r.leadInspector,
      r.startTime,
      r.endTime,
      r.distanceKm,
      r.totalAssetsChecked,
      r.normalAssetsCount,
      r.issueAssetsCount,
      r.issuesFoundCount,
      r.status === 'VERIFIED' ? 'Đã thẩm định' : r.status === 'NEEDS_REVIEW' ? 'Chờ kiểm tra lại' : 'Hoàn thành',
      r.evaluationGrade === 'DAT_YEU_CAU' ? 'Đạt yêu cầu' : r.evaluationGrade === 'DAT_CO_SU_CO' ? 'Đạt (kèm sự cố)' : 'Chưa thẩm định',
      r.operationalNotes || '',
      r.verifiedBy || '',
      r.verifiedAt || ''
    ]);

    this.exportToCsv('So_Nhat_Ky_Tuan_Kiem_Ha_Tang', headers, rows);
  }
}
