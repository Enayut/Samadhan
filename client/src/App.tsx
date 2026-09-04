import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ComplianceTracker } from './pages/ComplianceTracker';
import { GisMapping } from './pages/GisMapping';
import { Site3DView } from './pages/Site3DView';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="compliance" element={<ComplianceTracker />} />
            <Route path="gis" element={<GisMapping />} />
            <Route path="site/:id" element={<Site3DView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
