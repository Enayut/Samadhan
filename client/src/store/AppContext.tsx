import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Alert, MineSite, ObligationRule, Task } from '../../../shared/demo/types';
import { demoApi, DemoStateResponse } from '../services/demoApi';

// The desktop has exactly two working personas + a monitor mode:
// - Area Manager          → reviews requirements, publishes obligations, monitors all five mines
// - Regulatory Official   → ingests documents, independently verifies evidence (never the owner)
export type Persona = 'AREA_MANAGER' | 'REGULATORY_OFFICIAL';

export const PERSONA_LABEL: Record<Persona, string> = {
  AREA_MANAGER: 'Area Manager — North Karanpura',
  REGULATORY_OFFICIAL: 'Regulatory Official — Area oversight',
};

interface AppState {
  persona: Persona;
  sites: MineSite[];
  tasks: Task[];
  alerts: Alert[];
  rules: ObligationRule[];
  pipeline: DemoStateResponse['pipeline'];
  audit: DemoStateResponse['audit'];
  lastSync: Date;
  loading: boolean;
}

interface AppContextType {
  state: AppState;
  persona: Persona;
  setPersona: (persona: Persona) => void;
  // document pipeline
  processDocument: (documentId: string) => Promise<void>;
  determineApplicability: (documentId: string) => Promise<void>;
  // manager
  publishTask: (taskId: string, adjustments?: Record<string, unknown>) => Promise<void>;
  // verification
  rejectEvidence: (taskId: string, evidenceId: string, reason: string) => Promise<void>;
  approveTask: (taskId: string) => Promise<void>;
  // scheduler (recurring compliance)
  schedulerTick: () => Promise<void>;
  resetDemo: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    persona: 'AREA_MANAGER', // demo opens on the area manager's monitor
    sites: [],
    tasks: [],
    alerts: [],
    rules: [],
    pipeline: { documents: [] },
    audit: [],
    lastSync: new Date(),
    loading: true,
  });

  const applyDemoState = useCallback((data: DemoStateResponse) => {
    setState((prev) => ({
      ...prev,
      sites: data.sites ?? [],
      tasks: data.tasks ?? [],
      alerts: data.alerts ?? [],
      rules: data.rules ?? [],
      pipeline: data.pipeline ?? { documents: [] },
      audit: data.audit ?? [],
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

  const setPersona = (persona: Persona) => setState((prev) => ({ ...prev, persona }));

  const processDocument = useCallback(
    async (documentId: string) => {
      const data = await demoApi.processDocument(documentId);
      applyDemoState(data);
    },
    [applyDemoState],
  );

  const determineApplicability = useCallback(
    async (documentId: string) => {
      const data = await demoApi.determineApplicability(documentId);
      applyDemoState(data);
    },
    [applyDemoState],
  );

  const publishTask = useCallback(
    async (taskId: string, adjustments?: Record<string, unknown>) => {
      const data = await demoApi.publishTask(taskId, adjustments);
      applyDemoState(data);
    },
    [applyDemoState],
  );

  const rejectEvidence = useCallback(
    async (taskId: string, evidenceId: string, reason: string) => {
      const data = await demoApi.rejectEvidence(taskId, evidenceId, reason);
      applyDemoState(data);
    },
    [applyDemoState],
  );

  const approveTask = useCallback(
    async (taskId: string) => {
      const data = await demoApi.approve(taskId);
      applyDemoState(data);
    },
    [applyDemoState],
  );

  const schedulerTick = useCallback(async () => {
    const data = await demoApi.schedulerTick();
    applyDemoState(data.state);
  }, [applyDemoState]);

  const resetDemo = useCallback(async () => {
    const data = await demoApi.reset();
    applyDemoState(data);
  }, [applyDemoState]);

  const persona = state.persona;

  return (
    <AppContext.Provider
      value={{
        state,
        persona,
        setPersona,
        processDocument,
        determineApplicability,
        publishTask,
        rejectEvidence,
        approveTask,
        schedulerTick,
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
