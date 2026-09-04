import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, MineSite, GovernanceObject, Alert } from '../types';
import { MOCK_SITES, MOCK_GOVERNANCE_OBJECTS, INITIAL_ALERTS } from '../data/mockData';
import { formatISO } from 'date-fns';

interface AppState {
  role: UserRole;
  userName: string;
  sites: MineSite[];
  govObjects: GovernanceObject[];
  alerts: Alert[];
  lastSync: Date;
}

interface AppContextType {
  state: AppState;
  setRole: (role: UserRole, userName: string) => void;
  updateGovObjectStatus: (id: string, newStatus: GovernanceObject['status']) => void;
  rejectEvidence: (objectId: string, evidenceId: string, reason: string) => void;
  approveObject: (objectId: string) => void;
  resubmitObject: (objectId: string) => void;
  addAlert: (alert: Alert) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    role: 'Mine Manager', // default to allow viewing
    userName: 'S. Singh',
    sites: MOCK_SITES,
    govObjects: MOCK_GOVERNANCE_OBJECTS,
    alerts: INITIAL_ALERTS,
    lastSync: new Date()
  });

  const setRole = (role: UserRole, userName: string) => {
    setState(prev => ({ ...prev, role, userName }));
  };

  const updateGovObjectStatus = (id: string, newStatus: GovernanceObject['status']) => {
    setState(prev => ({
      ...prev,
      govObjects: prev.govObjects.map(obj => obj.id === id ? { ...obj, status: newStatus } : obj)
    }));
  };

  const rejectEvidence = (objectId: string, evidenceId: string, reason: string) => {
    setState(prev => ({
      ...prev,
      govObjects: prev.govObjects.map(obj => {
        if (obj.id === objectId) {
          return {
            ...obj,
            status: 'In Progress', // Reopens the task
            evidence_checklist: obj.evidence_checklist.map(ev => 
              ev.id === evidenceId ? { ...ev, status: 'Flagged', rejectionReason: reason } : ev
            )
          };
        }
        return obj;
      })
    }));
  };

  const resubmitObject = (objectId: string) => {
    setState(prev => ({
      ...prev,
      govObjects: prev.govObjects.map(obj => {
        if (obj.id === objectId) {
          return {
            ...obj,
            status: 'Submitted',
            evidence_checklist: obj.evidence_checklist.map(ev => 
              ev.status === 'Flagged' || ev.status === 'Missing' ? { ...ev, status: 'Present', timestamp: formatISO(new Date()), rejectionReason: undefined } : ev
            )
          };
        }
        return obj;
      })
    }));
  };

  const approveObject = (objectId: string) => {
    setState(prev => ({
      ...prev,
      govObjects: prev.govObjects.map(obj => {
        if (obj.id === objectId) {
          return {
            ...obj,
            status: 'Closed',
            closed_at: formatISO(new Date()),
            closure_certificate: {
              closedAt: formatISO(new Date()),
              hash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
              ownerName: obj.owner.name,
              verifierName: state.userName
            }
          };
        }
        return obj;
      })
    }));
  };

  const addAlert = (alert: Alert) => {
    setState(prev => ({
      ...prev,
      alerts: [alert, ...prev.alerts].slice(0, 50)
    }));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => ({
        ...prev,
        lastSync: new Date()
      }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <AppContext.Provider value={{ state, setRole, updateGovObjectStatus, rejectEvidence, approveObject, resubmitObject, addAlert }}>
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
