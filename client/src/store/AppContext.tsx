import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserRole, MineSite, GovernanceObject, Alert } from '../types';
import { demoApi, mapTaskToGovObject, DemoPipeline } from '../services/demoApi';

// Role → user mapping mirrors shared/data/users.json so the desktop role
// switcher acts as the same people the mobile app shows.
const ROLE_USER_NAMES: Record<UserRole, string> = {
  'Mine Manager': 'S. Singh',
  'Mine Safety Officer': 'Ram Singh',
  'Mine Engineer': 'P. Verma',
  'Area Safety Officer': 'R. Sharma',
  'Corporate Management': 'L. Gupta',
  'Regulatory Authority': 'M. Inspector',
};

interface AppState {
  role: UserRole;
  userName: string;
  sites: MineSite[];
  govObjects: GovernanceObject[];
  alerts: Alert[];
  pipeline: DemoPipeline;
  lastSync: Date;
  loading: boolean;
}

interface AppContextType {
  state: AppState;
  setRole: (role: UserRole, userName: string) => void;
  updateGovObjectStatus: (id: string, newStatus: GovernanceObject['status']) => void;
  rejectEvidence: (objectId: string, evidenceId: string, reason: string) => void;
  approveObject: (objectId: string) => void;
  resubmitObject: (objectId: string) => void;
  addAlert: (alert: Alert) => void;
  resetDemo: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function mapStateResponse(data: Awaited<ReturnType<typeof demoApi.getState>>) {
  return {
    sites: (data.sites as unknown) as MineSite[],
    govObjects: data.tasks.map(mapTaskToGovObject),
    alerts: data.alerts,
    pipeline: data.pipeline,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    role: 'Area Safety Officer', // demo presenter acts as the independent verifier
    userName: ROLE_USER_NAMES['Area Safety Officer'],
    sites: [],
    govObjects: [],
    alerts: [],
    pipeline: { alerts: [] },
    lastSync: new Date(),
    loading: true,
  });

  const applyDemoState = useCallback((data: Awaited<ReturnType<typeof demoApi.getState>>) => {
    const mapped = mapStateResponse(data);
    setState((prev) => ({
      ...prev,
      ...mapped,
      lastSync: new Date(),
      loading: false,
    }));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await demoApi.getState();
      applyDemoState(data);
    } catch {
      // demo server not reachable — keep last known state
    }
  }, [applyDemoState]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 3000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const setRole = (role: UserRole, userName: string) => {
    setState((prev) => ({ ...prev, role, userName }));
  };

  const updateGovObjectStatus = (id: string, newStatus: GovernanceObject['status']) => {
    setState((prev) => ({
      ...prev,
      govObjects: prev.govObjects.map((obj) =>
        obj.id === id ? { ...obj, status: newStatus } : obj,
      ),
    }));
  };

  const rejectEvidence = (objectId: string, evidenceId: string, reason: string) => {
    demoApi.rejectEvidence(objectId, evidenceId, reason).then(applyDemoState).catch(() => undefined);
  };

  const approveObject = (objectId: string) => {
    demoApi.approve(objectId).then(applyDemoState).catch(() => undefined);
  };

  const resubmitObject = (objectId: string) => {
    demoApi.resubmit(objectId).then(applyDemoState).catch(() => undefined);
  };

  const addAlert = (alert: Alert) => {
    setState((prev) => ({
      ...prev,
      alerts: [alert, ...prev.alerts].slice(0, 50),
    }));
  };

  const resetDemo = async () => {
    const data = await demoApi.reset();
    applyDemoState(data);
  };

  return (
    <AppContext.Provider
      value={{
        state,
        setRole,
        updateGovObjectStatus,
        rejectEvidence,
        approveObject,
        resubmitObject,
        addAlert,
        resetDemo,
        refresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export { ROLE_USER_NAMES };