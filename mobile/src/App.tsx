import React, { useState } from 'react';
import { Task, ScreenId, SyncStatusType, QueueFilter, DomainType } from './types';
import { INITIAL_TASKS } from './data/mockData';
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
  const [selectedTaskId, setSelectedTaskId] = useState<string>('TASK-001');
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('ALL');
  const [queueDomainFilter, setQueueDomainFilter] = useState<DomainType | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>('synced');
  const [isM3Open, setIsM3Open] = useState(false);

  // Selected task object for M2
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

  // Navigating directly to M2 Evidence Capture
  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentScreen('M2');
  };

  // Update Task State (from M2 Evidence Capture or updates)
  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  // Create new task from M3 Observation Intake
  const handleCreateObservationTask = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
    setSelectedTaskId(newTask.id);
    setCurrentScreen('M1');
  };

  // Count active pending tasks for queue badge
  const pendingCount = tasks.filter(
    (t) => t.status !== 'VERIFIED' && (t.urgencyGroup === 'OVERDUE' || t.hoursRemaining <= 24)
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
