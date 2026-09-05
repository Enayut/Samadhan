import type { Task } from '../types';
import { mapTaskToMobile } from '../services/demoApi';

// Fallback task list used only when the demo server (client/server.ts) is NOT
// reachable — e.g. running the mobile app standalone. In the real demo the
// mobile app fetches the same hardcoded JSON (seeded from shared/data/*.json)
// from the demo API, so both frontends share one source of truth.
//
// The canonical data lives in shared/data/tasks.json. TASK-001 (the DGMS
// reversing-alert hero task) is generated server-side when the AI extraction is
// confirmed, so it intentionally is not part of this fallback.
import fallbackTasksData from '../../../shared/data/tasks.json';

export const INITIAL_TASKS: Task[] = (fallbackTasksData as unknown[]).map(
  (raw) => mapTaskToMobile(raw as Parameters<typeof mapTaskToMobile>[0]),
);

export const MINE_INFO = {
  name: 'MINE-001 · OC',
  colliery: 'Dhanbad Colliery No. 4',
  area: 'Kusmunda Area · South Eastern Division',
  shift: '3rd shift active',
  shiftDetails: 'Shift III (22:00 - 06:00 hrs)',
  activeStaffCount: 142,
  user: {
    name: 'Ram Singh',
    shortName: 'Ram',
    designation: 'Mine Safety Officer (MSO)',
    id: 'MSO-402',
    dgmsCertNo: 'DGMS/FMC/2019/8821',
    avatar: 'RS',
  },
};