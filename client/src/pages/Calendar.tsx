import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format,
  isSameMonth,
  isToday,
  isBefore,
  isAfter,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  addDays,
  isValid,
  startOfDay,
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { GovernanceObjectModal } from '../components/GovernanceObjectModal';
import { GovernanceObject, GovStatus, Alert } from '../types';

// Status palette matches the rest of the app (Dashboard STATUS_COLORS).
const STATUS_COLORS: Record<GovStatus, string> = {
  'Closed': '#4C7A66',
  'Submitted': '#4A7C9B',
  'In Progress': '#F2A93B',
  'Rejected': '#A93226',
  'Overdue': '#C1502E',
  'Escalated': '#C1502E',
};

const SOURCE_COLORS: Record<string, string> = {
  DGMS: '#C1502E',
  CSIS: '#4A7C9B',
  SENSOR: '#A93226',
  CMSMS: '#4C7A66',
  EC: '#F2A93B',
  AUDIT: '#6B7280',
  GRIEVANCE: '#6B7280',
};

// Order matters within a day cell: urgent statuses float to the top.
const STATUS_PRIORITY: Record<string, number> = {
  'Overdue': 0,
  'Escalated': 0,
  'Rejected': 1,
  'In Progress': 2,
  'Submitted': 3,
  'Closed': 4,
};

interface CalendarItem {
  kind: 'task' | 'alert';
  id: string;
  title: string;
  date: Date;
  color: string;
  meta: string;
  status?: string;
  obj?: GovernanceObject;
  alert?: Alert;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MAX_CHIPS_PER_CELL = 3;

export function CalendarPage() {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedObjId, setSelectedObjId] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const monthKey = format(month, 'yyyy-MM');

