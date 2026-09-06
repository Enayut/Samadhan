import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { MineDetail } from './pages/MineDetail';
import { AlertIntake } from './pages/AlertIntake';
import { ManagerReview } from './pages/ManagerReview';
import { ComplianceTracker } from './pages/ComplianceTracker';
import { CalendarPage } from './pages/Calendar';
import { AreaMap } from './pages/GisMapping';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="mine/:mineId" element={<MineDetail />} />
            <Route path="intake" element={<AlertIntake />} />
            <Route path="review" element={<ManagerReview />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="compliance" element={<ComplianceTracker />} />
            <Route path="gis" element={<AreaMap />} />
            {/* Old routes → new equivalents */}
            <Route path="site/:id" element={<Navigate to="/mine/MINE-001" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
