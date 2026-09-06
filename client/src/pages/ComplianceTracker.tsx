import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, ArrowRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { GovernanceObjectModal } from '../components/GovernanceObjectModal';
import { STATUS_COLOR, STATUS_LABEL, DOMAIN_LABEL } from '../services/demoApi';
import type { Task } from '../../../shared/demo/types';

export function ComplianceTracker() {
  const { state } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [selectedObjId, setSelectedObjId] = useState<string | null>(null);

  const mineFilter = searchParams.get('mine');
  const mineName = mineFilter
    ? state.sites.find((s) => s.id === mineFilter)?.name
    : undefined;

  const statusOrder = ['ESCALATED', 'OVERDUE', 'REJECTED', 'AWAITING_VERIFICATION', 'IN_PROGRESS', 'ASSIGNED', 'PROPOSED', 'VERIFIED'];
  const filteredTasks = useMemo(() => {
    return state.tasks
      .filter((t) => {
        const matchesSearch =
          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.sourceCitation || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDomain = domainFilter === 'all' || t.domain === domainFilter;
        const matchesMine = !mineFilter || t.mineId === mineFilter;
        return matchesSearch && matchesDomain && matchesMine;
      })
      .sort((a: Task, b: Task) => {
        const ia = statusOrder.indexOf(a.status);
        const ib = statusOrder.indexOf(b.status);
        if (ia !== ib) return ia - ib;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
  }, [state.tasks, searchTerm, domainFilter, mineFilter]);

  const domains = Object.keys(DOMAIN_LABEL);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <GovernanceObjectModal objectId={selectedObjId} onClose={() => setSelectedObjId(null)} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-anthracite-950">Governance Register</h1>
          <p className="text-anthracite-800/80 mt-1">
            Every compliance obligation across the five mines — owner, deadline, evidence and verification
            state on one ledger.
          </p>
          {mineFilter && (
            <div className="mt-3 inline-flex items-center gap-2 bg-anthracite-950 text-paper-50 rounded-lg px-3 py-1.5 text-xs font-bold">
              <span className="uppercase tracking-wider">Mine filter:</span>
              <span className="font-mono text-safety-amber">{mineFilter}</span>
              <span className="text-paper-100/70">· {mineName || '—'}</span>
              <button
                onClick={() => setSearchParams({})}
                className="ml-1 p-0.5 rounded hover:bg-anthracite-800 text-paper-100/70 hover:text-paper-50"
                title="Clear mine filter"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 text-[11px] font-bold text-anthracite-800/60 uppercase tracking-wider">
          <span className="text-verdant">Rule derived</span> · deadlines & evidence set by the rule registry
        </div>
      </div>

      <div className="bg-white rounded-xl border border-paper-100 shadow-sm overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-paper-100 bg-paper-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-anthracite-800/50" size={16} />
              <input
                type="text"
                placeholder="Search obligation or source…"
                className="w-full pl-9 pr-4 py-2 bg-white border border-paper-100 rounded-lg text-sm focus:outline-none focus:border-steel focus:ring-1 focus:ring-steel transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-anthracite-800 shrink-0">
              <Filter size={16} />
              <select
                className="bg-white border border-paper-100 rounded-lg px-3 py-2 outline-none focus:border-steel"
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
              >
                <option value="all">All Domains</option>
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {DOMAIN_LABEL[d]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <span className="text-[11px] font-bold text-anthracite-800/60">{filteredTasks.length} records</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white border-b border-paper-100 text-anthracite-800">
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Domain & Source</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Obligation</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Mine</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Owner</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Deadline</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Status</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-anthracite-800">
                    No records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const color = STATUS_COLOR[t.status] || '#6B7280';
                  const mine = state.sites.find((s) => s.id === t.mineId);
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-paper-100/50 hover:bg-[#F8F9FA] transition-colors cursor-pointer group"
                      onClick={() => setSelectedObjId(t.id)}
                    >
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-anthracite-950">{DOMAIN_LABEL[t.domain] || t.domain}</span>
                          <span className="text-xs text-anthracite-800 font-mono">{t.sourceCitation}</span>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-anthracite-950 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{t.title}</span>
                          {t.recurring && t.cadence && (
                            <span className="shrink-0 text-[9px] font-bold text-steel bg-steel/10 border border-steel/25 rounded px-1.5 py-0.5 uppercase">
                              {t.cadence}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs font-bold text-steel">{t.mineId}</span>
                        <span className="block text-xs text-anthracite-800/60">{mine?.name}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-anthracite-950">{t.owner.name}</span>
                          <span className="text-xs text-anthracite-800">{t.owner.role}</span>
                        </div>
                      </td>
                      <td className="p-4 text-anthracite-950">
                        {format(new Date(t.deadline), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-4">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border"
                          style={{ backgroundColor: `${color}15`, color, borderColor: `${color}30` }}
                        >
                          {STATUS_LABEL[t.status] || t.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-steel hover:text-steel/80 transition-colors p-1 rounded-full hover:bg-steel/10">
                          <ArrowRight size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
