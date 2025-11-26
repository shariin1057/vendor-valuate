import React, { useEffect, useState } from 'react';
import { db } from '../services/storage';
import { Evaluation, VendorType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Download, Filter, TrendingUp, Users, Building2 } from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [allEvaluations, setAllEvaluations] = useState<Evaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<Evaluation[]>([]);
  const [periodFilter, setPeriodFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    setAllEvaluations(db.evaluations.getAll());
    setFilteredEvaluations(db.evaluations.getAll());
  }, []);

  useEffect(() => {
    let result = allEvaluations;
    if (typeFilter !== 'All') {
      result = result.filter(e => e.vendorType === typeFilter);
    }
    if (periodFilter) {
      result = result.filter(e => e.period.includes(periodFilter));
    }
    setFilteredEvaluations(result);
  }, [typeFilter, periodFilter, allEvaluations]);

  const totalEvaluations = filteredEvaluations.length;
  const uniqueVendors = new Set(filteredEvaluations.map(e => e.vendorId)).size;
  const avgSystemScore = totalEvaluations > 0 
    ? (filteredEvaluations.reduce((sum, e) => sum + e.overallScore, 0) / totalEvaluations).toFixed(1) 
    : '0.0';

  const vendorScoreMap: Record<string, { total: number; count: number }> = {};
  filteredEvaluations.forEach(e => {
    if (!vendorScoreMap[e.vendorName]) vendorScoreMap[e.vendorName] = { total: 0, count: 0 };
    vendorScoreMap[e.vendorName].total += e.overallScore;
    vendorScoreMap[e.vendorName].count += 1;
  });
  
  const topVendorsData = Object.keys(vendorScoreMap)
    .map(name => ({
      name,
      score: parseFloat((vendorScoreMap[name].total / vendorScoreMap[name].count).toFixed(1))
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const deptCountMap: Record<string, number> = {};
  filteredEvaluations.forEach(e => {
    deptCountMap[e.department] = (deptCountMap[e.department] || 0) + 1;
  });
  const deptData = Object.keys(deptCountMap).map(d => ({ name: d, value: deptCountMap[d] }));
  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const handleExport = () => {
    const headers = ['EvaluationID', 'VendorName', 'VendorType', 'Period', 'Department', 'Evaluator', 'Score', 'Date'];
    const csvContent = [
      headers.join(','),
      ...filteredEvaluations.map(e => [
        e.evaluationId,
        `"${e.vendorName}"`,
        e.vendorType,
        e.period,
        e.department,
        e.evaluatorName,
        e.overallScore,
        e.submittedDate
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'all_evaluations_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">System Reports</h2>
           <p className="text-gray-500 text-sm">Comprehensive analytics of all vendor evaluations.</p>
        </div>
        <button 
           onClick={handleExport}
           className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 shadow"
        >
          <Download size={18} /> Export All Data
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Vendor Type</label>
            <select className="border p-2 rounded text-sm w-48" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="All">All Types</option>
              {Object.values(VendorType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Period</label>
            <input type="text" placeholder="e.g. 2023-Q4" className="border p-2 rounded text-sm" value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} />
        </div>
        <div className="ml-auto text-sm text-gray-500 flex items-center gap-2">
            <Filter size={16} /> {filteredEvaluations.length} records found
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500 flex items-center gap-4">
           <div className="bg-blue-50 p-3 rounded-full text-blue-600"><TrendingUp size={24} /></div>
           <div>
             <p className="text-sm text-gray-500">Avg System Score</p>
             <p className="text-3xl font-bold text-gray-800">{avgSystemScore}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-purple-500 flex items-center gap-4">
           <div className="bg-purple-50 p-3 rounded-full text-purple-600"><Building2 size={24} /></div>
           <div>
             <p className="text-sm text-gray-500">Unique Vendors Evaluated</p>
             <p className="text-3xl font-bold text-gray-800">{uniqueVendors}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-green-500 flex items-center gap-4">
           <div className="bg-green-50 p-3 rounded-full text-green-600"><Users size={24} /></div>
           <div>
             <p className="text-sm text-gray-500">Total Submissions</p>
             <p className="text-3xl font-bold text-gray-800">{totalEvaluations}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-6">Top Performing Vendors (Avg Score)</h3>
            <div className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topVendorsData} layout="vertical" margin={{ left: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false}/>
                     <XAxis type="number" domain={[0, 100]} hide />
                     <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                     <Tooltip cursor={{fill: 'transparent'}} />
                     <Bar dataKey="score" fill="#0f6cbd" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: '#666', fontSize: 12 }} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-6">Submissions by Department</h3>
            <div className="h-80">
               {deptData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie 
                         data={deptData} 
                         cx="50%" 
                         cy="50%" 
                         outerRadius={100} 
                         fill="#8884d8" 
                         dataKey="value" 
                         label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                       >
                         {deptData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip />
                       <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="flex h-full items-center justify-center text-gray-400">No submission data available</div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};