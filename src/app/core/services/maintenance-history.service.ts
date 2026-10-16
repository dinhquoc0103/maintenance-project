import { Injectable, signal, computed } from '@angular/core';
import {
  MaintenanceHistoryItem,
  HistoryFilterCriteria,
} from '../models/maintenance-history.model';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceHistoryService {
  // Master historical maintenance dataset
  private readonly initialRecords: MaintenanceHistoryItem[] = [
    // 1. NHÀ THẦU: CS-VK-042 (Nghiệm thu theo đợt thanh toán)
    {
      id: 'hist-001',
      completedAt: '20/05/2025',
      periodLabel: 'Nghiệm thu Đợt 2 - Q2/2025',
      assetCode: 'CS-VK-042',
      assetName: 'Trụ đèn LED chiếu sáng 150W đôi',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng',
      taskContent: 'Thay thế bóng LED & chấn lưu xung áp 150W',
      locationDetail: 'Vị trí: Cột Km4+200, Dải phân cách giữa',
      routeName: 'Đại lộ Võ Văn Kiệt',
      executorType: 'CONTRACTOR',
      projectOrIncidentCode: 'DT-2025-VVK-02',
      projectOrIncidentName: 'Duy tu hệ thống chiếu sáng Võ Văn Kiệt',
      executorName: 'CTCP Chiếu sáng Đô thị Sài Gòn',
      supervisorOrTechnician: 'KS. Lê Minh Tuấn',
      evidenceStatus: 'FULL_EXIF_VALID',
      evidenceLabel: 'Đủ 2 ảnh Trước/Sau (EXIF OK)',
      beforePhoto: {
        url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80',
        caption:
          'Hộp đấu dây và linh kiện kích áp bị cháy rụi do sét lan truyền',
        timestamp: '10:42 • 18/05/2025',
        gpsCoordinates: '10.7523° N, 106.6821° E',
        exifStatus: 'EXIF: Hợp lệ',
        initialStateNote: 'Chập cháy linh kiện kích áp',
        deviceInfo: 'Galaxy Tab Active4 Pro (Cán bộ GIS)',
        isGroupPhoto: false,
      },
      afterPhoto: {
        url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
        caption: 'Đèn LED 150W mới lắp đặt, test sáng đồng bộ ban đêm',
        timestamp: '19:15 • 19/05/2025',
        gpsCoordinates: '10.7523° N, 106.6821° E',
        matchGpsPercent: 'Khớp tọa độ 100%',
        inspectionResult: 'Đạt chuẩn quang thông (>130 lm/W)',
        inspectorName: 'KS. Lê Minh Tuấn (Ký số OK)',
        isGroupPhoto: false,
      },
      technicalNotes:
        'Đã thay thế linh kiện chính hãng Philips OEM, bảo hành 36 tháng. Đã kiểm tra cách điện tiếp địa an toàn (Điện trở tiếp địa đo được: 4.2 Ohm < 10 Ohm đạt TCVN). Tổ kiểm tra chấp thuận hoàn tất hồ sơ đợt 2/2025.',
      contractorDetails: {
        contractNumber: 'HĐ-DT-2025/CS-VVK02',
        packagePeriod: 'Đợt 2/2025 (Kỳ nghiệm thu tháng 5)',
        unitPrice: 1850000,
        warrantyMonths: 36,
        digitalSignStatus: 'Đã ký số Token CA: CTCP Chiếu sáng Đô thị Sài Gòn',
      },
    },

    // 2. NỘI BỘ (CÂY NHÀ LÁ VƯỜN): CS-VK-040 (Cụm sự cố chập aptomat)
    {
      id: 'hist-002',
      completedAt: '25/05/2025 10:15',
      periodLabel: 'Xử lý trong 1h45p (Đạt SLA)',
      assetCode: 'CS-VK-040',
      assetName: 'Trụ đèn chiếu sáng nhánh phụ CS-040',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng',
      taskContent:
        'Khắc phục sự cố chập aptomat & cấp điện lại tuyến đèn nhánh',
      locationDetail: 'Vị trí: Tủ điện T-02 VVK, lề đường Km4+100',
      routeName: 'Đại lộ Võ Văn Kiệt',
      executorType: 'INTERNAL_TEAM',
      projectOrIncidentCode: 'SC-2025-089',
      projectOrIncidentName: 'Sự cố mất điện chiếu sáng nhánh Km4 Võ Văn Kiệt',
      executorName: 'Đội Cơ động 1 - Ban QLDA Hạ tầng',
      supervisorOrTechnician: 'KTV. Trần Văn Nam',
      evidenceStatus: 'SHARED_INCIDENT_PHOTOS',
      evidenceLabel: 'Ảnh chung cụm sự cố (4 tài sản)',
      beforePhoto: {
        url: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=800&q=80',
        caption:
          'Hiện trường toàn cảnh đoạn tuyến tối đen và tủ điện T-02 bị nhảy aptomat',
        timestamp: '08:35 • 25/05/2025',
        gpsCoordinates: '10.7520° N, 106.6818° E',
        exifStatus: 'Ảnh báo cáo tiếp nhận sự cố',
        initialStateNote:
          'Chập cáp ngầm gây nhảy áp tổng, mất điện 4 trụ liên tiếp',
        deviceInfo: 'App Cán bộ Tuần tra Hiện trường (Web Thợ)',
        isGroupPhoto: true,
      },
      afterPhoto: {
        url: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=800&q=80',
        caption:
          'Đội thợ bọc cách điện cáp, thay át tép và đóng điện thành công cả cụm 4 trụ',
        timestamp: '10:15 • 25/05/2025',
        gpsCoordinates: '10.7520° N, 106.6818° E',
        matchGpsPercent: 'Toàn cảnh hiện trường sau xử lý',
        inspectionResult: 'Cụm 4 trụ đèn đã sáng ổn định, điện áp 228V',
        inspectorName: 'KTV. Trần Văn Nam (Đội trưởng cơ động)',
        isGroupPhoto: true,
      },
      beforePhotos: [
        {
          id: 'bp-1',
          url: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=800&q=80',
          caption: 'Ảnh 1: Toàn cảnh đoạn tuyến Km4 mất điện chiếu sáng',
          timestamp: '08:35 • 25/05/2025',
          gpsCoordinates: '10.7520° N, 106.6818° E',
          note: 'Hiện trường lúc tiếp nhận tin báo',
        },
        {
          id: 'bp-2',
          url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
          caption: 'Ảnh 2: Tủ điều khiển T-02 bị nhảy aptomat tổng',
          timestamp: '08:40 • 25/05/2025',
          gpsCoordinates: '10.7520° N, 106.6818° E',
          note: 'Kiểm tra tủ nguồn T-02',
        },
        {
          id: 'bp-3',
          url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800&q=80',
          caption: 'Ảnh 3: Cận cảnh vị trí cáp ngầm bị rách vỏ gây chập',
          timestamp: '08:45 • 25/05/2025',
          gpsCoordinates: '10.7521° N, 106.6819° E',
          note: 'Phát hiện điểm rò điện vỏ cáp',
        },
        {
          id: 'bp-4',
          url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
          caption: 'Ảnh 4: Kiểm tra thông mạch cụm cột CS-040 đến CS-043',
          timestamp: '08:50 • 25/05/2025',
          gpsCoordinates: '10.7522° N, 106.6820° E',
          note: 'Đo thông mạch cách điện',
        },
      ],
      afterPhotos: [
        {
          id: 'ap-1',
          url: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=800&q=80',
          caption: 'Ảnh 1: Cụm 4 trụ đèn CS-040 đến CS-043 sáng đồng bộ',
          timestamp: '10:15 • 25/05/2025',
          gpsCoordinates: '10.7520° N, 106.6818° E',
          note: 'Đóng điện thử nghiệm toàn tuyến',
        },
        {
          id: 'ap-2',
          url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
          caption: 'Ảnh 2: Đo kiểm điện áp pha đạt 228V tại tủ T-02',
          timestamp: '10:18 • 25/05/2025',
          gpsCoordinates: '10.7520° N, 106.6818° E',
          note: 'Đo kiểm thông số an toàn',
        },
        {
          id: 'ap-3',
          url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80',
          caption: 'Ảnh 3: Đã bọc 3 lớp băng keo trung thế và thay aptomat mới',
          timestamp: '10:20 • 25/05/2025',
          gpsCoordinates: '10.7521° N, 106.6819° E',
          note: 'Hoàn thiện mối nối kỹ thuật',
        },
        {
          id: 'ap-4',
          url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&q=80',
          caption: 'Ảnh 4: Khóa niêm phong tủ điện T-02 và thu dọn hiện trường',
          timestamp: '10:25 • 25/05/2025',
          gpsCoordinates: '10.7520° N, 106.6818° E',
          note: 'Dọn dẹp trả lại mặt bằng',
        },
      ],
      technicalNotes:
        'Đội cơ động tiếp cận kiểm tra tủ T-02, phát hiện chuột cắn trầy xước vỏ cáp gây chạm mát vỏ tủ khi mưa. Đã bọc lại 3 lớp băng keo trung thế 3M, thay thế aptomat nhánh 32A và 2 bộ tụ kích. Kiểm tra thử tải 30 phút đạt tiêu chuẩn vận hành an toàn.',
      managementNote:
        'Đã xác nhận sự cố khắc phục kịp thời trong khung giờ sáng, không ảnh hưởng an toàn giao thông.',
      managementNoteUpdatedAt: '25/05/2025 14:00',
      managementNoteUpdatedBy: 'Cán bộ Giám sát Ban QLDA',
      internalTeamDetails: {
        incidentTicketCode: 'SC-2025-089',
        incidentSummary:
          'Nhảy áp aptomat lộ 2 tủ điều khiển T-02 gây mất điện 4 trụ đèn liền kề CS-040 đến CS-043',
        linkedAssets: [
          {
            code: 'CS-VK-040',
            name: 'Trụ đèn nhánh phụ CS-040',
            type: 'Chiếu sáng',
            isCurrent: true,
          },
          {
            code: 'CS-VK-041',
            name: 'Trụ đèn nhánh phụ CS-041',
            type: 'Chiếu sáng',
            isCurrent: false,
          },
          {
            code: 'CS-VK-042',
            name: 'Trụ đèn LED 150W đôi CS-042',
            type: 'Chiếu sáng',
            isCurrent: false,
          },
          {
            code: 'CS-VK-043',
            name: 'Trụ đèn nhánh phụ CS-043',
            type: 'Chiếu sáng',
            isCurrent: false,
          },
        ],
        slaResponseTime: '1 giờ 45 phút (Đạt chuẩn quy định < 2 giờ)',
        materialsUsed: [
          '02 Bộ kích áp chiếu sáng Philips OEM',
          '01 Aptomat tép 1P-32A Schneider',
          '01 Cuộn băng keo cách điện trung thế 3M Scotch 23',
        ],
        reportedAt: '25/05/2025 08:30',
        resolvedAt: '25/05/2025 10:15',
        actionLog:
          'Cán bộ tuần tra gửi tin báo 08:30 -> Phân công Đội 1 lúc 08:35 -> Có mặt hiện trường 08:55 -> Đóng điện nghiệm thu 10:15',
        teamMembers: [
          {
            name: 'KTV. Trần Văn Nam',
            role: 'Đội trưởng - Trưởng kíp xử lý',
            phone: '0903.112.345',
          },
          {
            name: 'KTV. Nguyễn Văn Hải',
            role: 'Thợ điện chiếu sáng chính',
            phone: '0912.445.678',
          },
          {
            name: 'Lái xe Lê Quốc Tuấn',
            role: 'Lái xe cẩu chuyên dùng Ban QLDA',
            phone: '0988.334.556',
          },
        ],
      },
    },

    // 3. NỘI BỘ (CÂY NHÀ LÁ VƯỜN): CS-VK-041 (Cùng sự cố với CS-VK-040, TRÙNG BỘ ẢNH)
    {
      id: 'hist-003',
      completedAt: '25/05/2025 10:15',
      periodLabel: 'Xử lý trong 1h45p (Đạt SLA)',
      assetCode: 'CS-VK-041',
      assetName: 'Trụ đèn chiếu sáng nhánh phụ CS-041',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng',
      taskContent:
        'Khắc phục sự cố chập aptomat & cấp điện lại tuyến đèn nhánh',
      locationDetail: 'Vị trí: Cột Km4+150, Nhánh rẽ chân cầu vượt',
      routeName: 'Đại lộ Võ Văn Kiệt',
      executorType: 'INTERNAL_TEAM',
      projectOrIncidentCode: 'SC-2025-089',
      projectOrIncidentName: 'Sự cố mất điện chiếu sáng nhánh Km4 Võ Văn Kiệt',
      executorName: 'Đội Cơ động 1 - Ban QLDA Hạ tầng',
      supervisorOrTechnician: 'KTV. Trần Văn Nam',
      evidenceStatus: 'SHARED_INCIDENT_PHOTOS',
      evidenceLabel: 'Ảnh chung cụm sự cố (4 tài sản)',
      beforePhoto: {
        url: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=800&q=80',
        caption:
          'Hiện trường toàn cảnh đoạn tuyến tối đen và tủ điện T-02 bị nhảy aptomat',
        timestamp: '08:35 • 25/05/2025',
        gpsCoordinates: '10.7520° N, 106.6818° E',
        exifStatus: 'Ảnh báo cáo tiếp nhận sự cố',
        initialStateNote:
          'Chập cáp ngầm gây nhảy áp tổng, mất điện 4 trụ liên tiếp',
        deviceInfo: 'App Cán bộ Tuần tra Hiện trường (Web Thợ)',
        isGroupPhoto: true,
      },
      afterPhoto: {
        url: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=800&q=80',
        caption:
          'Đội thợ bọc cách điện cáp, thay át tép và đóng điện thành công cả cụm 4 trụ',
        timestamp: '10:15 • 25/05/2025',
        gpsCoordinates: '10.7520° N, 106.6818° E',
        matchGpsPercent: 'Toàn cảnh hiện trường sau xử lý',
        inspectionResult: 'Cụm 4 trụ đèn đã sáng ổn định, điện áp 228V',
        inspectorName: 'KTV. Trần Văn Nam (Đội trưởng cơ động)',
        isGroupPhoto: true,
      },
      technicalNotes:
        'Tài sản CS-VK-041 được thông điện trở lại đồng thời trong đợt khắc phục sự cố tủ T-02 của Đội Cơ động 1. Kiểm tra bóng đèn sáng tốt không cần thay bóng.',
      internalTeamDetails: {
        incidentTicketCode: 'SC-2025-089',
        incidentSummary:
          'Nhảy áp aptomat lộ 2 tủ điều khiển T-02 gây mất điện 4 trụ đèn liền kề CS-040 đến CS-043',
        linkedAssets: [
          {
            code: 'CS-VK-040',
            name: 'Trụ đèn nhánh phụ CS-040',
            type: 'Chiếu sáng',
            isCurrent: false,
          },
          {
            code: 'CS-VK-041',
            name: 'Trụ đèn nhánh phụ CS-041',
            type: 'Chiếu sáng',
            isCurrent: true,
          },
          {
            code: 'CS-VK-042',
            name: 'Trụ đèn LED 150W đôi CS-042',
            type: 'Chiếu sáng',
            isCurrent: false,
          },
          {
            code: 'CS-VK-043',
            name: 'Trụ đèn nhánh phụ CS-043',
            type: 'Chiếu sáng',
            isCurrent: false,
          },
        ],
        slaResponseTime: '1 giờ 45 phút (Đạt chuẩn quy định < 2 giờ)',
        materialsUsed: [
          '02 Bộ kích áp chiếu sáng Philips OEM',
          '01 Aptomat tép 1P-32A Schneider',
          '01 Cuộn băng keo cách điện trung thế 3M Scotch 23',
        ],
        reportedAt: '25/05/2025 08:30',
        resolvedAt: '25/05/2025 10:15',
        actionLog:
          'Cán bộ tuần tra gửi tin báo 08:30 -> Phân công Đội 1 lúc 08:35 -> Có mặt hiện trường 08:55 -> Đóng điện nghiệm thu 10:15',
        teamMembers: [
          {
            name: 'KTV. Trần Văn Nam',
            role: 'Đội trưởng - Trưởng kíp xử lý',
            phone: '0903.112.345',
          },
          {
            name: 'KTV. Nguyễn Văn Hải',
            role: 'Thợ điện chiếu sáng chính',
            phone: '0912.445.678',
          },
          {
            name: 'Lái xe Lê Quốc Tuấn',
            role: 'Lái xe cẩu chuyên dùng Ban QLDA',
            phone: '0988.334.556',
          },
        ],
      },
    },

    // 4. NHÀ THẦU: CX-VK-018 (Cây xanh - Nghiệm thu theo đợt)
    {
      id: 'hist-004',
      completedAt: '18/05/2025',
      periodLabel: 'Nghiệm thu Đợt 1 - Cắt tỉa hè',
      assetCode: 'CX-VK-018',
      assetName: 'Cây Xà Cừ cổ thụ loại 3',
      layerId: 'GREENERY',
      layerName: 'Cây xanh',
      taskContent: 'Cắt tỉa mé nhánh xà cừ nguy hiểm, thu gom cành',
      locationDetail: 'Phòng chống mùa mưa bão năm 2025 (Km3+400 lề trái)',
      routeName: 'Đại lộ Võ Văn Kiệt',
      executorType: 'CONTRACTOR',
      projectOrIncidentCode: 'DT-2025-VVK-01',
      projectOrIncidentName: 'Cắt tỉa hạ cành cây xanh ĐL Võ Văn Kiệt',
      executorName: 'Công ty TNHH Cây xanh Công viên TP',
      supervisorOrTechnician: 'Đội trưởng Hùng',
      evidenceStatus: 'FULL_EXIF_VALID',
      evidenceLabel: 'Đủ 2 ảnh Trước/Sau (EXIF OK)',
      beforePhoto: {
        url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&q=80',
        caption: 'Cành xà cừ lớn có nguy cơ gãy đổ đè lên đường dây viễn thông',
        timestamp: '08:15 • 18/05/2025',
        gpsCoordinates: '10.7512° N, 106.6780° E',
        exifStatus: 'EXIF: Hợp lệ',
        initialStateNote: 'Tán cây xòe rộng mục sâu thân nhánh',
        deviceInfo: 'Cán bộ giám sát địa bàn VVK',
        isGroupPhoto: false,
      },
      afterPhoto: {
        url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80',
        caption:
          'Đã cắt tỉa thông thoáng, bôi keo liền sẹo cành cắt, dọn sạch vỉa hè',
        timestamp: '14:30 • 18/05/2025',
        gpsCoordinates: '10.7512° N, 106.6780° E',
        matchGpsPercent: 'Khớp tọa độ 100%',
        inspectionResult: 'Cắt tỉa chuẩn kỹ thuật công viên',
        inspectorName: 'Đội trưởng Hùng (Ký số OK)',
        isGroupPhoto: false,
      },
      technicalNotes:
        'Hạ 3 nhánh cấp 1 đường kính 25cm vươn ra lòng đường. Quét sơn bảo vệ vết cắt chống mối mọt mục rỗng. Xe chuyên dùng đã vận chuyển toàn bộ sinh khối về bãi tập kết trong ngày.',
      contractorDetails: {
        contractNumber: 'HĐ-CX-2025/VVK01',
        packagePeriod: 'Đợt 1 mùa khô/hè 2025',
        unitPrice: 1250000,
        warrantyMonths: 12,
        digitalSignStatus:
          'Đã ký số Token CA: Công ty TNHH Cây xanh Công viên TP',
      },
    },

    // 5. NHÀ THẦU: TN-VK-088 (Thoát nước - Nghiệm thu theo đợt)
    {
      id: 'hist-005',
      completedAt: '15/05/2025',
      periodLabel: 'Nghiệm thu Đợt nạo vét Q2',
      assetCode: 'TN-VK-088',
      assetName: 'Hố ga thu nước mặt composite',
      layerId: 'DRAINAGE',
      layerName: 'Thoát nước',
      taskContent: 'Nạo vét bùn lắng & thay nắp song chắn rác',
      locationDetail: 'Lắp khung composite chống mất trộm (Km2+100 lề phải)',
      routeName: 'Đại lộ Võ Văn Kiệt',
      executorType: 'CONTRACTOR',
      projectOrIncidentCode: 'DT-2025-VVK-03',
      projectOrIncidentName: 'Duy tu thoát nước & mặt đường VVK',
      executorName: 'Xí nghiệp Thoát nước Đô thị 1',
      supervisorOrTechnician: 'KTV. Hoàng Anh',
      evidenceStatus: 'FULL_EXIF_VALID',
      evidenceLabel: 'Đủ 2 ảnh Trước/Sau (EXIF OK)',
      beforePhoto: {
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800&q=80',
        caption:
          'Hố ga bùn đất đầy 80%, song chắn rác gang cũ bị vỡ góc nguy hiểm',
        timestamp: '07:30 • 15/05/2025',
        gpsCoordinates: '10.7495° N, 106.6712° E',
        exifStatus: 'EXIF: Hợp lệ',
        initialStateNote: 'Tắc nghẽn dòng chảy thu nước mặt',
        deviceInfo: 'Thiết bị chụp hiện trường Thoát nước',
        isGroupPhoto: false,
      },
      afterPhoto: {
        url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80',
        caption:
          'Nạo vét sạch đáy hố ga đến cao độ thiết kế, lắp nắp composite chịu lực 25T',
        timestamp: '09:15 • 15/05/2025',
        gpsCoordinates: '10.7495° N, 106.6712° E',
        matchGpsPercent: 'Khớp tọa độ 100%',
        inspectionResult: 'Đạt yêu cầu tiêu thoát nước mặt',
        inspectorName: 'KTV. Hoàng Anh (Ký số OK)',
        isGroupPhoto: false,
      },
      technicalNotes:
        'Khối lượng bùn nạo vét: 0.85 m3. Thay mới khung và nắp song thoát nước bằng vật liệu Composite cốt sợi thủy tinh chống mất trộm, bản lề chìm an toàn.',
      contractorDetails: {
        contractNumber: 'HĐ-TN-2025/VVK03',
        packagePeriod: 'Kỳ nạo vét định kỳ Q2/2025',
        unitPrice: 2100000,
        warrantyMonths: 24,
        digitalSignStatus: 'Đã ký số Token CA: Xí nghiệp Thoát nước Đô thị 1',
      },
    },

    // 6. NHÀ THẦU: CS-VK-105 (Chiếu sáng - Nghiệm thu theo đợt)
    {
      id: 'hist-006',
      completedAt: '12/05/2025',
      periodLabel: 'Nghiệm thu Đợt chỉnh trang',
      assetCode: 'CS-VK-105',
      assetName: 'Cột thép mạ kẽm bát giác 11m',
      layerId: 'LIGHTING',
      layerName: 'Chiếu sáng',
      taskContent: 'Sơn dặm phản quang chân cột & dán mã QR',
      locationDetail: 'Cập nhật tọa độ trạm nguồn CS-08 (Km5+600)',
      routeName: 'Đại lộ Võ Văn Kiệt',
      executorType: 'CONTRACTOR',
      projectOrIncidentCode: 'DT-2025-VVK-02',
      projectOrIncidentName: 'Duy tu hệ thống chiếu sáng Võ Văn Kiệt',
      executorName: 'CTCP Chiếu sáng Đô thị Sài Gòn',
      supervisorOrTechnician: 'Tổ trưởng Nam',
      evidenceStatus: 'FULL_EXIF_VALID',
      evidenceLabel: 'Đủ 2 ảnh Trước/Sau (EXIF OK)',
      beforePhoto: {
        url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80',
        caption: 'Sơn phản quang chân cột bị mờ tróc do ngập nước và va quẹt',
        timestamp: '13:20 • 12/05/2025',
        gpsCoordinates: '10.7550° N, 106.6905° E',
        exifStatus: 'EXIF: Hợp lệ',
        initialStateNote: 'Mất tác dụng phản quang ban đêm',
        deviceInfo: 'Cán bộ giám sát QLDA',
        isGroupPhoto: false,
      },
      afterPhoto: {
        url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
        caption:
          'Chân cột đã được làm sạch rỉ sét, quét 2 lớp sơn phản quang vàng đen và dán tem QR kim loại',
        timestamp: '16:00 • 12/05/2025',
        gpsCoordinates: '10.7550° N, 106.6905° E',
        matchGpsPercent: 'Khớp tọa độ 100%',
        inspectionResult: 'Độ phản quang đạt chuẩn ban đêm',
        inspectorName: 'Tổ trưởng Nam (Ký số OK)',
        isGroupPhoto: false,
      },
      technicalNotes:
        'Sơn phản quang cao cấp hệ Polyurethane chống tia UV. Tem mã QR nhôm anodized gắn đinh tán chống cạy gỡ, quét thử nghiệm tải thông tin lý lịch tài sản nhanh.',
      contractorDetails: {
        contractNumber: 'HĐ-DT-2025/CS-VVK02',
        packagePeriod: 'Đợt chỉnh trang mỹ quan đô thị',
        unitPrice: 650000,
        warrantyMonths: 18,
        digitalSignStatus: 'Đã ký số Token CA: CTCP Chiếu sáng Đô thị Sài Gòn',
      },
    },

    // 7. NHÀ THẦU: CX-VK-095 (Cây xanh - Nghiệm thu theo đợt)
    {
      id: 'hist-007',
      completedAt: '28/04/2025',
      periodLabel: 'Nghiệm thu Đợt thay thế Q1',
      assetCode: 'CX-VK-095',
      assetName: 'Cây Bàng Đài Loan dải phân cách',
      layerId: 'GREENERY',
      layerName: 'Cây xanh',
      taskContent: 'Đốn hạ cây nghiêng mục gốc, trồng thay thế mới',
      locationDetail: 'Trồng bù cây cao 3.5m đường kính gốc 12cm (Km1+800)',
      routeName: 'Đại lộ Võ Văn Kiệt',
      executorType: 'CONTRACTOR',
      projectOrIncidentCode: 'DT-2025-Q1-088',
      projectOrIncidentName: 'Duy tu cây xanh quý I/2025',
      executorName: 'Công ty TNHH Cây xanh Công viên TP',
      supervisorOrTechnician: 'Kỹ sư Trần Đức',
      evidenceStatus: 'FULL_EXIF_VALID',
      evidenceLabel: 'Đủ 2 ảnh Trước/Sau (EXIF OK)',
      beforePhoto: {
        url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&q=80',
        caption:
          'Cây bàng cũ bị bọng rễ mục gốc nghiêng 30 độ về phía làn xe hơi',
        timestamp: '07:45 • 28/04/2025',
        gpsCoordinates: '10.7480° N, 106.6650° E',
        exifStatus: 'EXIF: Hợp lệ',
        initialStateNote: 'Nguy cơ bật gốc mùa mưa',
        deviceInfo: 'Cán bộ GIS Cây xanh',
        isGroupPhoto: false,
      },
      afterPhoto: {
        url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80',
        caption:
          'Đã đào bứng gốc cũ, thay đất mùn hữu cơ và trồng cây bàng giống F1 thẳng tắp có cọc chống thép',
        timestamp: '11:20 • 28/04/2025',
        gpsCoordinates: '10.7480° N, 106.6650° E',
        matchGpsPercent: 'Khớp tọa độ 100%',
        inspectionResult: 'Cây giống chuẩn loại 1, bảo hành sống 100%',
        inspectorName: 'Kỹ sư Trần Đức (Ký số OK)',
        isGroupPhoto: false,
      },
      technicalNotes:
        'Cây bàng Đài Loan phân cành đều, bầu rễ nguyên vẹn. Sử dụng bộ giằng 3 cọc thép sơn chống rỉ đệm cao su thân cây. Đơn vị thi công chịu trách nhiệm tưới tiêu chăm sóc 6 tháng.',
      contractorDetails: {
        contractNumber: 'HĐ-CX-2025/Q1-088',
        packagePeriod: 'Nghiệm thu khối lượng trồng thay thế Q1',
        unitPrice: 3400000,
        warrantyMonths: 12,
        digitalSignStatus:
          'Đã ký số Token CA: Công ty TNHH Cây xanh Công viên TP',
      },
    },

    // 8. NỘI BỘ (CÂY NHÀ LÁ VƯỜN): TN-VK-034 (Hố ga vỡ nắp khẩn cấp)
    {
      id: 'hist-008',
      completedAt: '22/05/2025 14:10',
      periodLabel: 'Khẩn cấp trong 45p (Đạt SLA)',
      assetCode: 'TN-VK-034',
      assetName: 'Hố ga thu nước mặt Km2+500',
      layerId: 'DRAINAGE',
      layerName: 'Thoát nước',
      taskContent: 'Thay thế khẩn cấp nắp hố ga bị vỡ do xe tải va quẹt',
      locationDetail: 'Chống sụt lún nguy hiểm người đi đường (Km2+500)',
      routeName: 'Đại lộ Võ Văn Kiệt',
      executorType: 'INTERNAL_TEAM',
      projectOrIncidentCode: 'SC-2025-082',
      projectOrIncidentName: 'Sự cố vỡ nắp hố ga gây mất an toàn giao thông',
      executorName: 'Đội Phản ứng nhanh Thoát nước - Ban QLDA',
      supervisorOrTechnician: 'Tổ trưởng Lê Văn Hải',
      evidenceStatus: 'SHARED_INCIDENT_PHOTOS',
      evidenceLabel: 'Ảnh xử lý hiện trường (Nội bộ)',
      beforePhoto: {
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800&q=80',
        caption:
          'Nắp ga gang cũ bị gãy sụp hở miệng cống sâu 1.5m cực kỳ nguy hiểm',
        timestamp: '13:25 • 22/05/2025',
        gpsCoordinates: '10.7501° N, 106.6745° E',
        exifStatus: 'Ảnh phản ánh người dân qua Tổng đài 1022',
        initialStateNote: 'Hố tử thần tiềm ẩn tai nạn xe máy',
        deviceInfo: 'Hệ thống 1022 tiếp nhận',
        isGroupPhoto: false,
      },
      afterPhoto: {
        url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80',
        caption:
          'Đội phản ứng nhanh mang nắp dự phòng kho Ban lắp đặt, chèn vữa đông kết nhanh',
        timestamp: '14:10 • 22/05/2025',
        gpsCoordinates: '10.7501° N, 106.6745° E',
        matchGpsPercent: 'Hiện trường hoàn tất an toàn',
        inspectionResult: 'Mặt bằng êm thuận, xe lưu thông bình thường',
        inspectorName: 'Tổ trưởng Lê Văn Hải (Đội phản ứng nhanh)',
        isGroupPhoto: false,
      },
      technicalNotes:
        'Lắp nắp gang đúc D600 tải trọng 40T dự phòng từ kho Ban QLDA. Đã chèn vữa Sika Grout đông kết nhanh trong 30 phút. Hoàn trả mặt bằng an toàn giao thông.',
      internalTeamDetails: {
        incidentTicketCode: 'SC-2025-082',
        incidentSummary:
          'Nắp hố ga bị gãy do xe container lùi va chạm, phản ánh khẩn cấp lúc 13:20',
        linkedAssets: [
          {
            code: 'TN-VK-034',
            name: 'Hố ga thu nước mặt Km2+500',
            type: 'Thoát nước',
            isCurrent: true,
          },
        ],
        slaResponseTime: '45 phút (Đạt chuẩn xử lý khẩn cấp an toàn < 60 phút)',
        materialsUsed: [
          '01 Nắp hố ga gang cầu D600 tải trọng 40T (Kho Ban QLDA)',
          '02 Bao vữa tự chảy SikaGrout 214-11',
        ],
        reportedAt: '22/05/2025 13:25',
        resolvedAt: '22/05/2025 14:10',
        actionLog:
          'Nhận tin báo 13:25 -> Đội xuất kho mang nắp đến vị trí lúc 13:45 -> Thi công hoàn thành bàn giao lúc 14:10',
        teamMembers: [
          {
            name: 'Tổ trưởng Lê Văn Hải',
            role: 'Phụ trách đội phản ứng nhanh',
            phone: '0908.776.543',
          },
          {
            name: 'KTV. Vũ Đình Trọng',
            role: 'Thợ nạo vét & lắp đặt hạ tầng',
            phone: '0934.123.890',
          },
        ],
      },
    },
  ];

  readonly records = signal<MaintenanceHistoryItem[]>(this.initialRecords);

  // Filter criteria state
  readonly filterCriteria = signal<HistoryFilterCriteria>({
    layerId: 'ALL',
    startDate: '2025-01-01',
    endDate: '2025-05-30',
    routeName: 'Tất cả',
    projectIdOrCode: 'ALL',
    executorType: 'ALL',
    contractorOrTeamFilter: 'ALL',
    searchKeyword: '',
  });

  // Filtered list
  readonly filteredRecords = computed(() => {
    const list = this.records();
    const criteria = this.filterCriteria();

    return list.filter((item) => {
      // Filter by layer
      if (criteria.layerId !== 'ALL' && item.layerId !== criteria.layerId) {
        return false;
      }

      // Filter by executor type (Contractor vs Internal team)
      if (
        criteria.executorType !== 'ALL' &&
        item.executorType !== criteria.executorType
      ) {
        return false;
      }

      // Filter by route
      if (
        criteria.routeName !== 'Tất cả' &&
        !item.routeName.includes(criteria.routeName)
      ) {
        return false;
      }

      // Filter by Project or Incident Ticket Code
      if (
        criteria.projectIdOrCode !== 'ALL' &&
        item.projectOrIncidentCode !== criteria.projectIdOrCode
      ) {
        return false;
      }

      // Filter by specific Contractor or Internal Team
      if (
        criteria.contractorOrTeamFilter &&
        criteria.contractorOrTeamFilter !== 'ALL' &&
        item.executorName !== criteria.contractorOrTeamFilter
      ) {
        return false;
      }

      // Filter by search keyword (Asset Code, Name, Task content)
      if (criteria.searchKeyword.trim()) {
        const kw = criteria.searchKeyword.toLowerCase().trim();
        const matchCode = item.assetCode.toLowerCase().includes(kw);
        const matchName = item.assetName.toLowerCase().includes(kw);
        const matchTask = item.taskContent.toLowerCase().includes(kw);
        const matchProj = item.projectOrIncidentCode.toLowerCase().includes(kw);
        const matchExecutor = item.executorName.toLowerCase().includes(kw);
        if (
          !matchCode &&
          !matchName &&
          !matchTask &&
          !matchProj &&
          !matchExecutor
        ) {
          return false;
        }
      }

      return true;
    });
  });

  // KPI Overview counts (Dynamic Layer & Route Insights)
  readonly kpiStats = computed(() => {
    return {
      totalCount: 1428,
      mostMaintainedLayer: {
        name: 'Chiếu sáng đô thị',
        count: 840,
        percent: '58.8% tổng khối lượng',
      },
      leastMaintainedLayer: {
        name: 'Mặt đường & Biển báo',
        count: 32,
        percent: '2.2% - Vận hành ổn định',
      },
      topRoute: {
        name: 'Đại lộ Võ Văn Kiệt',
        count: 520,
        percent: '36.4% mật độ toàn tuyến',
      },
    };
  });

  // Specialized KPIs for Contractor tab vs Internal Team tab
  getTabKpis(tab: 'CONTRACTOR' | 'INTERNAL_TEAM') {
    if (tab === 'CONTRACTOR') {
      return {
        totalCount: 1024,
        card1: {
          title: 'TỔNG LƯỢT BẢO TRÌ',
          val: 1024,
          unit: 'lượt',
          icon: 'bi bi-tools',
          iconClass: 'icon-blue',
        },
        card2: {
          title: 'SỐ LƯỢNG DỰ ÁN',
          val: 4,
          unit: 'dự án',
          icon: 'bi bi-folder-check',
          iconClass: 'icon-emerald',
          subText: 'Đang triển khai duy tu',
        },
        card3: {
          title: 'NHÀ THẦU DUY TU NHIỀU NHẤT',
          entityTitle: 'CTCP Chiếu sáng Đô thị Sài Gòn',
          val: 560,
          unit: 'lượt',
          icon: 'bi bi-award-fill',
          iconClass: 'icon-amber',
        },
        card4: {
          title: 'NHÀ THẦU DUY TU ÍT NHẤT',
          entityTitle: 'Xí nghiệp Thoát nước Đô thị 1',
          val: 180,
          unit: 'lượt',
          icon: 'bi bi-building',
          iconClass: 'icon-purple',
        },
      };
    } else {
      return {
        totalCount: 404,
        card1: {
          title: 'TỔNG CA SỰ CỐ ĐÃ KHẮC PHỤC',
          val: 404,
          unit: 'ca sự cố',
          icon: 'bi bi-tools',
          iconClass: 'icon-purple',
        },
        card2: {
          title: 'SỐ LƯỢNG ĐỘI KHẮC PHỤC',
          val: 2,
          unit: 'đội trực',
          icon: 'bi bi-people-fill',
          iconClass: 'icon-emerald',
          subText: 'Thường trực ứng cứu 24/7',
        },
        card3: {
          title: 'ĐỘI XỬ LÝ SỰ CỐ NHIỀU NHẤT',
          entityTitle: 'Đội Cơ động 1 - Ban QLDA',
          val: 245,
          unit: 'ca sự cố',
          icon: 'bi bi-award-fill',
          iconClass: 'icon-amber',
        },
        card4: {
          title: 'ĐỘI XỬ LÝ SỰ CỐ ÍT NHẤT',
          entityTitle: 'Đội Phản ứng nhanh Thoát nước',
          val: 159,
          unit: 'ca sự cố',
          icon: 'bi bi-shield-shaded',
          iconClass: 'icon-purple',
        },
      };
    }
  }

  updateFilter(criteria: Partial<HistoryFilterCriteria>) {
    this.filterCriteria.update((curr) => ({ ...curr, ...criteria }));
  }

  resetFilter() {
    this.filterCriteria.set({
      layerId: 'ALL',
      startDate: '2025-01-01',
      endDate: '2025-05-30',
      routeName: 'Tất cả',
      projectIdOrCode: 'ALL',
      executorType: 'ALL',
      contractorOrTeamFilter: 'ALL',
      searchKeyword: '',
    });
  }

  updateTechnicalNote(id: string, newNote: string): void {
    this.records.update((list) =>
      list.map((r) => (r.id === id ? { ...r, technicalNotes: newNote } : r)),
    );
  }

  updateManagementNote(id: string, newNote: string): void {
    const now = new Date();
    const formatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.records.update((list) =>
      list.map((r) =>
        r.id === id
          ? {
              ...r,
              managementNote: newNote,
              managementNoteUpdatedAt: formatted,
              managementNoteUpdatedBy: 'Ban QLDA Hạ tầng',
            }
          : r,
      ),
    );
  }

  getRecordByAssetCode(assetCode: string): MaintenanceHistoryItem | undefined {
    return this.records().find((r) => r.assetCode === assetCode);
  }
}
