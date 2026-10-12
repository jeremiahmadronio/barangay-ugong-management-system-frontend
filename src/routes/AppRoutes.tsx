import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { PublicLayout } from '@/layouts/PublicLayout'

import { LandingPage } from '@/features/landing/LandingPage'
import OfficialsPage from '@/features/landing/OfficialsPage'
import MapsPage from '@/features/landing/MapsPage'
import { EventsCalendar } from '@/features/landing/EventsCalendar'
import ServiceDetailsPage from '@/features/landing/ServiceDetailsPage'
import ServicesPage from '@/features/landing/ServicesPage'
import AllAnnouncementsPage from '@/features/landing/AllAnnouncementsPage'
import AnnouncementDetailsPage from '@/features/landing/AnnouncementDetailsPage'
import FAQPage from '@/features/landing/FAQPage'
import ContactPage from '@/features/landing/ContactPage'

import { LoginPage } from '@/features/auth/LoginPage'
import { MFAVerificationPage } from '@/features/auth/MFAVerificationPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetCodeVerificationPage } from '@/features/auth/ResetCodeVerificationPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { ChangePasswordNewAccountPage } from '@/features/auth/ChangePasswordNewAccountPage'
import { TermsAndConditionPage } from '@/features/auth/TermsAndConditionPage'

