import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/storage';
import { EvaluationTemplate, Vendor, User, Evaluation, EvaluationStatus, TemplateDepartment, ConsolidatedReport } from '../types';
import { Save, Send, AlertCircle, CheckCircle2, Lock, Paperclip, X } from 'lucide-react';
import { useToast } from '../components/Toast';

interface Props {
  user: User;
}

export const NewEvaluation: React.FC<Props> = ({ user }) => {
  const { addToast } = useToast();
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [period, setPeriod] = useState<string>('');
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [template, setTemplate] = useState<EvaluationTemplate | null>(null);
  const [userDepartmentSection, setUserDepartmentSection] = useState<TemplateDepartment | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [calculations, setCalculations] = useState<{deptScore: number}>({ deptScore: 0 });
  const [submitted, setSubmitted] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVendors(db.vendors.getAll().filter(v => v.status === 'Active'));
    const periods = db.periods.getAll().filter(p => p.status === 'Open');
    setAvailablePeriods(periods.map(p => p.name));
    if (periods.length > 0) {
      setPeriod(periods[0].name);
    }
  }, []);

  useEffect(() => {
    setErrorMsg('');
    setUserDepartmentSection(null);
    setTemplate(null);
    setScores({});
    setComments({});
    setEvidenceFile(null);

    if (selectedVendorId) {
      const vendor = vendors.find(v => v.vendorId === selectedVendorId);
      if (vendor) {
        const tmpl = db.templates.getByType(vendor.vendorType);
        
        if (!tmpl) {
          setErrorMsg(`No evaluation template found for vendor type: ${vendor.vendorType}`);
          return;
        }

        setTemplate(tmpl);
        
        const deptSection = tmpl.structure.find(d => d.departmentName.toLowerCase() === user.department.toLowerCase());
        
        if (deptSection) {
          setUserDepartmentSection(deptSection);
        } else {
          setErrorMsg(`You are in Department "${user.department}", but this vendor type (${vendor.vendorType}) does not require evaluation from your department.`);
        }
      }
    }
  }, [selectedVendorId, vendors, period, user.department]);

  useEffect(() => {
    if (!userDepartmentSection) return;
    let deptRawSum = 0;
    userDepartmentSection.criteria.forEach(crit => {
      const rawScore = scores[crit.criteriaId] || 0; 
      const weighted = (rawScore / 5) * crit.weightage;
      deptRawSum += weighted;
    });
    setCalculations({ deptScore: deptRawSum });
  }, [scores, userDepartmentSection]);

  const handleScoreChange = (criteriaId: string, val: number) => {
    setScores(prev => ({ ...prev, [criteriaId]: val }));
  };

  const handleCommentChange = (criteriaId: string, val: string) => {
    setComments(prev => ({ ...prev, [criteriaId]: val }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        if (evt.target?.result) {
            setEvidenceFile(evt.target.result as string);
            addToast("Evidence attached successfully", "success");
        }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!selectedVendorId || !userDepartmentSection || !template) return;
    
    const allCriteriaIds = userDepartmentSection.criteria.map(c => c.criteriaId);
    const filled = allCriteriaIds.every(id => scores[id] !== undefined && scores[id] > 0);
    
    if (!filled) {
      addToast("Please score all criteria before submitting.", "error");
      return;
    }

    const vendor = vendors.find(v => v.vendorId === selectedVendorId)!;
    
    const evaluation: Evaluation = {
      evaluationId: crypto.randomUUID(),
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      vendorType: vendor.vendorType,
      evaluatorId: user.userId,
      evaluatorName: user.displayName,
      department: user.department,
      submittedDate: new Date().toISOString(),
      period: period,
      status: EvaluationStatus.Submitted,
      scores: Object.entries(scores).map(([k, v]) => ({ 
          criteriaId: k, 
          score: v as number,
          comment: comments[k]
      })),
      overallScore: calculations.deptScore,
      departmentScores: { [user.department]: calculations.deptScore },
      evidenceUrl: evidenceFile || undefined
    };

    db.evaluations.add(evaluation);
    
    const allEvals = db.evaluations.getAll().filter(e => e.vendorId === vendor.vendorId && e.period === period);
    const requiredDepts = template.structure.map(s => s.departmentName);
    const submittedDepts = allEvals.map(e => e.department);
    
    if (requiredDepts.every(req => submittedDepts.includes(req))) {
      let finalWeightedScore = 0;
      const deptBreakdown = [];
      const detailedCriteria = [];

      for (const dept of template.structure) {
        const deptEval = allEvals.find(e => e.department === dept.departmentName);
        if (deptEval) {
          finalWeightedScore += (deptEval.overallScore * dept.departmentWeight) / 100;
          
          deptBreakdown.push({
            departmentName: dept.departmentName,
            weight: dept.departmentWeight,
            score: deptEval.overallScore,
            evaluatorName: deptEval.evaluatorName,
            submittedDate: deptEval.submittedDate
          });

          deptEval.scores.forEach(s => {
             const critDef = dept.criteria.find(c => c.criteriaId === s.criteriaId);
             if (critDef) {
               detailedCriteria.push({
                 department: dept.departmentName,
                 criteria: critDef.criteriaName,
                 score: s.score,
                 weight: critDef.weightage,
                 comment: s.comment
               });
             }
          });
        }
      }

      const report: ConsolidatedReport = {
        reportId: crypto.randomUUID(),
        vendorId: vendor.vendorId,
        vendorName: vendor.vendorName,
        vendorType: vendor.vendorType,
        period: period,
        generatedDate: new Date().toISOString(),
        finalWeightedScore,
        departmentBreakdown,
        detailedCriteria
      };

      db.reports.add(report);
      addToast("Vendor Evaluation Cycle Complete! Final Report Generated.", "success");
    }

    setSubmitted(true);
    addToast("Evaluation submitted successfully!", "success");
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-lg shadow text-center animate-in fade-in zoom-in duration-300">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Department Evaluation Submitted!</h2>
        <p className="text-gray-600 mt-2">
          Your score for <strong>{user.department}</strong>: <span className="font-bold text-primary text-xl">{calculations.deptScore.toFixed(1)} / 100</span>
        </p>
        <button onClick={() => { setSubmitted(false); setSelectedVendorId(''); setScores({}); setComments({}); setEvidenceFile(null); }} className="mt-6 px-6 py-2 bg-primary text-white rounded hover:bg-blue-700">
          Start New Evaluation
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">New Vendor Evaluation</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Evaluation Period</label>
             <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none">
               {availablePeriods.map(p => (
                 <option key={p} value={p}>{p}</option>
               ))}
             </select>
           </div>
           <div className="md:col-span-2">
             <label className="block text-sm font-medium text-gray-700 mb-1">Select Vendor</label>
             <select value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none">
               <option value="">-- Choose Vendor --</option>
               {vendors.map(v => (
                 <option key={v.vendorId} value={v.vendorId}>{v.vendorName} ({v.vendorType})</option>
               ))}
             </select>
           </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 mb-6 border border-red-200">
          <AlertCircle size={20} />
          {errorMsg}
        </div>
      )}

      {userDepartmentSection ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center gap-2">
             <Lock size={16} className="text-blue-600" />
             <p className="text-sm text-blue-800">
               You are evaluating as <strong>{user.department}</strong>. 
               This section contributes <strong>{userDepartmentSection.departmentWeight}%</strong> to the final vendor score.
             </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">{userDepartmentSection.departmentName} Criteria</h3>
            </div>
            <div className="p-6 space-y-8">
              {userDepartmentSection.criteria.map(crit => {
                const score = scores[crit.criteriaId];
                const isLowScore = score !== undefined && score <= 2;

                return (
                  <div key={crit.criteriaId} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                    <div className="md:col-span-7">
                      <p className="font-bold text-gray-900 text-lg">{crit.criteriaName}</p>
                      <p className="text-sm text-gray-500 mt-1">{crit.elaboration}</p>
                      <div className="mt-2 flex items-center gap-2">
                         <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">Weight: {crit.weightage}%</span>
                      </div>
                      
                      {isLowScore && (
                          <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                              <label className="block text-xs font-bold text-red-600 mb-1 flex items-center gap-1">
                                  <AlertCircle size={12}/> Low Score Justification Required
                              </label>
                              <textarea 
                                className="w-full border border-red-200 bg-red-50 p-2 rounded text-sm focus:outline-none focus:border-red-400"
                                placeholder="Please explain why the performance was poor..."
                                value={comments[crit.criteriaId] || ''}
                                onChange={(e) => handleCommentChange(crit.criteriaId, e.target.value)}
                              ></textarea>
                          </div>
                      )}
                    </div>
                    <div className="md:col-span-5 flex flex-col items-end gap-2">
                      <div className="flex items-center justify-end space-x-2 bg-gray-50 p-1 rounded-full border border-gray-200">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button
                            key={val}
                            onClick={() => handleScoreChange(crit.criteriaId, val)}
                            className={`w-10 h-10 rounded-full font-bold transition-all ${
                              scores[crit.criteriaId] === val
                                ? 'bg-primary text-white scale-110 shadow-md ring-2 ring-offset-2 ring-primary'
                                : 'text-gray-400 hover:bg-white hover:text-primary'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <Paperclip size={18} /> Supporting Documents (Optional)
              </h4>
              
              <div className="flex items-center gap-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-gray-300 bg-white px-4 py-2 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                      Upload File
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
                  
                  {evidenceFile ? (
                      <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded text-sm">
                          <CheckCircle2 size={14} /> File Attached 
                          <button onClick={() => setEvidenceFile(null)} className="ml-2 hover:text-red-500"><X size={14}/></button>
                      </div>
                  ) : <span className="text-sm text-gray-400 italic">No file selected</span>}
              </div>
          </div>

          <div className="sticky bottom-4 z-40 bg-gray-900 text-white p-4 rounded-xl shadow-2xl flex justify-between items-center border border-gray-700">
            <div>
               <p className="text-sm opacity-60 uppercase tracking-widest font-bold">Department Score</p>
               <p className="text-3xl font-black">{calculations.deptScore.toFixed(1)} <span className="text-lg opacity-50 font-normal">/ 100</span></p>
            </div>
            <div className="flex space-x-4">
               <button 
                 onClick={handleSubmit}
                 className="bg-primary hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold flex items-center shadow-lg transition-transform hover:scale-105 active:scale-95"
               >
                 <Send size={18} className="mr-2" /> Submit Evaluation
               </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};