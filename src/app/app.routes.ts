import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProjectListComponent } from './features/projects/project-list/project-list.component';
import { ProjectDetailComponent } from './features/projects/project-detail/project-detail.component';
import { MasterMapComponent } from './features/master-map/master-map.component';
import { MobileContractorComponent } from './features/mobile-contractor/mobile-contractor.component';
import { AcceptanceCenterComponent } from './features/acceptance-center/acceptance-center.component';
import { PatrolComponent } from './features/patrol/patrol.component';
import { FieldPortalComponent } from './features/patrol/field-portal/field-portal.component';
import { ContractorReportComponent } from './features/contractor-report/contractor-report.component';
import { AssetHistoryComponent } from './features/asset-history/asset-history.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, title: 'Tổng Quan | Hạ Tầng Đô Thị GIS' },
  { path: 'asset-history', component: AssetHistoryComponent, title: 'Quản Lý Lịch Sử Duy Tu & Bảo Trì Tài Sản | GIS Đô Thị' },
  { path: 'projects', component: ProjectListComponent, title: 'Quản Lý Dự Án Duy Tu | Hạ Tầng Đô Thị GIS' },
  { path: 'projects/:id', component: ProjectDetailComponent, title: 'Chi Tiết Dự Án | Hạ Tầng Đô Thị GIS' },
  { path: 'patrol', component: PatrolComponent, title: 'Tuần Kiểm Hạ Tầng (VII.2) | GIS Đô Thị' },
  { path: 'field-portal', component: FieldPortalComponent, title: 'Cổng Hiện Trường (Web Thợ & Tuần tra) | GIS Đô Thị' },
  { path: 'contractor-reports', component: ContractorReportComponent, title: 'Cổng Nhà Thầu - Lập Báo Cáo Nghiệm Thu | GIS Đô Thị' },
  { path: 'master-map', component: MasterMapComponent, title: 'Master Map GIS | Kho Dữ Liệu Tổng' },
  { path: 'mobile-contractor', component: MobileContractorComponent, title: 'App Hiện Trường Thợ | Mô Phỏng' },
  { path: 'acceptance-center', component: AcceptanceCenterComponent, title: 'Nghiệm Thu Khối Lượng & Thanh Toán' },
  { path: '**', redirectTo: 'dashboard' }
];
