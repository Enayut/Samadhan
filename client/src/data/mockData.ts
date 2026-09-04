import { MineSite, GovernanceObject, Alert } from '../types';
import { subDays, addDays, formatISO } from 'date-fns';

const today = new Date();

export const MOCK_SITES: MineSite[] = [
  { id: 'MINE-001', name: 'Gevra OC', subsidiary: 'SECL', district: 'Korba', lat: 22.33, lng: 82.55 },
  { id: 'MINE-002', name: 'Kusmunda', subsidiary: 'SECL', district: 'Korba', lat: 22.35, lng: 82.60 },
  { id: 'MINE-003', name: 'Dipka', subsidiary: 'SECL', district: 'Korba', lat: 22.31, lng: 82.51 },
  { id: 'MINE-004', name: 'Jharia (Problem Mine)', subsidiary: 'BCCL', district: 'Dhanbad', lat: 23.75, lng: 86.42 },
  { id: 'MINE-005', name: 'Talcher', subsidiary: 'MCL', district: 'Angul', lat: 20.95, lng: 85.22 },
  { id: 'MINE-006', name: 'Singrauli', subsidiary: 'NCL', district: 'Singrauli', lat: 24.20, lng: 82.66 },
  { id: 'MINE-007', name: 'Ramagundam', subsidiary: 'WCL', district: 'Peddapalli', lat: 18.75, lng: 79.48 },
];

export const MOCK_GOVERNANCE_OBJECTS: GovernanceObject[] = [
  {
    id: 'GOV-S-001',
    domain: 'Safety',
    title: 'High-wall structural integrity check',
    source: 'DGMS/2026/SA-041',
    severity: 'High',
    mineId: 'MINE-001',
    owner: { name: 'A. Kumar', role: 'Mine Safety Officer' },
    deadline: formatISO(addDays(today, 2)),
    status: 'In Progress',
    evidence_checklist: [
      { id: 'ev-1', title: 'Drone Survey Report', status: 'Missing' },
      { id: 'ev-2', title: 'Geotechnical Assessment', status: 'Present', timestamp: formatISO(subDays(today, 1)) },
    ],
    verifier: { name: 'R. Sharma', role: 'Area Safety Officer' },
    created_at: formatISO(subDays(today, 5)),
    escalations: []
  },
  {
    id: 'GOV-S-002',
    domain: 'Safety',
    title: 'Deploy active strata monitoring',
    source: 'DGMS/2026/SA-041',
    severity: 'Critical',
    mineId: 'MINE-004', // The problem mine
    owner: { name: 'S. Singh', role: 'Mine Manager' },
    deadline: formatISO(subDays(today, 1)), // Overdue
    status: 'Escalated',
    escalation_level: 'L2',
    evidence_checklist: [
      { id: 'ev-3', title: 'Sensor Deployment Log', status: 'Missing' },
      { id: 'ev-4', title: 'Real-time telemetry link', status: 'Flagged', rejectionReason: 'Link unresponsive during test' },
    ],
    verifier: { name: 'M. Patel', role: 'Area Safety Officer' },
    created_at: formatISO(subDays(today, 7)),
    escalations: [
      { timestamp: formatISO(subDays(today, 1)), level: 'L1', notified: 'Area General Manager' },
      { timestamp: formatISO(today), level: 'L2', notified: 'Director Technical (Operations)' }
    ]
  },
  {
    id: 'GOV-E-001',
    domain: 'Environment',
    title: 'Submit Monthly PM10 Sensor Data',
    source: 'EC condition breach alert',
    severity: 'Medium',
    mineId: 'MINE-002',
    owner: { name: 'P. Verma', role: 'Mine Engineer' },
    deadline: formatISO(addDays(today, 5)),
    status: 'Submitted',
    evidence_checklist: [
      { id: 'ev-5', title: 'AQI Output CSV', status: 'Present', timestamp: formatISO(subDays(today, 1)) }
    ],
    verifier: { name: 'K. Iyer', role: 'Area Environment Officer' },
    created_at: formatISO(subDays(today, 10)),
    escalations: []
  },
  {
    id: 'GOV-L-001',
    domain: 'Labour',
    title: 'Update Medical Fitness Certificates',
    source: 'Competency certificate lapses scan',
    severity: 'High',
    mineId: 'MINE-003',
    owner: { name: 'N. Das', role: 'Mine Manager' },
    deadline: formatISO(subDays(today, 5)),
    status: 'Closed',
    evidence_checklist: [
      { id: 'ev-6', title: 'Form O copies', status: 'Present', timestamp: formatISO(subDays(today, 6)) }
    ],
    verifier: { name: 'L. Gupta', role: 'Corporate HR' },
    created_at: formatISO(subDays(today, 20)),
    closed_at: formatISO(subDays(today, 5)),
    closure_certificate: {
      closedAt: formatISO(subDays(today, 5)),
      hash: '0x8f2a...391e',
      ownerName: 'N. Das',
      verifierName: 'L. Gupta'
    },
    escalations: []
  },
  {
    id: 'GOV-C-001',
    domain: 'Contractor',
    title: 'Renew Heavy Earth Moving Machinery (HEMM) Licence',
    source: 'Contractor licence expiry warning',
    severity: 'High',
    mineId: 'MINE-005',
    owner: { name: 'T. Reddy', role: 'Mine Engineer' },
    deadline: formatISO(addDays(today, 10)),
    status: 'In Progress',
    evidence_checklist: [
      { id: 'ev-7', title: 'Valid RTO Registration', status: 'Missing' },
      { id: 'ev-8', title: 'Insurance Policy Copy', status: 'Missing' }
    ],
    verifier: { name: 'M. Patel', role: 'Area Safety Officer' },
    created_at: formatISO(subDays(today, 2)),
    escalations: []
  },
  {
    id: 'GOV-P-001',
    domain: 'Production',
    title: 'Submit Weekly Overburden Removal (OBR) Data',
    source: 'Missing shift reports',
    severity: 'Medium',
    mineId: 'MINE-006',
    owner: { name: 'A. Kumar', role: 'Mine Safety Officer' },
    deadline: formatISO(addDays(today, 1)),
    status: 'Submitted',
    evidence_checklist: [
      { id: 'ev-9', title: 'OBR Survey Report', status: 'Present', timestamp: formatISO(subDays(today, 1)), geoTag: '24.20, 82.66' }
    ],
    verifier: { name: 'R. Sharma', role: 'Area Safety Officer' },
    created_at: formatISO(subDays(today, 5)),
    escalations: []
  }
];

export const INITIAL_ALERTS: Alert[] = [
  { id: 'al-1', timestamp: formatISO(subDays(today, 2)), type: 'critical', message: 'DGMS/2026/SA-041 safety alert issued.', siteId: 'MINE-004' },
  { id: 'al-2', timestamp: formatISO(subDays(today, 1)), type: 'warning', message: 'MINE-004 escalation level increased to L2 due to non-compliance.' },
  { id: 'al-3', timestamp: formatISO(today), type: 'info', message: '60/61 mines acknowledged DGMS alert. 1 escalated.' },
];
