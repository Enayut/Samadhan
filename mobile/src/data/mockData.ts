import type { Task } from '../types';

// Fallback task list used only when the demo server (client/server.ts) is NOT
// reachable — e.g. running the mobile app standalone. In the demo the mobile
// app fetches the same shared JSON from the demo API, so both frontends share
// one source of truth.
//
// The canonical data lives in shared/data/tasks.json. PROPOSED tasks are never
// shown on mobile — the manager must publish them first (this fallback list
// mirrors that server-side scoping).
import fallbackTasksData from '../../../shared/data/tasks.json';
import { mapTaskToMobile } from '../services/demoApi';

const MOBILE_MINE_ID = 'MINE-001';
const MOBILE_USER_ID = 'u-ram';

type RawTask = Record<string, unknown> & { mineId?: string; status?: string; owner?: { id?: string } };

export const INITIAL_TASKS: Task[] = (fallbackTasksData as unknown as RawTask[])
  .filter(
    (raw) =>
      raw.mineId === MOBILE_MINE_ID &&
      raw.status !== 'PROPOSED' &&
      (raw.owner as { id?: string } | undefined)?.id === MOBILE_USER_ID,
  )
  .map((raw) => mapTaskToMobile(raw as unknown as Parameters<typeof mapTaskToMobile>[0]));

export const MINE_INFO = {
  name: 'Piparwar OCP',
  colliery: 'Piparwar Opencast Project',
  area: 'Piparwar Area · North Karanpura Coalfield',
  shift: 'General shift active',
  shiftDetails: 'Shift I (06:00 - 14:00 hrs)',
  activeStaffCount: 912, // indicative demo figure
  user: {
    name: 'Ram Singh',
    shortName: 'Ram',
    designation: 'Mine Safety Officer (MSO)',
    id: 'MSO-402',
    dgmsCertNo: 'DGMS/FMC/2019/8821',
    avatar: 'RS',
  },
};
