// Live bridge between the shared demo state (one source of truth) and the
// existing Piparwar GIS module. The GIS components are unchanged — this adapter
// derives their MineGovernanceStatus input from the actual tasks/evidence in
// shared state, so the map always reflects what the workflow is doing.
//
// NOTHING here is a second compliance engine: every count, violation and zone
// state below is computed from the same Task objects the dashboard shows.

import { useMemo } from 'react';
import type { MineGovernanceStatus, ComplianceViolation, ComplianceZoneState } from './types';
import type { Task, MineSite } from '../../../shared/demo/types';
import { MINE_001_GOVERNANCE } from './data/mine001';

// Zone geometry IDs come from the GIS module's own pitZoning dataset. The
// obligation→zone mapping is deterministic per obligation family.
const ZONE_FOR_OBLIGATION: Record<string, string> = {
  'OBL-SLOPE-WEEKLY': 'ZONE-PIT-ACTIVE',
  'OBL-SLOPE-GEOTECH-MONTHLY': 'ZONE-PIT-ACTIVE',
  'OBL-STRATA-RESPONSE': 'ZONE-PIT-ACTIVE',
  'OBL-DUST-WEEKLY': 'ZONE-OB-NORTH',
  'OBL-CLRA-RENEWAL': 'ZONE-OB-SOUTH',
};

// Representative coordinates per zone (used to place task-derived pins on the
// existing 2D/3D maps). Taken from the GIS module's zone polygons.
const ZONE_COORDS: Record<string, [number, number]> = {
  'ZONE-PIT-ACTIVE': [23.6948, 85.0592],
  'ZONE-OB-NORTH': [23.7015, 85.0565],
  'ZONE-OB-SOUTH': [23.6815, 85.0682],
  'ZONE-WATER-SUMP': [23.6863, 85.07],
};

const SEVERITY_MAP: Record<string, ComplianceViolation['severity']> = {
  Critical: 'CRITICAL',
  High: 'HIGH',
  Medium: 'MODERATE',
  Low: 'LOW',
};

const zoneOf = (task: Task): string => {
  if (task.obligationRef && ZONE_FOR_OBLIGATION[task.obligationRef]) {
    return ZONE_FOR_OBLIGATION[task.obligationRef];
  }
  if (task.domain === 'ENVIRONMENT') return 'ZONE-WATER-SUMP';
  return 'ZONE-PIT-ACTIVE';
};

const dayOf = (iso: string): string => (iso || '').slice(0, 10) || '—';

/**
 * Derives the GIS governance overlay for MINE-001 from the live task state.
 * Returns null while the state has not loaded.
 */
export function useGisGovernance(
  tasks: Task[],
  mine: MineSite | undefined,
): MineGovernanceStatus | null {
  return useMemo(() => {
    if (!mine || mine.id !== 'MINE-001') return null;

    // Only obligations actually published to the field appear on the map.
    const live = tasks.filter((t) => t.mineId === 'MINE-001' && t.status !== 'PROPOSED' && t.status !== 'VERIFIED');
    const overdue = live.filter((t) => t.status === 'OVERDUE' || t.status === 'ESCALATED');

    const violations: ComplianceViolation[] = live.map((t) => {
      const zone = zoneOf(t);
      const status: ComplianceViolation['status'] =
        t.status === 'OVERDUE' || t.status === 'ESCALATED'
          ? 'OVERDUE'
          : t.status === 'AWAITING_VERIFICATION'
            ? 'INVESTIGATING'
            : 'OPEN';
      return {
        id: t.id,
        statutoryCode: t.sourceCitation,
        category: t.domain === 'ENVIRONMENT' ? 'ENVIRONMENTAL_DUST' : 'SLOPE_STABILITY',
        severity: SEVERITY_MAP[t.severity] ?? 'MODERATE',
        title: t.shortTitle || t.title,
        description:
          (t.remediationNotes && t.remediationNotes.trim().length > 0
            ? t.remediationNotes
            : `Field action with ${t.ownerLabel}. Evidence: ${t.evidenceItems
                .map((ev) => ev.title)
                .join('; ')}.`) +
          (t.status === 'REJECTED' && t.rejectionReason ? ` Correction required: ${t.rejectionReason}` : ''),
        identifiedDate: dayOf(t.createdAt),
        dueDate: dayOf(t.deadline),
        status,
        statutoryAuthority: 'Directorate General of Mines Safety (DGMS), Ranchi Region',
        locationCoordinates: ZONE_COORDS[zone],
        locationDescription: `${t.shiftInfo} · ${zone.replace('ZONE-', '')}`,
        isApplicationData: true,
      };
    });

    // Zone states derived from where live obligations sit + freshest field evidence.
    const zoneIds = ['ZONE-PIT-ACTIVE', 'ZONE-OB-NORTH', 'ZONE-OB-SOUTH', 'ZONE-WATER-SUMP'];
    const zoneStates: Record<string, ComplianceZoneState> = {};
    for (const zoneId of zoneIds) {
      const zoneTasks = live.filter((t) => zoneOf(t) === zoneId);
      const evidenceTimes = zoneTasks
        .flatMap((t) => t.evidenceItems.map((ev) => ev.metadata?.timestamp))
        .filter((x): x is string => !!x)
        .sort();
      zoneStates[zoneId] = {
        zoneId,
        name: MINE_001_GOVERNANCE.zoneStates[zoneId]?.name ?? zoneId,
        type: MINE_001_GOVERNANCE.zoneStates[zoneId]?.type ?? 'ACTIVE_PIT_FACE',
        riskLevel: zoneTasks.some((t) => t.status === 'OVERDUE' || t.status === 'ESCALATED')
          ? 'CRITICAL'
          : zoneTasks.length > 0
            ? 'MODERATE'
            : 'LOW',
        openViolationsCount: zoneTasks.length,
        lastInspectedAt: evidenceTimes.at(-1) ?? 'No field evidence yet',
        inspectorOfficer: zoneTasks[0]?.owner.name ?? '—',
      };
    }

    const governanceScore = Math.max(
      20,
      100 - live.length * 8 - overdue.length * 20 - violations.filter((v) => v.status === 'OPEN').length * 4,
    );

    return {
      mineId: 'MINE-001',
      riskLevel: overdue.length > 0 ? 'CRITICAL' : live.length > 0 ? 'HIGH' : 'LOW',
      governanceScore,
      openViolationsCount: live.length,
      overdueTasksCount: overdue.length,
      escalationState: overdue.some((t) => t.status === 'ESCALATED')
        ? 'ESCALATED_TO_DGMS_NODAL'
        : 'NORMAL_OPERATIONAL_MONITORING',
      lastAuditDate: dayOf(
        tasks
          .filter((t) => t.mineId === 'MINE-001' && t.status === 'VERIFIED' && t.verifiedAt)
          .map((t) => t.verifiedAt as string)
          .sort()
          .at(-1) ?? '',
      ) || 'None in demo window',
      nextScheduledStatutoryInspection: 'Per DGMS approved mining plan schedule',
      violations,
      zoneStates,
      provenance: {
        source: 'SAMAADHAN shared compliance state (live task workflow)',
        system: 'SAMAADHAN Enterprise Compliance Engine',
        auditCycle: 'Continuous — derived from published obligations and field evidence',
        disclaimer:
          'Application-determined governance state derived from the live workflow (publish → field evidence → verification). Not geographic ground truth; telemetry layers remain explicitly SIMULATED.',
      },
    };
  }, [tasks, mine]);
}
