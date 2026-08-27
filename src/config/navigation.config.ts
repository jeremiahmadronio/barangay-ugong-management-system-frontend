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
  Layers,
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
  { label: 'Reusable Showcase', path: '/rootadmin/reusable', icon: Layers },
  { label: 'Resident Management', path: '/rootadmin/residents', icon: UserCheck },
  { label: 'Officer Directory', path: '/rootadmin/officers', icon: Users },
  {
    label: 'Blotter Cases',
    path: '/blotter',
    icon: ShieldAlert,
    children: [
      { label: 'File New Complaint', path: '/blotter/entry', icon: FilePlus2 },
      { label: 'Formal Complaints', path: '/blotter/records', icon: ShieldAlert },
      { label: 'For the Record Logs', path: '/blotter/docket', icon: ScrollText },
      { label: 'Reports', path: '/blotter/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'Lupon Cases',
    path: '/lupon',
    icon: Scale,
    children: [
      { label: 'Case Files', path: '/lupon/cases', icon: FileText },
      { label: 'Reports', path: '/lupon/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'VAWC Desk',
    path: '/vawc',
    icon: HeartHandshake,
    children: [
      { label: 'Case Records', path: '/vawc/cases', icon: FileText },
      { label: 'Reports', path: '/vawc/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'BCPC Desk',
    path: '/bcpc',
    icon: Shield,
    children: [
      { label: 'Child Protection Cases', path: '/bcpc/cases', icon: FileText },
      { label: 'Reports', path: '/bcpc/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'Clearances',
    path: '/clearance',
    icon: FileText,
    children: [
      { label: 'Issued Certificates', path: '/clearance/issued', icon: FileText },
      { label: 'Revenue & Collections', path: '/clearance/revenue', icon: Receipt },
    ],
  },
  {
    label: 'FTJS Desk',
    path: '/ftjs',
    icon: Briefcase,
    children: [
      { label: 'FTJS Dashboard', path: '/ftjs/dashboard', icon: LayoutDashboard },
      { label: 'Issuance Form', path: '/ftjs/issuance', icon: FilePlus2 },
      { label: 'Job Seeker Requests', path: '/ftjs/requests', icon: FileText },
      { label: 'Reports', path: '/ftjs/reports', icon: ChartNoAxesCombined },
      { label: 'Archive Vault', path: '/ftjs/archive', icon: Archive },
    ],
  },
  { label: 'Community Events', path: '/rootadmin/events', icon: CalendarDays },
  { label: 'Database Backup', path: '/rootadmin/backup-management', icon: Database },
  { label: 'System Audit Logs', path: '/rootadmin/audit-logs', icon: History },
  { label: 'Archive Vault', path: '/rootadmin/archive', icon: Archive },
]

// 2. Barangay Admin Navigation
const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Officer Management', path: '/admin/officers', icon: Users },
  { label: 'Resident Directory', path: '/admin/residents', icon: UserCheck },
  {
    label: 'Blotter',
    path: '/blotter',
    icon: ShieldAlert,
    children: [
      { label: 'Docket', path: '/blotter/docket', icon: ScrollText },
      { label: 'Records', path: '/blotter/records', icon: FileText },
      { label: 'Reports', path: '/blotter/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'Lupon',
    path: '/lupon',
    icon: Scale,
    children: [
      { label: 'Cases', path: '/lupon/cases', icon: FileText },
      { label: 'Reports', path: '/lupon/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'VAWC',
    path: '/vawc',
    icon: HeartHandshake,
    children: [
      { label: 'Cases', path: '/vawc/cases', icon: FileText },
      { label: 'Reports', path: '/vawc/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'BCPC',
    path: '/bcpc',
    icon: Shield,
    children: [
      { label: 'Cases', path: '/bcpc/cases', icon: FileText },
      { label: 'Reports', path: '/bcpc/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'Clearance',
    path: '/clearance',
    icon: FileText,
    children: [
      { label: 'Issued Certs', path: '/clearance/issued', icon: FileText },
      { label: 'Revenue & Collections', path: '/clearance/revenue', icon: Receipt },
    ],
  },
  { label: 'Events', path: '/admin/events', icon: CalendarDays },
  { label: 'Archive', path: '/admin/archive', icon: Archive },
]

// 3. Kapitana / Barangay Official Navigation
const officialNav: NavItem[] = [
  { label: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Resident Records', path: '/residents', icon: UserCheck },
  {
    label: 'Blotter Overview',
    path: '/blotter',
    icon: ShieldAlert,
    children: [
      { label: 'Records', path: '/blotter/records', icon: FileText },
      { label: 'Docket Books', path: '/blotter/docket', icon: ScrollText },
      { label: 'Reports', path: '/blotter/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'Lupon Conciliation',
    path: '/lupon',
    icon: Scale,
    children: [
      { label: 'Cases', path: '/lupon/cases', icon: FileText },
      { label: 'Reports', path: '/lupon/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'VAWC Overview',
    path: '/vawc',
    icon: HeartHandshake,
    children: [
      { label: 'Cases', path: '/vawc/cases', icon: FileText },
      { label: 'Reports', path: '/vawc/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'BCPC Protection',
    path: '/bcpc',
    icon: Shield,
    children: [
      { label: 'Cases', path: '/bcpc/cases', icon: FileText },
      { label: 'Reports', path: '/bcpc/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'Clearance & Revenue',
    path: '/clearance',
    icon: FileText,
    children: [
      { label: 'Issued Certificates', path: '/clearance/issued', icon: FileText },
      { label: 'Revenue & Collection', path: '/clearance/revenue', icon: Receipt },
    ],
  },
  {
    label: 'FTJS Overview',
    path: '/ftjs',
    icon: Briefcase,
    children: [
      { label: 'FTJS Dashboard', path: '/ftjs/dashboard', icon: LayoutDashboard },
      { label: 'Requests', path: '/ftjs/requests', icon: FileText },
      { label: 'Reports', path: '/ftjs/reports', icon: ChartNoAxesCombined },
      { label: 'Archive Vault', path: '/ftjs/archive', icon: Archive },
    ],
  },
  { label: 'Audit Logs', path: '/audit-logs', icon: History },
  { label: 'Settings', path: '/settings', icon: Settings },
]

// 4. Blotter Officer Navigation
const blotterNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'File New Complaint', path: '/blotter/entry', icon: FilePlus2 },
  { label: 'Blotter Desk Records', path: '/blotter', icon: ShieldAlert },
  { label: 'Blotter Reports', path: '/blotter/reports', icon: ChartNoAxesCombined },
  { label: 'Resident Directory', path: '/residents', icon: UserCheck },
  { label: 'Archive Cases', path: '/archive', icon: Archive },
]

// 5. Lupon Tagapamayapa Navigation
const luponNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Resident Directory', path: '/residents', icon: UserCheck },
  { label: 'File Lupon Case', path: '/lupon/entry', icon: FilePlus2 },
  { label: 'Lupon Case Records', path: '/lupon/cases', icon: FileText },
  { label: 'Conciliation Reports', path: '/lupon/reports', icon: ChartNoAxesCombined },
  { label: 'Archived Cases', path: '/archive', icon: Archive },
]

// 6. VAWC Officer Navigation
const vawcNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Resident Directory', path: '/residents', icon: UserCheck },
  { label: 'New VAWC Entry', path: '/vawc/entry', icon: FilePlus2 },
  { label: 'VAWC Case Files', path: '/vawc/cases', icon: FileText },
  { label: 'VAWC Reports', path: '/vawc/reports', icon: ChartNoAxesCombined },
  { label: 'Archived Cases', path: '/archive', icon: Archive },
]

// 7. BCPC Officer Navigation
const bcpcNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Resident Directory', path: '/residents', icon: UserCheck },
  { label: 'New BCPC Case', path: '/bcpc/entry', icon: FilePlus2 },
  { label: 'Child Protection Cases', path: '/bcpc/cases', icon: FileText },
  { label: 'BCPC Reports', path: '/bcpc/reports', icon: ChartNoAxesCombined },
  { label: 'Archived Cases', path: '/archive', icon: Archive },
]

// 8. Clearance Officer Navigation
const clearanceNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Issue Certificate', path: '/clearance/issue', icon: FilePlus2 },
  { label: 'Issued Certificates', path: '/clearance/issued', icon: FileText },
  { label: 'Revenue & Collections', path: '/clearance/revenue', icon: Receipt },
  { label: 'Archived Records', path: '/archive', icon: Archive },
]

// 9. First-Time Job Seeker (FTJS) Navigation
const ftjsNav: NavItem[] = [
  { label: 'FTJS Dashboard', path: '/ftjs/dashboard', icon: LayoutDashboard },
  { label: 'Issuance Form', path: '/ftjs/issuance', icon: FilePlus2 },
  { label: 'FTJS Management', path: '/ftjs/requests', icon: FileText },
  { label: 'FTJS Reports', path: '/ftjs/reports', icon: ChartNoAxesCombined },
  { label: 'Archive Vault', path: '/ftjs/archive', icon: Archive },
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
