import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-flow-guide-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="custom-modal-backdrop">
      <div class="custom-modal-dialog modal-xl">
        <div class="modal-content">
          <!-- Modal Header -->
          <div class="modal-header bg-gradient-header text-white">
            <div class="d-flex align-items-center gap-2">
              <span class="guide-icon"><i class="bi bi-diagram-3-fill"></i></span>
              <div>
                <h4 class="modal-title m-0 fw-bold">Tài Liệu Hướng Dẫn Nghiệp Vụ & Quy Trình Demo Phân Hệ Tuần Kiểm</h4>
                <p class="m-0 fs-xs opacity-75">Tài liệu phân tích luồng dữ liệu & giải thích chi tiết kết nối sang Phân hệ Dự Án Duy Tu</p>
              </div>
            </div>
            <button class="btn-close btn-close-white" (click)="close.emit()"></button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body p-4 guide-body-scroll">
            <!-- 3 LUỒNG NGHIỆP VỤ CHÍNH -->
            <div class="section-block">
              <h4 class="section-title text-primary"><i class="bi bi-arrow-repeat"></i> 1. Ba Luồng Nghiệp Vụ Cốt Lõi (Business Flow)</h4>
              <div class="flows-grid-3">
                <!-- Luồng 1 -->
                <div class="flow-card">
                  <div class="flow-card-header bg-light">
                    <span class="flow-badge badge-blue">LUỒNG 1</span>
                    <h5 class="flow-title">Thiết Lập & Cấu Hình</h5>
                    <span class="use-case-tag">UC 1, UC 2, UC 5</span>
                  </div>
                  <div class="flow-card-body">
                    <p class="flow-desc">Khởi tạo dữ liệu nền tảng cho toàn bộ hệ thống tuần kiểm:</p>
                    <ul class="flow-list">
                      <li><strong>Xây dựng danh mục loại vấn đề:</strong> Đèn chiếu sáng hỏng, cây gãy cành, hố ga mất nắp, sụt lún ổ gà...</li>
                      <li><strong>Hồ sơ cụm nhân sự & tổ đội:</strong> Phân chia khu vực trung tâm, ven sông, phản ứng nhanh.</li>
                      <li><strong>Phân quyền & Điểm danh:</strong> Quản trị viên, Trưởng đội, Tuần tra viên; Đánh giá hợp lệ điểm danh.</li>
                    </ul>
                  </div>
                </div>

                <!-- Luồng 2 -->
                <div class="flow-card">
                  <div class="flow-card-header bg-light">
                    <span class="flow-badge badge-green">LUỒNG 2</span>
                    <h5 class="flow-title">Lập Lịch & Thực Thi</h5>
                    <span class="use-case-tag">UC 3, UC 7, UC 8</span>
                  </div>
                  <div class="flow-card-body">
                    <p class="flow-desc">Điều phối lịch trình & thu thập dữ liệu hiện trường:</p>
                    <ul class="flow-list">
                      <li><strong>Lập lịch trên Interactive Calendar:</strong> Phân công ca Sáng, Chiều, Tối theo ngày trực quan.</li>
                      <li><strong>Bản đồ số Tuyến đường (Map View):</strong> Thể hiện lộ trình di chuyển và danh sách checkpoint.</li>
                      <li><strong>App Mobile ngoài thực địa:</strong> Định vị GPS tức thời, tra cứu tài sản GIS, chụp ảnh báo cáo về máy chủ.</li>
                    </ul>
                  </div>
                </div>

                <!-- Luồng 3 -->
                <div class="flow-card highlight-card">
                  <div class="flow-card-header bg-light-orange">
                    <span class="flow-badge badge-orange">LUỒNG 3</span>
                    <h5 class="flow-title">Giám Sát & Quyết Định Xử Lý</h5>
                    <span class="use-case-tag">UC 4, UC 6, UC 9, UC 10</span>
                  </div>
                  <div class="flow-card-body">
                    <p class="flow-desc">Bàn làm việc chính của Cán bộ (Split View) để ra quyết định:</p>
                    <ul class="flow-list">
                      <li><strong>Giám sát theo thời gian thực:</strong> Tiếp nhận sự cố có tọa độ GPS và ảnh chụp trước khi sửa.</li>
                      <li><strong>Nút 1 - Khắc phục nhanh:</strong> Sự cố nhỏ lẻ &rarr; Giao thợ sửa tức thì trong ngày, nghiệm thu khép lại.</li>
                      <li><strong>Nút 2 - Chuyển thành Dự án Duy tu:</strong> Gom nhiều sự cố &rarr; Tự động map Asset_ID sang phân hệ Duy tu!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- BẢNG SO SÁNH PHÂN HỆ TUẦN KIỂM VS DỰ ÁN DUY TU -->
            <div class="section-block mt-4">
              <h4 class="section-title text-success"><i class="bi bi-link-45deg"></i> 2. Sự Kết Nối Với Phân Hệ "Dự Án Duy Tu" (Quan Trọng)</h4>
              <p class="fs-xs text-muted mb-2">Sự liên kết giữa Phân hệ Tuần kiểm và Phân hệ Dự án duy tu tối ưu hóa chi phí và nguồn lực quản lý hạ tầng đô thị:</p>
              
              <div class="table-responsive">
                <table class="table table-bordered table-sm align-middle fs-xs">
                  <thead class="table-secondary">
                    <tr>
                      <th style="width: 20%;">Đặc Điểm</th>
                      <th style="width: 40%;" class="text-primary fw-bold">Phân Hệ Tuần Kiểm (Input)</th>
                      <th style="width: 40%;" class="text-success fw-bold">Phân Hệ Dự Án Duy Tu (Output)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="fw-bold">Bản chất</td>
                      <td>Đầu vào tiếp nhận thông tin sự cố lẻ tẻ, phát sinh theo ngày ngoài hiện trường.</td>
                      <td>Đầu ra xử lý hạ tầng quy mô lớn, dài hạn, có hồ sơ pháp lý và dự toán bài bản.</td>
                    </tr>
                    <tr>
                      <td class="fw-bold">Quy mô sự cố</td>
                      <td>Nhỏ, lẻ, sự cố tức thì (hỏng bóng đèn, gãy nhánh cây, tróc nắp ga...).</td>
                      <td>Vấn đề lớn, mang tính hệ thống, vượt ngân sách bảo trì thường xuyên.</td>
                    </tr>
                    <tr>
                      <td class="fw-bold">Hành động nghiệp vụ</td>
                      <td>Ghi nhận "Vấn đề tuần kiểm" & Cán bộ chọn phương án khắc phục.</td>
                      <td>Khởi tạo "Dự án Duy tu" tổng thể gom từ một hoặc nhiều sự cố tích tụ.</td>
                    </tr>
                    <tr>
                      <td class="fw-bold">Liên kết dữ liệu GIS</td>
                      <td>Tạo danh sách <strong>Asset_ID</strong> bị lỗi tại hiện trường.</td>
                      <td>Hệ thống <strong>tự động Map toàn bộ Asset_ID</strong> này vào <strong>Tab "Tài sản"</strong> của Dự án Duy tu mới!</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- KỊCH BẢN DEMO THUYẾT TRÌNH (DEMO SCRIPT) -->
            <div class="section-block mt-4">
              <h4 class="section-title text-warning"><i class="bi bi-play-circle-fill"></i> 3. Kịch Bản Khuyên Dùng Cho Buổi Thuyết Trình Demo</h4>
              <div class="demo-steps-container">
                <div class="demo-step">
                  <div class="step-badge">Bước 1</div>
                  <div class="step-content">
                    <h5 class="m-0 fw-bold">Bật Tab "4. Mô phỏng App Mobile"</h5>
                    <p class="fs-xs text-muted m-0">Giả lập một nhân viên ngoài thực địa đang cầm điện thoại đi tuần tại Nguyễn Huệ, bấm <em>"GỬI BÁO CÁO VỀ MÁY CHỦ"</em> để chứng minh tính thời gian thực.</p>
                  </div>
                </div>

                <div class="demo-step">
                  <div class="step-badge">Bước 2</div>
                  <div class="step-content">
                    <h5 class="m-0 fw-bold">Vào Tab "1. Bàn Làm Việc Xử Lý Sự Cố (Split View)"</h5>
                    <p class="fs-xs text-muted m-0">Chỉ ra sự cố vừa gửi xuất hiện ngay trên đỉnh danh sách bên trái. Bấm vào sự cố để xem ảnh hiện trường, bản đồ tọa độ GPS và thông tin tài sản.</p>
                  </div>
                </div>

                <div class="demo-step">
                  <div class="step-badge">Bước 3</div>
                  <div class="step-content">
                    <h5 class="m-0 fw-bold">Demo 2 Nút Hành Động Quyết Định:</h5>
                    <p class="fs-xs text-muted m-0">
                      - Thử nút <strong>&lt;Tạo Task Khắc Phục Nhanh&gt;</strong>: Xem luồng giao việc cho thợ và nghiệm thu hoàn tất.<br>
                      - Hoặc tick chọn nhiều sự cố cùng tuyến &rarr; Bấm <strong>&lt;Chuyển Thành Dự Án Duy Tu&gt;</strong> &rarr; Hệ thống lập tức tạo Dự án mới và liên kết tự động danh sách Asset_ID sang phân hệ Duy tu!
                    </p>
                  </div>
                </div>

                <div class="demo-step">
                  <div class="step-badge">Bước 4</div>
                  <div class="step-content">
                    <h5 class="m-0 fw-bold">Vào Tab "2. Lịch Trình & Điều Phối (Calendar + Map)"</h5>
                    <p class="fs-xs text-muted m-0">Bấm các ngày trên lịch, xem lộ trình đường tuần tra Polyline trên Map View và tiến độ điểm danh của tổ đội.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer bg-light">
            <button class="btn btn-primary" (click)="close.emit()">
              <i class="bi bi-check-lg"></i> Đã Hiểu Luồng Nghiệp Vụ - Bắt Đầu Thao Tác
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-gradient-header {
      background: linear-gradient(135deg, #1e3a8a, #2563eb);
      padding: 16px 20px;
    }

    .guide-icon {
      font-size: 24px;
      background: rgba(255,255,255,0.2);
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .guide-body-scroll {
      max-height: 75vh;
      overflow-y: auto;
    }

    .section-title {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .flows-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .flow-card {
      border: 1px solid var(--gray-200);
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      &.highlight-card {
        border-color: #f59e0b;
        box-shadow: 0 4px 12px rgba(245,158,11,0.15);
      }

      .flow-card-header {
        padding: 12px 14px;
        border-bottom: 1px solid var(--gray-200);

        &.bg-light-orange { background: #fffbeb; }

        .flow-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 4px;

          &.badge-blue { background: #dbeafe; color: #1e40af; }
          &.badge-green { background: #d1fae5; color: #065f46; }
          &.badge-orange { background: #fed7aa; color: #9a3412; }
        }

        .flow-title {
          font-size: 13.5px;
          font-weight: 700;
          margin: 0 0 2px 0;
        }

        .use-case-tag {
          font-size: 10.5px;
          color: var(--gray-500);
          font-weight: 600;
        }
      }

      .flow-card-body {
        padding: 12px 14px;
        flex: 1;
        font-size: 12.5px;

        .flow-desc {
          font-size: 11.5px;
          color: var(--gray-600);
          margin-bottom: 8px;
        }

        .flow-list {
          padding-left: 18px;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
        }
      }
    }

    .demo-steps-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .demo-step {
      display: flex;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      padding: 12px;

      .step-badge {
        background: #1e3a8a;
        color: white;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        height: fit-content;
        white-space: nowrap;
      }
    }

    .fs-xs { font-size: 11.5px; }

    /* MODAL */
    .custom-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(3px);
      z-index: 1060;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .custom-modal-dialog {
      width: 100%;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--shadow-xl);

      &.modal-xl { max-width: 980px; }
    }
  `]
})
export class FlowGuideModalComponent {
  @Output() close = new EventEmitter<void>();
}
