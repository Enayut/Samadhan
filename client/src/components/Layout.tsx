import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { UserRole } from '../types';
import { 
  Activity, 
  ShieldCheck, 
  AlertOctagon, 
  BrainCircuit, 
  Menu, 
  X,
  Bell,
  HardHat,
  Building2,
  Scale,
  ChevronDown,
  Check,
  FileCheck,
  Search,
  Map
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export function Layout() {
  const { state, setRole } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const defaultNav = [
    { to: '/', icon: Activity, label: 'Dashboard' },
    { to: '/gis', icon: Map, label: 'GIS View' },
    { to: '/compliance', icon: ShieldCheck, label: 'Governance Register' }
  ];

  const roleNavConfig: Record<string, {to: string, icon: any, label: string}[]> = {
    'Mine Manager': defaultNav,
    'Mine Safety Officer': defaultNav,
    'Mine Engineer': defaultNav,
    'Area Safety Officer': defaultNav,
    'Corporate Management': defaultNav,
    'Regulatory Authority': defaultNav
  };

  const navItems = roleNavConfig[state.role] || defaultNav;

  const roleIcons: Record<string, any> = {
    'Mine Manager': HardHat,
    'Mine Safety Officer': HardHat,
    'Mine Engineer': HardHat,
    'Area Safety Officer': Building2,
    'Corporate Management': Building2,
    'Regulatory Authority': Scale
  };

  const CurrentRoleIcon = roleIcons[state.role] || HardHat;

  return (
    <div className="flex h-screen bg-paper-100 font-sans print:h-auto print:bg-paper-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden print:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-anthracite-950 text-paper-50 transition-transform duration-300 lg:static lg:translate-x-0 print:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-anthracite-800/50 border-b border-anthracite-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-safety-amber flex items-center justify-center font-display font-bold text-anthracite-950">
              S
            </div>
            <span className="font-display font-semibold text-lg tracking-wide">SAMADHAN</span>
          </div>
          <button className="lg:hidden text-paper-50" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          <div className="text-xs font-semibold text-anthracite-800 uppercase tracking-wider mb-4 mt-2">Modules</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded transition-colors ${
                  isActive 
                    ? 'bg-safety-amber text-anthracite-950 font-medium' 
                    : 'text-paper-100/70 hover:bg-anthracite-800 hover:text-paper-50'
                }`
              }
            >
              <item.icon size={18} />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        {/* Topbar */}
        <header className="h-16 bg-anthracite-950 border-b border-anthracite-800 text-paper-50 flex items-center justify-between px-4 shrink-0 lg:px-6 print:hidden">
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-verdant animate-pulse" />
                <span className="text-paper-100/70">Live</span>
                <span className="font-mono text-paper-50">{format(state.lastSync, 'HH:mm:ss')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-paper-100/70" />
                <span className="text-paper-100/70">Active Alerts:</span>
                <span className="font-bold text-safety-amber">{state.alerts.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-paper-100/70" />
                <span className="text-paper-100/70">Connected Sites:</span>
                <span className="font-bold">{state.sites.length}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-4 hidden lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-100/50" size={16} />
              <input 
                type="text" 
                placeholder="Global search across network (Cmd+K)..." 
                className="w-full bg-anthracite-900 border border-anthracite-800 focus:border-safety-amber focus:ring-1 focus:ring-safety-amber text-sm text-paper-50 placeholder:text-paper-100/50 rounded-lg pl-9 pr-4 py-2 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-3 relative shrink-0" ref={roleMenuRef}>
            <button 
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-3 bg-anthracite-800 hover:bg-anthracite-700 px-3 py-2 rounded-lg border border-anthracite-700 transition-colors focus:outline-none"
            >
              <div className="w-8 h-8 rounded bg-anthracite-950 flex items-center justify-center shrink-0">
                <CurrentRoleIcon size={16} className="text-safety-amber" />
              </div>
              <div className="text-left hidden md:block pr-2">
                <div className="text-[10px] text-paper-100/50 font-medium uppercase tracking-wider leading-none mb-1">Viewing As</div>
                <div className="text-sm font-semibold text-paper-50 leading-none">{state.role}</div>
              </div>
              <ChevronDown size={16} className={`text-paper-100/50 transition-transform duration-200 ${roleMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {roleMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full right-0 mt-2 w-72 bg-anthracite-950 border border-anthracite-800 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-anthracite-800 bg-anthracite-900/50">
                    <p className="text-xs font-medium text-paper-100/70 uppercase tracking-wider">Switch Persona</p>
                  </div>
                  <div className="p-2 space-y-1">
                    {(['Mine Manager', 'Mine Safety Officer', 'Mine Engineer', 'Area Safety Officer', 'Corporate Management', 'Regulatory Authority'] as UserRole[]).map((r) => {
                      const Icon = roleIcons[r as keyof typeof roleIcons] || HardHat;
                      const isActive = state.role === r;
                      const userName = r === 'Mine Manager' ? 'S. Singh' :
                                       r === 'Mine Safety Officer' ? 'A. Kumar' :
                                       r === 'Mine Engineer' ? 'P. Verma' :
                                       r === 'Area Safety Officer' ? 'R. Sharma' :
                                       r === 'Corporate Management' ? 'L. Gupta' : 'M. Inspector';
                      return (
                        <button
                          key={r}
                          onClick={() => { setRole(r, userName); setRoleMenuOpen(false); }}
                          className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${isActive ? 'bg-anthracite-800' : 'hover:bg-anthracite-800/50'}`}
                        >
                          <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${isActive ? 'bg-safety-amber text-anthracite-950' : 'bg-anthracite-800 text-paper-100/70'}`}>
                            <Icon size={14} />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-paper-50 flex items-center justify-between">
                              {r} ({userName})
                              {isActive && <Check size={16} className="text-safety-amber" />}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-paper-100 p-4 lg:p-6 print:overflow-visible print:bg-paper-50 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
