import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/storage';
import { User, Vendor, Evaluation } from '../types';
import { ClipboardList, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';

interface Props {
  user: User;
}

export const EvaluatorDashboard: React.FC<Props> = ({ user }) => {
  const [activePeriod, setActivePeriod] = useState('2023-Q4');
  const [pendingVendors, setPendingVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    const vendors = db.vendors.getAll().filter(v => v.status === 'Active');
    const myEvals = db.evaluations.getByEvaluator(user.userId).filter(e => e.period === activePeriod);
    const templates = db.templates.getAll();

    const pending = vendors.filter(v => {
      const template = templates.find(t => t.vendorType === v.vendorType);
      if (!template) return false;
      const requiresMyDept = template.structure.some(s => s.departmentName === user.department);
      if (!requiresMyDept) return false;
      const submitted = myEvals.some(e => e.vendorId === v.vendorId && e.department === user.department);
      return !submitted;
    });

    setPendingVendors(pending);
  }, [user, activePeriod]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-primary to-blue-800 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.displayName}</h1>
          <p className="text-blue-100 opacity-90">Department: {user.department}</p>
          <div className="mt-6 flex items-center gap-4">
             <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
                <span className="text-xs text-blue-200 uppercase tracking-wider block">Current Period</span>
                <div className="flex items-center gap-2 font-bold text-lg">
                   <Calendar size={18} />
                   <select 
                     value={activePeriod} 
                     onChange={e => setActivePeriod(e.target.value)}
                     className="bg-transparent border-none focus:ring-0 cursor-pointer text-white font-bold p-0"
                   >
                     <option value="2023-Q4" className="text-gray-800">2023-Q4</option>
                     <option value="2024-Q1" className="text-gray-800">2024-Q1</option>
                   </select>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
               <ClipboardList className="text-primary"/> 
               Pending Evaluations for {activePeriod}
            </h3>
         </div>
         
         {pendingVendors.length > 0 ? (
           <table className="w-full text-left text-sm">
             <tbody className="divide-y divide-gray-100">
               {pendingVendors.map(v => (
                 <tr key={v.vendorId} className="hover:bg-gray-50 transition-colors">
                   <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{v.vendorName}</div>
                      <div className="text-xs text-gray-500">{v.vendorType}</div>
                   </td>
                   <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-orange-500"></span> Not Started
                      </div>
                   </td>
                   <td className="px-6 py-4 text-right">
                      <Link 
                        to="/evaluator/new" 
                        className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors"
                      >
                        Evaluate Now
                      </Link>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         ) : (
           <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                 <CheckCircle className="text-green-500" size={32} />
              </div>
              <h4 className="text-lg font-bold text-gray-800">All Caught Up!</h4>
              <p className="text-gray-500 max-w-sm mt-2">You have completed all assigned evaluations for {user.department} in this period.</p>
           </div>
         )}
      </div>
    </div>
  );
};