import React from 'react';
import { ScreenId } from '../types';
import { Home, ListTodo, Plus } from 'lucide-react';

interface BottomNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  queueBadgeCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  queueBadgeCount = 0,
}) => {
  return (
    <nav
      id="bottom-navigation"
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-40 max-w-[430px] mx-auto select-none"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid #E2E8F0',
      }}
    >
      <div className="relative flex items-center justify-between h-16 px-8">
        {/* 1. Home (Left) */}
        <button
          type="button"
          onClick={() => onNavigate('M0')}
          className={`flex flex-col items-center justify-center min-w-[64px] h-12 rounded-[10px] transition-all active:scale-95 ${
            currentScreen === 'M0'
              ? 'text-[#1A202C] font-bold'
              : 'text-[#718096] hover:text-[#2D3748]'
          }`}
        >
          <Home
            className={`w-5 h-5 ${
              currentScreen === 'M0' ? 'stroke-[2.5] text-[#1A202C]' : 'stroke-[1.75]'
            }`}
          />
          <span className="text-[11px] mt-1 tracking-tight">Home</span>
        </button>

        {/* 2. Raised Central Report Action (+) */}
        <div className="relative -top-5 flex flex-col items-center justify-center">
          <button
            type="button"
            id="report-action-btn"
            onClick={() => onNavigate('M3')}
            aria-label="Report new observation"
            className="w-14 h-14 rounded-full bg-[#ECC94B] text-[#1A202C] flex items-center justify-center shadow-lg active:scale-95 hover:bg-[#D69E2E] transition-all border-4 border-white focus:outline-hidden"
          >
            <Plus className="w-7 h-7 stroke-[3] text-[#1A202C]" />
          </button>
          <span className="text-[10px] font-bold text-[#2D3748] mt-1 tracking-tight">
            Report
          </span>
        </div>

        {/* 3. Queue (Right) */}
        <button
          type="button"
          onClick={() => onNavigate('M1')}
          className={`relative flex flex-col items-center justify-center min-w-[64px] h-12 rounded-[10px] transition-all active:scale-95 ${
            currentScreen === 'M1'
              ? 'text-[#1A202C] font-bold'
              : 'text-[#718096] hover:text-[#2D3748]'
          }`}
        >
          <div className="relative">
            <ListTodo
              className={`w-5 h-5 ${
                currentScreen === 'M1' ? 'stroke-[2.5] text-[#1A202C]' : 'stroke-[1.75]'
              }`}
            />
            {queueBadgeCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 bg-[#E53E3E] text-white text-[9px] font-bold rounded-full border border-white">
                {queueBadgeCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1 tracking-tight">Queue</span>
        </button>
      </div>
    </nav>
  );
};