  const items = useMemo<CalendarItem[]>(() => {
    const list: CalendarItem[] = [];
    for (const obj of state.govObjects) {
      const d = new Date(obj.deadline);
      if (!isValid(d)) continue;
      list.push({
        kind: 'task',
        id: obj.id,
        title: obj.title,
        date: startOfDay(d),
        color: STATUS_COLORS[obj.status] || '#6B7280',
        meta: obj.mineId,
        status: obj.status,
        obj,
      });
    }
    for (const entry of state.pipeline.alerts) {
      const a = entry.alert;
      if (!a.ackDeadlineDate) continue;
      const d = new Date(a.ackDeadlineDate);
      if (!isValid(d)) continue;
      list.push({
        kind: 'alert',
        id: a.id,
        title: `Ack ${a.ref ?? ''}`,
        date: startOfDay(d),
        color: SOURCE_COLORS[a.source ?? ''] || '#6B7280',
        meta: a.source ?? 'ALERT',
        alert: a,
      });
    }
    return list.sort((x, y) => {
      const px = x.kind === 'task' ? STATUS_PRIORITY[x.status ?? ''] ?? 3 : 3;
      const py = y.kind === 'task' ? STATUS_PRIORITY[y.status ?? ''] ?? 3 : 3;
      if (px !== py) return px - py;
      return x.title.localeCompare(y.title);
    });
  }, [state.govObjects, state.pipeline.alerts]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const it of items) {
      const key = format(it.date, 'yyyy-MM-dd');
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    }
    return map;
  }, [items]);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month)),
        end: endOfWeek(endOfMonth(month)),
      }),
    [month],
  );

  // Agenda slices (tasks only; alert acks are listed separately).
  const overdue = items.filter(
    (it) => it.kind === 'task' && it.status !== 'Closed' && isBefore(it.date, today),
  );
  const next7 = items.filter(
    (it) =>
      it.kind === 'task' && it.status !== 'Closed' && !isBefore(it.date, today) && isBefore(it.date, addDays(today, 8)),
  );
  const next30 = items.filter(
    (it) =>
      it.kind === 'task' && it.status !== 'Closed' && !isBefore(it.date, addDays(today, 7)) && isBefore(it.date, addDays(today, 31)),
  );
  const alertAcks = items
    .filter((it) => it.kind === 'alert')
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const monthDeadlines = items.filter((it) => isSameMonth(it.date, month)).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <GovernanceObjectModal objectId={selectedObjId} onClose={() => setSelectedObjId(null)} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-anthracite-950">
            Compliance Calendar
          </h1>
          <p className="text-anthracite-800/80 mt-1">
            Every governance obligation deadline and alert acknowledgment, on one timeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg border border-paper-100 shadow-sm flex items-center gap-1 p-1">
            <button
              onClick={() => setMonth((m) => addMonths(m, -1))}
              className="p-1.5 rounded-md hover:bg-paper-100 text-anthracite-800 transition-colors"
              title="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setMonth(startOfMonth(new Date()))}
              className="px-2 py-1 text-xs font-bold text-steel hover:text-steel/80 transition-colors"
              title="Jump to today"
            >
              Today
            </button>
            <button
              onClick={() => setMonth((m) => addMonths(m, 1))}
              className="p-1.5 rounded-md hover:bg-paper-100 text-anthracite-800 transition-colors"
              title="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <span className="bg-anthracite-950 text-paper-50 px-4 py-2 rounded-lg text-sm font-display font-bold shadow-sm">
            {format(month, 'MMMM yyyy')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* MONTH GRID */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-paper-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-paper-100 bg-paper-50">
            <div className="flex items-center gap-2 text-sm font-bold text-anthracite-950">
              <CalendarDays size={16} className="text-steel" /> {format(month, 'MMMM yyyy')}
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold text-anthracite-800/70">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-steel inline-block" /> {monthDeadlines} deadlines</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-safety-amber inline-block" /> {alertAcks.length} alert acks</span>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-paper-100 bg-paper-50/60">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-anthracite-800/60">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayItems = itemsByDay.get(key) ?? [];
              const inMonth = isSameMonth(day, month);
              const todayFlag = isToday(day);
              const visible = dayItems.slice(0, MAX_CHIPS_PER_CELL);
              const hidden = dayItems.length - visible.length;
              return (
                <div
                  key={key}
                  className={`min-h-[104px] border-b border-r border-paper-100 p-1.5 flex flex-col gap-1 ${
                    inMonth ? 'bg-white' : 'bg-paper-50/70'
                  } ${todayFlag ? 'ring-2 ring-inset ring-safety-amber/70 bg-safety-amber/[0.03]' : ''}`}
                >
                  <span
                    className={`text-[11px] font-bold self-start rounded-full w-6 h-6 flex items-center justify-center ${
                      todayFlag
                        ? 'bg-safety-amber text-anthracite-950'
                        : inMonth
                          ? 'text-anthracite-800'
                          : 'text-anthracite-800/30'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="space-y-1 overflow-hidden">
                    {visible.map((it) => (
                      <button
                        key={`${it.kind}-${it.id}`}
                        onClick={() =>
                          it.kind === 'task' ? setSelectedObjId(it.id) : navigate('/intake')
                        }
                        title={`${it.title} · ${it.meta}${it.kind === 'task' ? ` · ${it.status}` : ''}`}
                        className="w-full flex items-center gap-1.5 text-left px-1.5 py-0.5 rounded text-[10px] font-medium text-anthracite-800 hover:bg-black/5 transition-colors truncate"
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: it.color }} />
                        <span className="truncate">{it.title}</span>
                      </button>
                    ))}
                    {hidden > 0 && (
                      <span className="block px-1.5 text-[10px] font-bold text-anthracite-800/50">
                        +{hidden} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-5 py-3 border-t border-paper-100 bg-paper-50 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-anthracite-800/70">Legend</span>
            {(Object.keys(STATUS_COLORS) as GovStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-[11px] text-anthracite-800/80">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] }} /> {s}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-[11px] text-anthracite-800/80">
              <span className="w-2 h-2 rounded-full bg-safety-amber/80" /> Alert ack deadline
            </span>
          </div>
        </div>

        {/* AGENDA SIDEBAR */}
        <div className="space-y-4">
          {/* Alert ack deadlines */}
          <div className="bg-white rounded-xl shadow-sm border border-paper-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-paper-100 bg-paper-50">
              <div className="flex items-center gap-2 text-sm font-bold text-anthracite-950">
                <AlertTriangle size={14} className="text-safety-amber" /> Alert Ack Deadlines
              </div>
              <span className="text-[10px] font-bold text-anthracite-800/60">{alertAcks.length}</span>
            </div>
            <div className="divide-y divide-paper-100">
              {alertAcks.length === 0 && (
                <p className="px-4 py-3 text-xs text-anthracite-800/60">No alerts with deadlines.</p>
              )}
              {alertAcks.map((it) => {
                const a = it.alert!;
                const daysLeft = Math.ceil((it.date.getTime() - today.getTime()) / 86400000);
                const overdue = daysLeft < 0;
                return (
                  <button
                    key={it.id}
                    onClick={() => navigate('/intake')}
                    className="w-full text-left px-4 py-2.5 hover:bg-paper-50 transition-colors flex items-center gap-3"
                  >
                    <div
                      className="shrink-0 w-9 rounded-lg py-1 text-center text-[10px] font-bold border"
                      style={{
                        backgroundColor: `${it.color}14`,
                        color: it.color,
                        borderColor: `${it.color}30`,
                      }}
                    >
                      {format(it.date, 'd MMM')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-anthracite-950 truncate">{a.title}</p>
                      <p className="text-[10px] text-anthracite-800/60 truncate">{a.ref} · {a.source}</p>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold ${
                        overdue ? 'text-[#C1502E]' : 'text-anthracite-800/60'
                      }`}
                    >
                      {overdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Governance deadlines */}
          {[
            { title: 'Overdue', list: overdue, empty: 'Nothing overdue. 🎉' },
            { title: 'Next 7 Days', list: next7, empty: 'Nothing due in the next week.' },
            { title: 'Next 8–30 Days', list: next30, empty: 'Nothing further due.' },
          ].map((section) => (
            <div key={section.title} className="bg-white rounded-xl shadow-sm border border-paper-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-paper-100 bg-paper-50">
                <div className="flex items-center gap-2 text-sm font-bold text-anthracite-950">
                  <Clock size={14} className={section.title === 'Overdue' ? 'text-[#C1502E]' : 'text-steel'} />
                  {section.title}
                </div>
                <span className="text-[10px] font-bold text-anthracite-800/60">{section.list.length}</span>
              </div>
              <div className="divide-y divide-paper-100">
                {section.list.length === 0 && (
                  <p className="px-4 py-3 text-xs text-anthracite-800/60">{section.empty}</p>
                )}
                {section.list.slice(0, 6).map((it) => (
                  <button
                    key={it.id}
                    onClick={() => setSelectedObjId(it.id)}
                    className="w-full text-left px-4 py-2.5 hover:bg-paper-50 transition-colors flex items-center gap-3"
                  >
                    <div
                      className="shrink-0 w-9 rounded-lg py-1 text-center text-[10px] font-bold border"
                      style={{
                        backgroundColor: `${it.color}14`,
                        color: it.color,
                        borderColor: `${it.color}30`,
                      }}
                    >
                      {format(it.date, 'd MMM')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-anthracite-950 truncate">{it.title}</p>
                      <p className="text-[10px] text-anthracite-800/60 truncate">{it.meta} · {it.status}</p>
                    </div>
                    <ArrowRight size={13} className="shrink-0 text-anthracite-800/30" />
                  </button>
                ))}
                {section.list.length > 6 && (
                  <p className="px-4 py-2 text-[10px] font-bold text-steel">
                    +{section.list.length - 6} more…
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}