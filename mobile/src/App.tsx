import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Task, ScreenId, SyncStatusType, QueueFilter, DomainType } from './types';
import { INITIAL_TASKS } from './data/mockData';
import { demoApi, mapTaskToMobile } from './services/demoApi';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { M0Home } from './components/M0Home';
import { M1Queue } from './components/M1Queue';
import { M2EvidenceCapture } from './components/M2EvidenceCapture';
import { M3ObservationIntake } from './components/M3ObservationIntake';
import { ProfileScreen } from './components/ProfileScreen';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('M0');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('ALL');
  const [queueDomainFilter, setQueueDomainFilter] = useState<DomainType | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>('synced');
  const [isM3Open, setIsM3Open] = useState(false);

  // Auto-select the first visible task (DO THIS NEXT hero) when tasks arrive.
  useEffect(() => {
    if (selectedTaskId && tasks.some((t) => t.id === selectedTaskId)) return;
    const first =
      tasks.find((t) => t.status === 'REJECTED') ??
      tasks.find((t) => t.isCriticalDoThisNext && t.status !== 'VERIFIED') ??
      tasks.find((t) => t.status !== 'VERIFIED');
    if (first) setSelectedTaskId(first.id);
  }, [tasks, selectedTaskId]);

  // Tasks that exist only on this device (e.g. field observations created in
  // M3) must survive server polls, so we keep them separately and merge.
  const [localOnlyTasks, setLocalOnlyTasks] = useState<Task[]>([]);

  // ---------------------------------------------------------------------------
  // Shared demo state sync — the demo server is the SINGLE source of truth.
  // Mobile-scoped endpoint: only Piparwar tasks owned by this officer; PROPOSED
  // tasks never appear until the manager publishes. Polling + focus refetch keep
  // this app in lockstep with the desktop (publish/reject/approve appear here
  // automatically; start/submit appear on the desktop automatically).
  // ---------------------------------------------------------------------------
  const tasksRef = useRef<Task[]>(tasks);
  tasksRef.current = tasks;

  const loadFromServer = useCallback(async () => {
    try {
      const data = await demoApi.getState();
      const serverTasks = data.tasks.map(mapTaskToMobile);
      const localOnly = localOnlyTasks.filter(
        (t) => !serverTasks.some((st) => st.id === t.id),
      );
      setTasks([...serverTasks, ...localOnly]);
    } catch {
      // Demo server unreachable — keep the local fallback seed.
    }
  }, [localOnlyTasks]);

  useEffect(() => {
    loadFromServer();
    const timer = setInterval(loadFromServer, 2500);
    const onFocus = () => loadFromServer();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadFromServer]);

  // Selected task object for M2 — always derived from the freshest server sync,
  // so reopening the task shows the persisted evidence and status.
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  // Handler for navigation
  const handleNavigate = (screen: ScreenId) => {
    if (screen === 'M3') {
      setIsM3Open(true);
    } else {
      setCurrentScreen(screen);
    }
  };

  // Navigating to Queue with filter
  const handleNavigateToQueue = (filter: QueueFilter = 'ALL', domain?: DomainType) => {
    setQueueFilter(filter);
    setQueueDomainFilter(domain || null);
    setCurrentScreen('M1');
  };

  // Opening a task: "start" the field action (ASSIGNED → IN_PROGRESS on the
  // shared state) and enter evidence capture. Already-started tasks just open.
  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    const task = tasksRef.current.find((t) => t.id === taskId);
    if (task && task.status === 'ASSIGNED') {
      demoApi
        .startTask(taskId)
        .then(() => loadFromServer())
        .catch(() => undefined);
    }
    setCurrentScreen('M2');
  };

  // Update Task State (from M2 Evidence Capture)
  // Applies the change optimistically, then pushes it to the shared demo state.
  // The server decides the transition:
  //   • IN_PROGRESS / REJECTED + full evidence + valid notes → submit
  //     (AWAITING_VERIFICATION on desktop; REJECTED goes through resubmit)
  //   • everything else (photo attached, notes typed) → draft only, which
  //     persists evidence locally on the server so it survives navigation.
  const handleUpdateTask = (updatedTask: Task) => {
    const previous = tasksRef.current.find((t) => t.id === updatedTask.id);
    const wasAwaiting = previous?.status === 'AWAITING_VERIFICATION';

    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    );

    const payload = {
      evidenceItems: updatedTask.evidenceItems,
      remediationNotes: updatedTask.remediationNotes,
      formValues: updatedTask.formValues,
    };

    const wantsSubmit = updatedTask.status === 'AWAITING_VERIFICATION' && !wasAwaiting;
    const isResubmit = previous?.status === 'REJECTED';

    if (wantsSubmit && isResubmit) {
      demoApi
        .resubmitEvidence(updatedTask.id, payload.evidenceItems, payload.remediationNotes, payload.formValues)
        .then(() => loadFromServer())
        .catch(() => undefined);
    } else if (wantsSubmit) {
      demoApi
        .submitEvidence(updatedTask.id, payload.evidenceItems, payload.remediationNotes, payload.formValues)
        .then(() => loadFromServer())
        .catch(() => undefined);
    } else if (previous && previous.status !== 'VERIFIED' && previous.status !== 'PROPOSED') {
      // Draft: persist evidence/notes to the shared store without moving the
      // workflow. VERIFIED/PROPOSED tasks are read-only on mobile.
      demoApi
        .saveDraft(updatedTask.id, payload.evidenceItems, payload.remediationNotes, payload.formValues)
        .then(() => loadFromServer())
        .catch(() => undefined);
    }
  };

  // Create new task from M3 Observation Intake (local-only, preserved across polls)
  const handleCreateObservationTask = (newTask: Task) => {
    setLocalOnlyTasks((prev) => [newTask, ...prev]);
    setTasks((prev) => [newTask, ...prev]);
    setSelectedTaskId(newTask.id);
    setCurrentScreen('M1');
  };

  // Count active pending tasks for queue badge (rejections first)
  const pendingCount = tasks.filter(
    (t) => t.status === 'REJECTED' || (t.status !== 'VERIFIED' && t.status !== 'AWAITING_VERIFICATION'),
  ).length;

  return (
    <div className="min-h-screen bg-[#1A202C] flex items-center justify-center p-0 sm:p-4">
      {/* Handheld Device / Phone-like Viewport Container */}
      <div className="w-full sm:max-w-[430px] min-h-screen sm:min-h-[880px] bg-[#F7FAFC] text-[#1A202C] sm:rounded-[28px] sm:border-[8px] sm:border-[#2D3748] shadow-2xl relative flex flex-col overflow-hidden sm:ring-1 sm:ring-white/10">

        {/* Mobile Device Status Bar */}
        <div className="w-full bg-white px-5 pt-2 pb-1 flex items-center justify-between text-[11px] font-semibold text-[#1A202C] border-b border-[#E2E8F0]/60 select-none">
          <div className="font-bold tracking-tight">09:41</div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold px-1 rounded bg-slate-100 text-[#718096]">
              DGMS-NET
            </span>
            <Signal className="w-3 h-3 text-[#2D3748]" />
            <Wifi className="w-3 h-3 text-[#2D3748]" />
            <BatteryMedium className="w-4 h-4 text-[#2D3748]" />
          </div>
        </div>

        {/* Application Header (Only shown when not in M2 or M3 which have their own specialized context headers) */}
        {currentScreen !== 'M2' && (
          <TopHeader
            syncStatus={syncStatus}
            onToggleSyncStatus={setSyncStatus}
            onOpenProfile={() => setCurrentScreen('PROFILE')}
          />
        )}

        {/* Primary Screen Views */}
        <main className="flex-1 w-full overflow-y-auto">
          {currentScreen === 'M0' && (
            <M0Home
              tasks={tasks}
              onSelectTask={handleSelectTask}
              onNavigateToQueue={handleNavigateToQueue}
              onOpenReport={() => setIsM3Open(true)}
            />
          )}

          {currentScreen === 'M1' && (
            <M1Queue
              tasks={tasks}
              initialFilter={queueFilter}
              initialDomainFilter={queueDomainFilter}
              onSelectTask={handleSelectTask}
              onOpenReport={() => setIsM3Open(true)}
              onClearDomainFilter={() => setQueueDomainFilter(null)}
            />
          )}

          {currentScreen === 'M2' && selectedTask && (
            <M2EvidenceCapture
              task={selectedTask}
              syncStatus={syncStatus}
              onBack={() => setCurrentScreen('M1')}
              onUpdateTask={handleUpdateTask}
            />
          )}

          {currentScreen === 'PROFILE' && (
            <ProfileScreen
              syncStatus={syncStatus}
              onToggleSyncStatus={setSyncStatus}
              onBackToHome={() => setCurrentScreen('M0')}
            />
          )}
        </main>

        {/* Floating Bottom Navigation (Only visible on root tabs M0, M1, and PROFILE) */}
        {currentScreen !== 'M2' && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            queueBadgeCount={pendingCount}
          />
        )}

        {/* M3 New Observation Intake Camera + Sheet Overlay */}
        {isM3Open && (
          <M3ObservationIntake
            onClose={() => setIsM3Open(false)}
            onCreateObservationTask={handleCreateObservationTask}
          />
        )}
      </div>
    </div>
  );
}