import { UserManagementPage } from '@/features/system_admin/user_management/UserManagementPage'
import { SystemUserManagementPage } from '@/features/admin/user_management/SystemUserManagementPage'
import { AccountSettingsPage } from '@/features/settings/AccountSettingsPage'
import { OfficerManagementPage } from '@/features/system_admin/officer_management/OfficerManagementPage'
import { ResidentsPage } from '@/features/residents/ResidentsPage'
import { FileComplaintPage } from '@/features/blotter/FileComplaintPage'
import { BlotterPage } from '@/features/blotter/BlotterPage'
import { BlotterReports } from '@/features/blotter/BlotterReports'
import { BlotterArchiveVaultPage } from '@/features/blotter/BlotterArchiveVaultPage'
import { BlotterDashboardPage } from '@/features/blotter/BlotterDashboardPage'
import { LuponPage } from '@/features/lupon/LuponPage'
import { LuponDashboardPage } from '@/features/lupon/LuponDashboardPage'
import { LuponReports } from '@/features/lupon/LuponReports'
import { LuponArchive } from '@/features/lupon/LuponArchive'
import { VawcDashboardPage } from '@/features/vawc/VawcDashboardPage'
import { VawcPage } from '@/features/vawc/VawcPage'
import { FileVawcComplaintPage } from '@/features/vawc/FileVawcComplaintPage'
import { VawcReports } from '@/features/vawc/VawcReports'
import { VawcArchive } from '@/features/vawc/VawcArchive'
import { BcpcPage } from '@/features/bcpc/BcpcPage'
import { ClearanceDashboardPage } from '@/features/clearance/ClearanceDashboardPage'
import { ClearanceIssuePage } from '@/features/clearance/ClearanceIssuePage'
import { ClearanceIssuedPage } from '@/features/clearance/ClearanceIssuedPage'
import { ClearanceReports } from '@/features/clearance/ClearanceReports'
import { ClearanceArchive } from '@/features/clearance/ClearanceArchive'
import { FtjsPage } from '@/features/ftjs/FtjsPage'
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage'
import { SystemAdminReusablePage } from '@/features/system_admin/reusable/reusable'
import { AuditLogsPage } from '@/features/system_admin/audit_logs/AuditLogsPage'
import { ArchiveManagementPage } from '@/features/system_admin/archive/ArchiveManagementPage'
import {
  AnnouncementsManagement,
  ServicesManagement,
  OfficialsManagement,
  AboutManagement,
  UpcomingEventsManagement,
  FaqManagement,
  EmergencyHotlinesPage,
  WebsiteSettingsPage,
} from '@/features/system_admin/cms'

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages wrapped in PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/officials" element={<OfficialsPage />} />
        <Route path="/map" element={<MapsPage />} />
        <Route path="/events" element={<EventsCalendar />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:id" element={<ServiceDetailsPage />} />
        <Route path="/announcements" element={<AllAnnouncementsPage />} />
        <Route path="/announcements/:id" element={<AnnouncementDetailsPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* Authentication Flow Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/mfa-verification" element={<MFAVerificationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-code" element={<ResetCodeVerificationPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/change-password-new-account" element={<ChangePasswordNewAccountPage />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditionPage />} />

      {/* Protected App Routes */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<AdminDashboardPage />} />

        {/* --- SYSTEM ADMIN & BARANGAY ADMIN ROUTES --- */}
        <Route path="/admin-management" element={<UserManagementPage />} />
        <Route path="/users" element={<UserManagementPage />} />
        <Route path="/residents" element={<ResidentsPage />} />
        <Route path="/officers" element={<OfficerManagementPage />} />
        <Route path="/backup" element={<UserManagementPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />

        {/* /admin/* Prefix Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/user-management" element={<SystemUserManagementPage />} />
        <Route path="/admin/system-users" element={<SystemUserManagementPage />} />
        <Route path="/system-users" element={<SystemUserManagementPage />} />
        <Route path="/admin/residents" element={<ResidentsPage />} />
        <Route path="/admin/officers" element={<OfficerManagementPage />} />
        <Route path="/admin/announcements" element={<AnnouncementsManagement />} />
        <Route path="/admin/services" element={<ServicesManagement />} />
        <Route path="/admin/officials" element={<OfficialsManagement />} />
        <Route path="/admin/about" element={<AboutManagement />} />
        <Route path="/admin/upcoming-events" element={<UpcomingEventsManagement />} />
        <Route path="/admin/faq" element={<FaqManagement />} />
        <Route path="/admin/emergency-hotlines" element={<EmergencyHotlinesPage />} />
        <Route path="/admin/website-settings" element={<WebsiteSettingsPage />} />

        {/* /rootadmin/* Prefix Routes */}
        <Route path="/rootadmin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/system-admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/rootadmin/reusable" element={<SystemAdminReusablePage />} />
        <Route path="/reusable" element={<SystemAdminReusablePage />} />
        <Route path="/system-admin/reusable" element={<SystemAdminReusablePage />} />
        <Route path="/rootadmin/admin-management" element={<UserManagementPage />} />
        <Route path="/rootadmin/residents" element={<ResidentsPage />} />
        <Route path="/rootadmin/officers" element={<OfficerManagementPage />} />
        <Route path="/rootadmin/backup-management" element={<UserManagementPage />} />
        <Route path="/rootadmin/audit-logs" element={<AuditLogsPage />} />
        <Route path="/rootadmin/announcements" element={<AnnouncementsManagement />} />
        <Route path="/rootadmin/services" element={<ServicesManagement />} />
        <Route path="/rootadmin/officials" element={<OfficialsManagement />} />
        <Route path="/rootadmin/about" element={<AboutManagement />} />
        <Route path="/rootadmin/upcoming-events" element={<UpcomingEventsManagement />} />
        <Route path="/rootadmin/faq" element={<FaqManagement />} />
        <Route path="/rootadmin/emergency-hotlines" element={<EmergencyHotlinesPage />} />
        <Route path="/rootadmin/website-settings" element={<WebsiteSettingsPage />} />

        {/* Department Module Routes */}
        <Route path="/blotter/dashboard" element={<BlotterDashboardPage />} />
        <Route path="/blotter" element={<BlotterPage />} />
        <Route path="/blotter/entry" element={<FileComplaintPage />} />
        <Route path="/blotter/new" element={<FileComplaintPage />} />
        <Route path="/blotter/create" element={<FileComplaintPage />} />
        <Route path="/blotter/reports" element={<BlotterReports />} />
        <Route path="/blotter/archive" element={<BlotterArchiveVaultPage />} />
        <Route path="/blotter/formal-complaints" element={<BlotterPage />} />
        <Route path="/blotter/for-the-record" element={<BlotterPage />} />
        <Route path="/blotter/records" element={<BlotterPage />} />
        <Route path="/blotter/docket" element={<BlotterPage />} />
        <Route path="/blotter/*" element={<BlotterPage />} />

        <Route path="/lupon/dashboard" element={<LuponDashboardPage />} />
        <Route path="/lupon" element={<LuponPage />} />
        <Route path="/lupon/cases" element={<LuponPage />} />
        <Route path="/lupon/records" element={<LuponPage />} />
        <Route path="/lupon/reports" element={<LuponReports />} />
        <Route path="/lupon/archive" element={<LuponArchive />} />
        <Route path="/lupon/*" element={<LuponPage />} />

        <Route path="/vawc/dashboard" element={<VawcDashboardPage />} />
        <Route path="/vawc/new" element={<FileVawcComplaintPage />} />
        <Route path="/vawc/create" element={<FileVawcComplaintPage />} />
        <Route path="/vawc/entry" element={<FileVawcComplaintPage />} />
        <Route path="/vawc/file-complaint" element={<FileVawcComplaintPage />} />
        <Route path="/vawc/reports" element={<VawcReports />} />
        <Route path="/vawc/archive" element={<VawcArchive />} />
        <Route path="/vawc/cases" element={<VawcPage />} />
        <Route path="/vawc" element={<VawcPage />} />
        <Route path="/vawc/*" element={<VawcPage />} />

        <Route path="/bcpc" element={<BcpcPage />} />
        <Route path="/bcpc/*" element={<BcpcPage />} />

        <Route path="/clearance" element={<ClearanceDashboardPage />} />
        <Route path="/clearance/dashboard" element={<ClearanceDashboardPage />} />
        <Route path="/clearance/issued" element={<ClearanceIssuedPage />} />
        <Route path="/clearance/issue" element={<ClearanceIssuePage />} />
        <Route path="/clearance/reports" element={<ClearanceReports />} />
        <Route path="/clearance/archive" element={<ClearanceArchive />} />
        <Route path="/clearance/*" element={<Navigate to="/clearance/dashboard" replace />} />

        <Route path="/ftjs" element={<FtjsPage />} />
        <Route path="/ftjs/*" element={<FtjsPage />} />

        <Route path="/archive" element={<ArchiveManagementPage />} />
        <Route path="/admin/archive" element={<ArchiveManagementPage />} />
        <Route path="/rootadmin/archive" element={<ArchiveManagementPage />} />
        <Route path="/system-admin/archive" element={<ArchiveManagementPage />} />
        <Route path="/settings" element={<AccountSettingsPage />} />
        <Route path="/profile" element={<AccountSettingsPage forcedTab="profile" />} />
        <Route path="/security" element={<AccountSettingsPage forcedTab="security" />} />
        <Route path="/admin/profile" element={<AccountSettingsPage forcedTab="profile" />} />
        <Route path="/admin/settings" element={<AccountSettingsPage forcedTab="security" />} />
        <Route path="/rootadmin/profile" element={<AccountSettingsPage forcedTab="profile" />} />
        <Route path="/rootadmin/settings" element={<AccountSettingsPage forcedTab="security" />} />
      </Route>

      {/* Fallback Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
