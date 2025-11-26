import React, { useState, useEffect } from 'react';
import { db } from '../services/storage';
import { Vendor, VendorType } from '../types';
import { Edit, Plus, Search, Power, Trash2, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../components/Toast';

export const Vendors: React.FC = () => {
  const { addToast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filter, setFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Partial<Vendor>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setVendors(db.vendors.getAll());
  }, []);

  const filtered = vendors.filter(v => 
    v.vendorName.toLowerCase().includes(filter.toLowerCase()) || 
    v.vendorType.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSave = () => {
    if (editingVendor.vendorId) {
      db.vendors.update(editingVendor as Vendor);
      addToast("Vendor updated successfully", "success");
    } else {
      db.vendors.add({ ...editingVendor, vendorId: crypto.randomUUID(), status: 'Active' } as Vendor);
      addToast("New vendor created", "success");
    }
    setVendors(db.vendors.getAll());
    setIsModalOpen(false);
    setEditingVendor({});
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const action = currentStatus === 'Active' ? 'Deactivate' : 'Activate';
    if (window.confirm(`Are you sure you want to ${action} this vendor?`)) {
      db.vendors.toggleStatus(id);
      setVendors(db.vendors.getAll());
      addToast(`Vendor ${action}d`, "info");
    }
  };

  const confirmDelete = () => {
    if (deleteId) {
        db.vendors.delete(deleteId);
        setVendors(db.vendors.getAll());
        setDeleteId(null);
        addToast("Vendor permanently deleted", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Vendor Management</h2>
        <button 
          onClick={() => { setEditingVendor({ vendorType: VendorType.Transport }); setIsModalOpen(true); }}
          className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 shadow-sm"
        >
          <Plus size={18} /> New Vendor
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search vendors..." 
              className="pl-10 w-full md:w-80 p-2 border rounded bg-white focus:ring-1 focus:ring-primary focus:outline-none"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
        </div>
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-100 text-xs uppercase font-medium text-gray-500">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(v => (
              <tr key={v.vendorId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 font-medium text-gray-900">{v.vendorName}</td>
                <td className="px-6 py-3"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-100">{v.vendorType}</span></td>
                <td className="px-6 py-3">{v.contactEmail}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${v.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {v.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-right space-x-2">
                  <button onClick={() => { setEditingVendor(v); setIsModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" title="Edit">
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(v.vendorId, v.status)} 
                    className={`${v.status === 'Active' ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'} p-1.5 rounded transition-colors`} 
                    title={v.status === 'Active' ? 'Deactivate' : 'Activate'}
                  >
                    <Power size={16} />
                  </button>
                  <button 
                    onClick={() => setDeleteId(v.vendorId)} 
                    className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                    title="Delete Permanently"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">{editingVendor.vendorId ? 'Edit Vendor' : 'New Vendor'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input className="w-full border p-2 rounded" value={editingVendor.vendorName || ''} onChange={e => setEditingVendor({...editingVendor, vendorName: e.target.value})} placeholder="e.g. Acme Logistics" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Type</label>
                <select className="w-full border p-2 rounded" value={editingVendor.vendorType} onChange={e => setEditingVendor({...editingVendor, vendorType: e.target.value as VendorType})}>
                  {Object.values(VendorType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input className="w-full border p-2 rounded" value={editingVendor.contactEmail || ''} onChange={e => setEditingVendor({...editingVendor, contactEmail: e.target.value})} placeholder="contact@company.com" />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-lg">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded font-medium">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 font-medium shadow-sm">Save Vendor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};