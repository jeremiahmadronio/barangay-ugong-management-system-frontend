export interface User {
  id: string
  name: string
  email: string
  role: string
  accountType: string
  departments: string[]
  status: 'Active' | 'Inactive' | 'Locked'
  lastLogin: string
}

export const USERS: User[] = [
  {
    id: '1',
    name: 'Silverio Canlas',
    email: 'silverio@gmail.com',
    role: 'Desk Officer',
    accountType: 'System User',
    departments: ['BCPC'],
    status: 'Active',
    lastLogin: 'Never',
  },
  {
    id: '2',
    name: 'Jana Defensor',
    email: 'jana.defensor@gmail.com',
    role: 'Admin',
    accountType: 'Admin',
    departments: ['Clearance', 'Kapitana', 'Lupon'],
    status: 'Active',
    lastLogin: 'Jul 23, 22:19',
  },
  {
    id: '3',
    name: 'Marco Villanueva',
    email: 'marco.v@gmail.com',
    role: 'Desk Officer',
    accountType: 'System User',
    departments: ['Blotter', 'Lupon'],
    status: 'Inactive',
    lastLogin: 'Jul 10, 09:02',
  },
  {
    id: '4',
    name: 'Liza Manalo',
    email: 'liza.manalo@gmail.com',
    role: 'Viewer',
    accountType: 'System User',
    departments: ['Reports'],
    status: 'Locked',
    lastLogin: 'Jun 28, 14:41',
  },
  {
    id: '5',
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@barangay.gov.ph',
    role: 'Desk Officer',
    accountType: 'System User',
    departments: ['VAWC'],
    status: 'Active',
    lastLogin: 'Jul 26, 12:00',
  },
]
