import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/storage';
import { User, Evaluation, VendorType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Filter, Activity, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown, FileCheck, Clock, AlertCircle, Download, CheckCircle2 } from 'lucide-react';
import { generateAndDownloadPDF } from '../services/pdfGenerator';
import { useToast } from '../components/Toast';

interface Props {
  user: User;
}

type SortKey = 'vendorName' | 'period' | 'overallScore';

interface MergedEvaluation {
  id: string;
  vendorName: string;
  vendorType: VendorType;
  period: string;
  status: 'Completed' | 'Pending';
  finalScore: number; 
  departmentStatus: { name: string; weight: number; status: 'Done' | 'Pending'; score: number }[];
  submissions: Evaluation[];
}

export const ReportsEvaluator: React.FC<Props> = ({ user }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'my-history' | 'consolidated'>('my-history');
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<Evaluation[]>([]);
  const [filterType, setFilterType] = useState<string>('All');
  const [periodFilter, setPeriodFilter] = useState<string>('');
  const [mergedEvaluations, setMergedEvaluations] = useState<MergedEvaluation[]>([]);
  
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'period', 
    direction: 'desc'
  });

  useEffect(() => {
    const data = db.evaluations.getByEvaluator(user.userId);
    setEvaluations(data);
    setFilteredEvaluations(data);
    computeMergedEvaluations();
  }, [user.userId]);

  const computeMergedEvaluations = () => {
    const allEvals = db.evaluations.getAll();
    const vendors = db.vendors.getAll();
    const templates = db.templates.getAll();
    
    const grouped: Record<string, Evaluation[]> = {};
    allEvals.forEach(e => {
      const key = `${e.vendorId}|${e.period}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    });

    const mergedList: MergedEvaluation[] = [];

    Object.keys(grouped).forEach(key => {
      const [vendorId, period] = key.split('|');
      const vendorSubmissions = grouped[key];
      const vendor = vendors.find(v => v.vendorId === vendorId);
      if (!vendor) return;

      const template = templates.find(t => t.vendorType === vendor.vendorType);
      if (!template) return;

      let totalWeightedScore = 0;
      let allDone = true;
      const deptStatus = template.structure.map(dept => {
        const sub = vendorSubmissions.find(s => s.department === dept.departmentName);
        if (sub) {
          totalWeightedScore += (sub.overallScore * dept.departmentWeight) / 100;
          return { name: dept.departmentName, weight: dept.departmentWeight, status: 'Done' as const, score: sub.overallScore };
        } else {
          allDone = false;
          return { name: dept.departmentName, weight: dept.departmentWeight, status: 'Pending' as const, score: 0 };
        }
      });

      mergedList.push({
        id: key,
        vendorName: vendor.vendorName,
        vendorType: vendor.vendorType,
        period: period,
        status: allDone ? 'Completed' : 'Pending',
        finalScore: totalWeightedScore,
        departmentStatus: deptStatus,
        submissions: vendorSubmissions
      });
    });

    setMergedEvaluations(mergedList);
  };

  useEffect(() => {
    let result = evaluations;
    if (filterType !== 'All') {
      result = result.filter(e => e.vendorType === filterType);
    }
    if (periodFilter) {
      result = result.filter(e => e.period.toLowerCase().includes(periodFilter.toLowerCase()));
    }
    setFilteredEvaluations(result);
  }, [filterType, periodFilter, evaluations]);

  const sortedEvaluations = useMemo(() => {
    const sorted = [...filteredEvaluations];
    sorted.sort((a, b) => {
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredEvaluations, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDownloadReport = (m: MergedEvaluation) => {
    const [vendorId, period] = m.id.split('|');
    const report = db.reports.get(vendorId, period);
    
    if (report) {
      generateAndDownloadPDF(report);
      addToast("Report downloaded successfully.", "success");
    } else {
      addToast("Report data not found. Please contact admin.", "error");
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1 text-gray-400" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 text-primary" /> : <ArrowDown size={14} className="ml-1 text-primary" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
        <div className="bg-white p-1 rounded-lg border flex shadow-sm">
          <button 
            onClick={() => setActiveTab('my-history')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'my-history' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            My History
          </button>
          <button 
            onClick={() => setActiveTab('consolidated')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'consolidated' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Consolidated Status
          </button>
        </div>
      </div>

      {activeTab === 'my-history' ? (
        <>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
            <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Vendor Type</label>
               <select className="border p-2 rounded text-sm w-48" value={filterType} onChange={e => setFilterType(e.target.value)}>
                 <option value="All">All Types</option>
                 {Object.values(VendorType).map(t => <option key={t} value={t}>{t}</option>)}
               </select>
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Period Search</label>
               <input type="text" placeholder="e.g. 2023-Q4" className="border p-2 rounded text-sm" value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} />
            </div>
            <div className="ml-auto text-sm text-gray-500 flex items-center gap-2">
                <Filter size={16} /> Filters Applied
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[400px]">
             <div className="p-4 border-b border-gray-200 bg-gray-50">
               <h3 className="font-bold text-gray-700">Evaluation History</h3>
             </div>
             <div className="overflow-y-auto flex-1">
               <table className="w-full text-sm text-left">
                 <thead className="text-xs text-gray-500 bg-gray-50 sticky top-0 border-b border-gray-200 z-10">
                   <tr>
                     <th className="px-4 py-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('vendorName')}>
                        <div className="flex items-center">Vendor {getSortIcon('vendorName')}</div>
                     </th>
                     <th className="px-4 py-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('period')}>
                        <div className="flex items-center">Period {getSortIcon('period')}</div>
                     </th>
                     <th className="px-4 py-2 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('overallScore')}>
                        <div className="flex items-center justify-end">Score {getSortIcon('overallScore')}</div>
                     </th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {sortedEvaluations.length > 0 ? sortedEvaluations.map(e => (
                       <tr key={e.evaluationId} className="hover:bg-gray-50">
                         <td className="px-4 py-3">
                           <div className="font-medium text-gray-900">{e.vendorName}</div>
                           <div className="text-xs text-gray-500">{e.vendorType}</div>
                         </td>
                         <td className="px-4 py-3 text-gray-600">{e.period}</td>
                         <td className="px-4 py-3 text-right">
                           <span className={`font-bold px-2 py-1 rounded text-xs ${e.overallScore >= 80 ? 'bg-green-100 text-green-700' : e.overallScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                             {e.overallScore.toFixed(1)}
                           </span>
                         </td>
                       </tr>
                   )) : <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No records found.</td></tr>}
                 </tbody>
               </table>
             </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
           <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-start gap-3">
             <FileCheck className="text-blue-600 shrink-0 mt-1" size={24} />
             <div>
               <h4 className="font-bold text-blue-900 text-sm">Consolidated Vendor Status</h4>
               <p className="text-sm text-blue-700 mt-1">
                 This view aggregates evaluations from all departments. 
                 A final report is generated <strong>only when all required departments submit</strong>.
               </p>
             </div>
           </div>

           <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200">
                   <tr>
                     <th className="px-6 py-4">Vendor / Type</th>
                     <th className="px-6 py-4">Period</th>
                     <th className="px-6 py-4">Department Status</th>
                     <th className="px-6 py-4 text-right">Final Weighted Score</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {mergedEvaluations.length > 0 ? mergedEvaluations.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50 group">
                         <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{m.vendorName}</div>
                            <div className="text-xs text-gray-500">{m.vendorType}</div>
                         </td>
                         <td className="px-6 py-4">
                           <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium border border-gray-200">
                             {m.period}
                           </span>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex gap-2 flex-wrap">
                               {m.departmentStatus.map(d => (
                                 <div 
                                   key={d.name} 
                                   title={`${d.name} (${d.weight}%) - ${d.status}`} 
                                   className={`flex items-center gap-1 px-2 py-1 text-xs rounded border ${
                                     d.status === 'Done' 
                                       ? 'bg-green-50 border-green-200 text-green-700' 
                                       : 'bg-gray-50 border-gray-200 text-gray-400 border-dashed'
                                   }`}
                                 >
                                    {d.status === 'Done' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                    <span>{d.name}</span>
                                 </div>
                               ))}
                            </div>
                         </td>
                         <td className="px-6 py-4 text-right">
                           {m.status === 'Completed' ? (
                             <span className="font-bold text-lg text-primary">{m.finalScore.toFixed(2)}</span>
                           ) : (
                             <div className="flex items-center justify-end gap-1 text-gray-400 italic">
                               <AlertCircle size={14} />
                               <span>Pending</span>
                             </div>
                           )}
                         </td>
                         <td className="px-6 py-4 text-right">
                            <button 
                              disabled={m.status !== 'Completed'}
                              onClick={() => handleDownloadReport(m)}
                              className={`flex items-center justify-center ml-auto gap-2 px-3 py-1.5 rounded transition-colors ${
                                m.status === 'Completed' 
                                  ? 'bg-primary text-white hover:bg-blue-700 shadow-sm' 
                                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                              }`}
                            >
                               <Download size={16} />
                               <span className="text-xs font-medium">Download PDF</span>
                            </button>
                         </td>
                      </tr>
                    )) : <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No consolidated data available.</td></tr>}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};