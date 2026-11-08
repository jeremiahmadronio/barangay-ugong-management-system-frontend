import type { ComponentType } from 'react'
import type { UserRole } from '@/types'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ScrollText,
  ChartNoAxesCombined,
  Archive,
  Shield,
  Scale,
  HeartHandshake,
  FileText,
  FilePlus2,
  CalendarDays,
  Briefcase,
  ShieldAlert,
  History,
  Database,
  Receipt,
  Settings,
  LayoutTemplate,
  Info,
  HelpCircle,
  Phone,
  FolderKanban,
  ShieldCheck,
  FileCheck,
  FileBadge,
  GraduationCap,
} from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: ComponentType<{ className?: string }>
  badge?: string | number
  children?: NavItem[]
}

export const ROLE_LABELS: Record<UserRole, string> = {
  rootadmin: 'System Administrator',
  admin: 'Barangay Admin',
  official: 'Kapitana / Official',
  blotter: 'Blotter Officer',
  lupon: 'Lupon Tagapamayapa',
  vawc: 'VAWC Desk Officer',
  bcpc: 'BCPC Desk Officer',
  clearance: 'Clearance & Certs',
  ftjs: 'First-Time Job Seeker',
}

// 1. System Admin (rootadmin) Navigation
const rootAdminNav: NavItem[] = [
  { label: 'Dashboard', path: '/rootadmin/dashboard', icon: LayoutDashboard },
  { label: 'User Management', path: '/rootadmin/admin-management', icon: Users },
  { label: 'Resident Management', path: '/rootadmin/residents', icon: UserCheck },
  { label: 'Officer Directory', path: '/rootadmin/officers', icon: ShieldCheck },
  {
    label: 'Blotter Department',
    path: '/blotter',
    icon: ShieldAlert,
    children: [
      { label: 'Case Files', path: '/blotter/records', icon: FolderKanban },
      { label: 'Reports', path: '/blotter/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'Lupon Department',
    path: '/lupon',
    icon: Scale,
    children: [
      { label: 'Case Files', path: '/lupon/cases', icon: FolderKanban },
      { label: 'Reports', path: '/lupon/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'VAWC Department',
    path: '/vawc',
    icon: HeartHandshake,
    children: [
      { label: 'Case Files', path: '/vawc/cases', icon: FolderKanban },
      { label: 'Reports', path: '/vawc/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'BCPC Department',
    path: '/bcpc',
    icon: Shield,
    children: [
      { label: 'Case Files', path: '/bcpc/cases', icon: FolderKanban },
      { label: 'Reports', path: '/bcpc/reports', icon: ChartNoAxesCombined },
      { label: 'Archive & Trash Vault', path: '/bcpc/archive', icon: Archive },
    ],
  },
  {
    label: 'Clearance Department',
    path: '/clearance',
    icon: FileBadge,
    children: [
      { label: 'Clearance Records', path: '/clearance/issued', icon: FileCheck },
      { label: 'Reports', path: '/clearance/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'FTJS Department',
    path: '/ftjs',
    icon: GraduationCap,
    children: [
      { label: 'Jobseeker Records', path: '/ftjs/requests', icon: GraduationCap },
      { label: 'Reports', path: '/ftjs/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'Content Management',
    path: '/rootadmin/announcements',
    icon: LayoutTemplate,
    children: [
      { label: 'Announcements', path: '/rootadmin/announcements', icon: FileText },
      { label: 'Services', path: '/rootadmin/services', icon: Briefcase },
      { label: 'Officials', path: '/rootadmin/officials', icon: Users },
      { label: 'About', path: '/rootadmin/about', icon: Info },
      { label: 'Upcoming Events', path: '/rootadmin/upcoming-events', icon: CalendarDays },
      { label: 'FAQs', path: '/rootadmin/faq', icon: HelpCircle },
      { label: 'Emergency Hotlines', path: '/rootadmin/emergency-hotlines', icon: Phone },
      { label: 'Website Settings', path: '/rootadmin/website-settings', icon: Settings },
    ],
  },
  { label: 'Database Backup', path: '/rootadmin/backup-management', icon: Database },
  { label: 'System Audit Logs', path: '/rootadmin/audit-logs', icon: History },
  { label: 'Archive Vault', path: '/rootadmin/archive', icon: Archive },
]

// 2. Barangay Admin Navigation
const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'User Management', path: '/admin/user-management', icon: Users },
  { label: 'Resident Management', path: '/admin/residents', icon: UserCheck },
  { label: 'Officer Directory', path: '/admin/officers', icon: ShieldCheck },
  {
    label: 'Blotter Department',
    path: '/blotter',
    icon: ShieldAlert,
    children: [
      { label: 'Case Files', path: '/blotter/records', icon: FolderKanban },
      { label: 'Reports', path: '/blotter/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'Lupon Department',
    path: '/lupon',
    icon: Scale,
    children: [
      { label: 'Case Files', path: '/lupon/cases', icon: FolderKanban },
      { label: 'Reports', path: '/lupon/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'VAWC Department',
    path: '/vawc',
    icon: HeartHandshake,
    children: [
      { label: 'Case Files', path: '/vawc/cases', icon: FolderKanban },
      { label: 'Reports', path: '/vawc/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'BCPC Department',
    path: '/bcpc',
    icon: Shield,
    children: [
      { label: 'Case Files', path: '/bcpc/cases', icon: FolderKanban },
      { label: 'Reports', path: '/bcpc/reports', icon: ChartNoAxesCombined },
      { label: 'Archive & Trash Vault', path: '/bcpc/archive', icon: Archive },
    ],
  },
  {
    label: 'Clearance Department',
    path: '/clearance',
    icon: FileBadge,
    children: [
      { label: 'Clearance Records', path: '/clearance/issued', icon: FileCheck },
      { label: 'Reports', path: '/clearance/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'FTJS Department',
    path: '/ftjs',
    icon: GraduationCap,
    children: [
      { label: 'Jobseeker Records', path: '/ftjs/requests', icon: GraduationCap },
      { label: 'Reports', path: '/ftjs/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'Content Management',
    path: '/admin/announcements',
    icon: LayoutTemplate,
    children: [
      { label: 'Announcements', path: '/admin/announcements', icon: FileText },
      { label: 'Services', path: '/admin/services', icon: Briefcase },
      { label: 'Officials', path: '/admin/officials', icon: Users },
      { label: 'About', path: '/admin/about', icon: Info },
      { label: 'Upcoming Events', path: '/admin/upcoming-events', icon: CalendarDays },
      { label: 'FAQs', path: '/admin/faq', icon: HelpCircle },
      { label: 'Emergency Hotlines', path: '/admin/emergency-hotlines', icon: Phone },
      { label: 'Website Settings', path: '/admin/website-settings', icon: Settings },
    ],
  },
  { label: 'Archive Vault', path: '/admin/archive', icon: Archive },
]

// 3. Kapitana / Barangay Official Navigation
const officialNav: NavItem[] = [
  { label: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Resident Records', path: '/residents', icon: UserCheck },
  {
    label: 'Blotter Department',
    path: '/blotter',
    icon: ShieldAlert,
    children: [
      { label: 'Case Files', path: '/blotter/records', icon: FolderKanban },
      { label: 'Docket Books', path: '/blotter/docket', icon: ScrollText },
      { label: 'Reports', path: '/blotter/reports', icon: ChartNoAxesCombined },
      { label: 'Archive & Trash Vault', path: '/blotter/archive', icon: Archive },
    ],
  },
  {
    label: 'Lupon Department',
    path: '/lupon',
    icon: Scale,
    children: [
      { label: 'Dashboard', path: '/lupon/dashboard', icon: LayoutDashboard },
      { label: 'Case Files', path: '/lupon/cases', icon: FolderKanban },
      { label: 'Reports', path: '/lupon/reports', icon: ChartNoAxesCombined },
      { label: 'Archive & Trash Vault', path: '/lupon/archive', icon: Archive },
    ],
  },
  {
    label: 'VAWC Department',
    path: '/vawc',
    icon: HeartHandshake,
    children: [
      { label: 'Dashboard', path: '/vawc/dashboard', icon: LayoutDashboard },
      { label: 'Case Files', path: '/vawc/cases', icon: FolderKanban },
      { label: 'Reports', path: '/vawc/reports', icon: ChartNoAxesCombined },
      { label: 'Archive & Trash Vault', path: '/vawc/archive', icon: Archive },
    ],
  },
  {
    label: 'BCPC Department',
    path: '/bcpc',
    icon: Shield,
    children: [
      { label: 'Case Files', path: '/bcpc/cases', icon: FolderKanban },
      { label: 'Reports', path: '/bcpc/reports', icon: ChartNoAxesCombined },
      { label: 'Archive & Trash Vault', path: '/bcpc/archive', icon: Archive },
    ],
  },
  {
    label: 'Clearance Department',
    path: '/clearance',
    icon: FileBadge,
    children: [
      { label: 'Clearance Records', path: '/clearance/issued', icon: FileCheck },
      { label: 'Reports', path: '/clearance/reports', icon: ChartNoAxesCombined },
      { label: 'Revenue & Collection', path: '/clearance/revenue', icon: Receipt },
      { label: 'Archive & Trash Vault', path: '/clearance/archive', icon: Archive },
    ],
  },
  {
    label: 'FTJS Department',
    path: '/ftjs',
    icon: GraduationCap,
    children: [
      { label: 'FTJS Dashboard', path: '/ftjs/dashboard', icon: LayoutDashboard },
      { label: 'Resident Directory', path: '/residents', icon: UserCheck },
      { label: 'Jobseeker Records', path: '/ftjs/requests', icon: GraduationCap },
      { label: 'Reports', path: '/ftjs/reports', icon: ChartNoAxesCombined },
      { label: 'Archive & Trash Vault', path: '/ftjs/archive', icon: Archive },
    ],
  },
  { label: 'Audit Logs', path: '/audit-logs', icon: History },
  { label: 'Settings', path: '/settings', icon: Settings },
]

// 4. Blotter Officer Navigation
const blotterNav: NavItem[] = [
  { label: 'Dashboard', path: '/blotter/dashboard', icon: LayoutDashboard },
  { label: 'Resident Directory', path: '/residents', icon: UserCheck },
  { label: 'File New Complaint', path: '/blotter/entry', icon: FilePlus2 },
  { label: 'Case Files', path: '/blotter/records', icon: FolderKanban },
  { label: 'Reports', path: '/blotter/reports', icon: ChartNoAxesCombined },
  { label: 'Archive & Trash Vault', path: '/blotter/archive', icon: Archive },
]

// 5. Lupon Tagapamayapa Navigation
const luponNav: NavItem[] = [
  { label: 'Dashboard', path: '/lupon/dashboard', icon: LayoutDashboard },
  { label: 'Resident Directory', path: '/residents', icon: UserCheck },
  { label: 'Case Files', path: '/lupon/cases', icon: FolderKanban },
  { label: 'Reports', path: '/lupon/reports', icon: ChartNoAxesCombined },
  { label: 'Archive & Trash Vault', path: '/lupon/archive', icon: Archive },
]

// 6. VAWC Officer Navigation
const vawcNav: NavItem[] = [
  { label: 'Dashboard', path: '/vawc/dashboard', icon: LayoutDashboard },
  { label: 'Resident Directory', path: '/residents', icon: UserCheck },
  { label: 'New VAWC Entry', path: '/vawc/entry', icon: FilePlus2 },
  { label: 'Case Files', path: '/vawc/cases', icon: FolderKanban },
  { label: 'Reports', path: '/vawc/reports', icon: ChartNoAxesCombined },
  { label: 'Archive & Trash Vault', path: '/vawc/archive', icon: Archive },
]

// 7. BCPC Officer Navigation
const bcpcNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Resident Directory', path: '/residents', icon: UserCheck },
  { label: 'File New Complaint', path: '/bcpc/entry', icon: FilePlus2 },
  { label: 'Case Files', path: '/bcpc/cases', icon: FolderKanban },
  { label: 'Reports', path: '/bcpc/reports', icon: ChartNoAxesCombined },
  { label: 'Archive & Trash Vault', path: '/bcpc/archive', icon: Archive },
]

// 8. Clearance Officer Navigation
const clearanceNav: NavItem[] = [
  { label: 'Dashboard', path: '/clearance/dashboard', icon: LayoutDashboard },
  { label: 'Resident Directory', path: '/residents', icon: UserCheck },
  { label: 'Issue Certificate', path: '/clearance/issue', icon: FilePlus2 },
  { label: 'Clearance Records', path: '/clearance/issued', icon: FileCheck },
  { label: 'Reports', path: '/clearance/reports', icon: ChartNoAxesCombined },
  { label: 'Archive & Trash Vault', path: '/clearance/archive', icon: Archive },
]

// 9. First-Time Job Seeker (FTJS) Navigation
const ftjsNav: NavItem[] = [
  { label: 'FTJS Dashboard', path: '/ftjs/dashboard', icon: LayoutDashboard },
  { label: 'Resident Directory', path: '/residents', icon: UserCheck },
  { label: 'Issuance Form', path: '/ftjs/issuance', icon: FilePlus2 },
  { label: 'Jobseeker Records', path: '/ftjs/requests', icon: GraduationCap },
  { label: 'Reports', path: '/ftjs/reports', icon: ChartNoAxesCombined },
  { label: 'Archive & Trash Vault', path: '/ftjs/archive', icon: Archive },
]

export function getNavItemsForRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'rootadmin':
      return rootAdminNav
    case 'admin':
      return adminNav
    case 'official':
      return officialNav
    case 'blotter':
      return blotterNav
    case 'lupon':
      return luponNav
    case 'vawc':
      return vawcNav
    case 'bcpc':
      return bcpcNav
    case 'clearance':
      return clearanceNav
    case 'ftjs':
      return ftjsNav
    default:
      return officialNav
  }
}
