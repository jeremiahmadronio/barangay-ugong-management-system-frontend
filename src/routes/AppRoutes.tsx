import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'

import { LandingPage } from '@/features/landing/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { MFAVerificationPage } from '@/features/auth/MFAVerificationPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetCodeVerificationPage } from '@/features/auth/ResetCodeVerificationPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { ChangePasswordNewAccountPage } from '@/features/auth/ChangePasswordNewAccountPage'
import { TermsAndConditionPage } from '@/features/auth/TermsAndConditionPage'

import { UserManagementPage } from '@/features/system_admin/user_management/UserManagementPage'
import { OfficerManagementPage } from '@/features/system_admin/officer_management/OfficerManagementPage'
import { ResidentsPage } from '@/features/residents/ResidentsPage'
import { FormalComplaintPage } from '@/features/blotter/FormalComplaintPage'
import { ForTheRecordPage } from '@/features/blotter/ForTheRecordPage'
import { FileComplaintPage } from '@/features/blotter/FileComplaintPage'
import { FileFormalComplaintPage } from '@/features/blotter/FileFormalComplaintPage'
import { FileForTheRecordPage } from '@/features/blotter/FileForTheRecordPage'
import { BlotterPage } from '@/features/blotter/BlotterPage'
import { LuponPage } from '@/features/lupon/LuponPage'
import { VawcPage } from '@/features/vawc/VawcPage'
import { BcpcPage } from '@/features/bcpc/BcpcPage'
import { ClearancePage } from '@/features/clearance/ClearancePage'
import { FtjsPage } from '@/features/ftjs/FtjsPage'
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage'
import { SystemAdminReusablePage } from '@/features/system_admin/reusable/reusable'
import { EventsManagementPage } from '@/features/system_admin/events_management/EventsManagementPage'
import { AuditLogsPage } from '@/features/system_admin/audit_logs/AuditLogsPage'
import { ArchiveManagementPage } from '@/features/system_admin/archive/ArchiveManagementPage'

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public & Authentication Flow Routes */}
      <Route path="/" element={<LandingPage />} />
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
        <Route path="/admin/user-management" element={<UserManagementPage />} />
        <Route path="/admin/residents" element={<ResidentsPage />} />
        <Route path="/admin/officers" element={<OfficerManagementPage />} />
        <Route path="/admin/events" element={<EventsManagementPage />} />

        {/* /rootadmin/* Prefix Routes */}
        <Route path="/rootadmin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/system-admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/rootadmin/reusable" element={<SystemAdminReusablePage />} />
        <Route path="/reusable" element={<SystemAdminReusablePage />} />
        <Route path="/system-admin/reusable" element={<SystemAdminReusablePage />} />
        <Route path="/rootadmin/admin-management" element={<UserManagementPage />} />
        <Route path="/rootadmin/residents" element={<ResidentsPage />} />
        <Route path="/rootadmin/officers" element={<OfficerManagementPage />} />
        <Route path="/rootadmin/events" element={<EventsManagementPage />} />
        <Route path="/system-admin/events" element={<EventsManagementPage />} />
        <Route path="/rootadmin/backup-management" element={<UserManagementPage />} />
        <Route path="/rootadmin/audit-logs" element={<AuditLogsPage />} />

        {/* Department Module Routes */}
        <Route path="/blotter" element={<BlotterPage />} />
        <Route path="/blotter/entry" element={<FileComplaintPage />} />
        <Route path="/blotter/new" element={<FileComplaintPage />} />
        <Route path="/blotter/create" element={<FileComplaintPage />} />
        <Route path="/blotter/formal-complaints" element={<BlotterPage />} />
        <Route path="/blotter/for-the-record" element={<BlotterPage />} />
        <Route path="/blotter/records" element={<BlotterPage />} />
        <Route path="/blotter/docket" element={<BlotterPage />} />
        <Route path="/blotter/*" element={<BlotterPage />} />

        <Route path="/lupon" element={<LuponPage />} />
        <Route path="/lupon/*" element={<LuponPage />} />

        <Route path="/vawc" element={<VawcPage />} />
        <Route path="/vawc/*" element={<VawcPage />} />

        <Route path="/bcpc" element={<BcpcPage />} />
        <Route path="/bcpc/*" element={<BcpcPage />} />

        <Route path="/clearance" element={<ClearancePage />} />
        <Route path="/clearance/*" element={<ClearancePage />} />

        <Route path="/ftjs" element={<FtjsPage />} />
        <Route path="/ftjs/*" element={<FtjsPage />} />

        <Route path="/events" element={<EventsManagementPage />} />
        <Route path="/archive" element={<ArchiveManagementPage />} />
        <Route path="/admin/archive" element={<ArchiveManagementPage />} />
        <Route path="/rootadmin/archive" element={<ArchiveManagementPage />} />
        <Route path="/system-admin/archive" element={<ArchiveManagementPage />} />
        <Route path="/settings" element={<UserManagementPage />} />
      </Route>

      {/* Fallback Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
