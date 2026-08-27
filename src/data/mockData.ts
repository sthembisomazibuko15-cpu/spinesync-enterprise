export type Worker = {
  id: string
  employeeNo: string
  name: string
  operation: string
  department: string
  jobTitle: string
  status: 'Fit' | 'Restricted' | 'Rehab' | 'Due'
}

export const workers: Worker[] = [
  { id: '1', employeeNo: 'EMP-1001', name: 'Thabo Mokoena', operation: 'Northern Platinum', department: 'Underground', jobTitle: 'Rock Drill Operator', status: 'Fit' },
  { id: '2', employeeNo: 'EMP-1002', name: 'Lerato Nkuna', operation: 'Northern Platinum', department: 'Engineering', jobTitle: 'Fitter', status: 'Restricted' },
  { id: '3', employeeNo: 'EMP-1003', name: 'Kabelo Matlala', operation: 'Chrome Ridge', department: 'Processing', jobTitle: 'Plant Operator', status: 'Rehab' },
  { id: '4', employeeNo: 'EMP-1004', name: 'Nomsa Dlamini', operation: 'Chrome Ridge', department: 'Open Pit', jobTitle: 'Haul Truck Operator', status: 'Due' }
]

export const recentAssessments = [
  { worker: 'Thabo Mokoena', type: 'FCE', score: '92%', outcome: 'Fit', date: '26 Aug 2026' },
  { worker: 'Lerato Nkuna', type: 'MSK Screening', score: '68%', outcome: 'Restricted', date: '25 Aug 2026' },
  { worker: 'Kabelo Matlala', type: 'RTW Review', score: '74%', outcome: 'Rehab', date: '24 Aug 2026' }
]
