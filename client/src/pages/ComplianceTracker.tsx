import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { 
  Filter, Search, ScanLine, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { DocumentScannerModal } from '../components/DocumentScannerModal';
import { GovernanceObjectModal } from '../components/GovernanceObjectModal';
import { GovStatus } from '../types';

const STATUS_COLORS: Record<GovStatus, string> = {
  'Closed': '#4C7A66',
  'Submitted': '#4A7C9B',
  'In Progress': '#F2A93B',
  'Overdue': '#C1502E',
  'Escalated': '#C1502E'
};

export function ComplianceTracker() {
  const { state } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedObjId, setSelectedObjId] = useState<string | null>(null);

  const filteredObjects = useMemo(() => {
    return state.govObjects.filter(obj => {
      const matchesSearch = obj.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            obj.source.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDomain = domainFilter === 'all' || obj.domain === domainFilter;
      return matchesSearch && matchesDomain;
    });
  }, [state.govObjects, searchTerm, domainFilter]);

  const domains = ['Safety', 'Environment', 'Production', 'Labour', 'Contractor', 'Grievance'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <DocumentScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />
      <GovernanceObjectModal objectId={selectedObjId} onClose={() => setSelectedObjId(null)} />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-anthracite-950">Governance & Compliance Register</h1>
          <p className="text-anthracite-800/80 mt-1">Universal register of all statutory obligations and governance items.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setScannerOpen(true)}
            className="bg-steel hover:bg-steel/90 text-white px-4 py-2 rounded font-bold transition-colors text-sm shadow-sm flex items-center gap-2"
          >
            <ScanLine size={16} /> Scan Document
          </button>
          <button className="bg-anthracite-950 hover:bg-anthracite-800 text-paper-50 px-4 py-2 rounded font-medium transition-colors text-sm shadow-sm">
            Export Register
          </button>
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
                placeholder="Search requirement or source..." 
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
                {domains.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white border-b border-paper-100 text-anthracite-800">
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Domain & Source</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Title</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Owner</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Deadline</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Status</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredObjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-anthracite-800">No records found matching your filters.</td>
                </tr>
              ) : (
                filteredObjects.map(obj => (
                  <tr 
                    key={obj.id} 
                    className="border-b border-paper-100/50 hover:bg-[#F8F9FA] transition-colors cursor-pointer group"
                    onClick={() => setSelectedObjId(obj.id)}
                  >
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-anthracite-950">{obj.domain}</span>
                        <span className="text-xs text-anthracite-800">{obj.source}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-anthracite-950 max-w-md truncate">{obj.title}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-anthracite-950">{obj.owner.name}</span>
                        <span className="text-xs text-anthracite-800">{obj.owner.role}</span>
                      </div>
                    </td>
                    <td className="p-4 text-anthracite-950">
                      {format(new Date(obj.deadline), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-4">
                      <span 
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border`}
                        style={{
                          backgroundColor: `${STATUS_COLORS[obj.status]}15`,
                          color: STATUS_COLORS[obj.status],
                          borderColor: `${STATUS_COLORS[obj.status]}30`
                        }}
                      >
                        {obj.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-steel hover:text-steel/80 transition-colors p-1 rounded-full hover:bg-steel/10">
                        <ArrowRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
