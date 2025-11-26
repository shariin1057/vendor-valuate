import React, { useState, useEffect } from 'react';
import { db } from '../services/storage';
import { User, Evaluation } from '../types';
import { Eye, Calendar, User as UserIcon, Building } from 'lucide-react';

interface Props {
  user: User;
}

export const EvaluatorHistory: React.FC<Props> = ({ user }) => {
  const [history, setHistory] = useState<Evaluation[]>([]);
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);

  useEffect(() => {
    setHistory(db.evaluations.getByEvaluator(user.userId));
  }, [user]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Evaluation History</h2>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
         <table className="w-full text-left text-sm text-gray-600">
           <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
             <tr>
               <th className="px-6 py-4">Date Submitted</th>
               <th className="px-6 py-4">Period</th>
               <th className="px-6 py-4">Vendor</th>
               <th className="px-6 py-4">Score</th>
               <th className="px-6 py-4 text-right">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
             {history.length > 0 ? history.map(h => (
               <tr key={h.evaluationId} className="hover:bg-gray-50">
                 <td className="px-6 py-4">{new Date(h.submittedDate).toLocaleDateString()}</td>
                 <td className="px-6 py-4">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200">{h.period}</span>
                 </td>
                 <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{h.vendorName}</div>
                    <div className="text-xs text-gray-400">{h.vendorType}</div>
                 </td>
                 <td className="px-6 py-4">
                    <span className={`font-bold ${h.overallScore > 80 ? 'text-green-600' : h.overallScore > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                       {h.overallScore.toFixed(1)}
                    </span>
                 </td>
                 <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedEval(h)}
                      className="text-primary hover:text-blue-700 flex items-center justify-end gap-1 ml-auto"
                    >
                       <Eye size={16} /> View
                    </button>
                 </td>
               </tr>
             )) : (
               <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">No history available yet.</td></tr>
             )}
           </tbody>
         </table>
      </div>

      {selectedEval && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-200">
              <div className="bg-primary text-white p-6 sticky top-0">
                 <h3 className="text-xl font-bold">{selectedEval.vendorName}</h3>
                 <div className="flex gap-4 mt-2 text-blue-100 text-sm">
                    <span className="flex items-center gap-1"><Calendar size={14}/> {selectedEval.period}</span>
                    <span className="flex items-center gap-1"><Building size={14}/> {selectedEval.vendorType}</span>
                 </div>
                 <button onClick={() => setSelectedEval(null)} className="absolute top-6 right-6 text-white/80 hover:text-white">✕</button>
              </div>
              
              <div className="p-8">
                 <div className="flex justify-between items-center mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div>
                       <p className="text-sm text-gray-500">Evaluated By</p>
                       <p className="font-bold text-gray-800 flex items-center gap-2"><UserIcon size={16}/> {selectedEval.evaluatorName}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm text-gray-500">Department Score</p>
                       <p className="text-3xl font-bold text-primary">{selectedEval.overallScore.toFixed(1)}</p>
                    </div>
                 </div>

                 <h4 className="font-bold text-gray-700 border-b pb-2 mb-4">Detailed Criteria Scores</h4>
                 <div className="space-y-4">
                    {selectedEval.scores.map((s, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                         <span className="text-gray-600 font-medium">Criteria ID: {s.criteriaId}</span>
                         <span className="font-mono font-bold bg-blue-50 text-blue-700 w-8 h-8 flex items-center justify-center rounded">{s.score}</span>
                      </div>
                    ))}
                 </div>
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                 <button onClick={() => setSelectedEval(null)} className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100">Close</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};