/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Search, User, MapPin, Notebook, Mail, Phone, Calendar, Heart } from 'lucide-react';
import { CustomerProfile } from '../types';

export default function CrmView() {
  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Note updates state
  const [activeNote, setActiveNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        setProfiles(data);
        if (data.length > 0) {
          setSelectedPhone(data[0].phoneNumber);
          setActiveNote(data[0].notes || '');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching customers:', err);
        setLoading(false);
      });
  }, []);

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || 
           p.phoneNumber.includes(q) || 
           p.city.toLowerCase().includes(q);
  });

  const activeProfile = profiles.find(p => p.phoneNumber === selectedPhone);

  const handleSaveNotes = () => {
    if (!selectedPhone) return;
    setSavingNote(true);

    fetch('/api/customers/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: selectedPhone, notes: activeNote })
    })
    .then(res => res.json())
    .then(() => {
      // Update local set
      setProfiles(prev => prev.map(p => {
        if (p.phoneNumber === selectedPhone) {
          return { ...p, notes: activeNote };
        }
        return p;
      }));
      setSavingNote(false);
      alert('CRM notes updated successfully!');
    })
    .catch(err => {
      console.error(err);
      setSavingNote(false);
    });
  };

  const handleSelectProfile = (p: CustomerProfile) => {
    setSelectedPhone(p.phoneNumber);
    setActiveNote(p.notes || '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div key="crm-root" className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      
      {/* Customer profiles list column */}
      <div className="md:col-span-5 bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-2xs h-[525px] flex flex-col">
        <div>
          <h2 className="text-base font-bold font-display text-slate-800">Customer Directory</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Explore total customer values, call history, and individual satisfaction levels.</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer name, phone..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Profiles list scrollable wrapper */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-10">No customer contact folders discovered.</p>
          ) : (
            filtered.map((p) => (
              <div
                id={`crm-card-${p.phoneNumber}`}
                key={p.phoneNumber}
                onClick={() => handleSelectProfile(p)}
                className={`p-3 rounded-xl border border-slate-100 text-xs transition-all cursor-pointer ${
                  selectedPhone === p.phoneNumber 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs leading-none">{p.name}</span>
                  <span className="text-[10px] font-medium opacity-80">{p.city}</span>
                </div>
                <div className="text-[10px] opacity-70 mt-1">{p.phoneNumber}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Profile Detail display panel column */}
      <div className="md:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs space-y-5 min-h-[525px] flex flex-col justify-between">
        
        {activeProfile ? (
          <div className="space-y-5 flex-1">
            
            {/* Header section card */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center font-bold text-sm">
                  {activeProfile.name.split(' ').map(x=>x[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base font-display">{activeProfile.name}</h3>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-0.5"><Phone size={10} /> {activeProfile.phoneNumber}</span>
                    <span className="flex items-center gap-0.5"><Mail size={10} /> {activeProfile.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-amber-50 rounded-lg px-2 py-1 text-amber-700 text-[10px] font-bold border border-amber-200">
                <Heart size={10} fill="currentColor" /> CSI: 4.8 / 5
              </div>
            </div>

            {/* CRM Profile content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-slate-600">
              
              {/* Left Order History list */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-2 border-b border-slate-50 pb-1 flex items-center gap-1">
                   Order History
                </h4>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {activeProfile.orders.map((ord) => (
                    <div key={ord.id} className="p-2 border border-slate-100 rounded-lg space-y-1 bg-slate-50/50">
                      <div className="flex justify-between font-mono font-bold text-slate-700 text-[10px]">
                        <span>{ord.id}</span>
                        <span>₹{ord.orderValue}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>{ord.paymentMethod}</span>
                        <span className="font-semibold text-indigo-600">{ord.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right call attempts list */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-2 border-b border-slate-50 pb-1 flex items-center gap-1">
                   Voice Call History
                </h4>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {activeProfile.calls.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">No automated dials mapped yet.</p>
                  ) : (
                    activeProfile.calls.map((c) => (
                      <div key={c.id} className="p-2 border border-slate-100 rounded-lg space-y-1 bg-slate-50/50">
                        <div className="flex justify-between text-[11px] font-medium text-slate-700">
                          <span>{c.type}</span>
                          <span className="font-mono text-[9px] bg-slate-100 px-1 py-0.5 rounded text-slate-500">{c.id}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-mono leading-relaxed truncate">{c.notes || 'Initiated schedule verification.'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Support notes manager pads */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Support Agent Memo Pad</label>
              <textarea
                value={activeNote}
                onChange={e => setActiveNote(e.target.value)}
                placeholder="Write customized business customer directives, delivery preferences or details..."
                className="w-full h-24 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-700"
              />
              <button
                id="btn-crm-save-note"
                onClick={handleSaveNotes}
                disabled={savingNote}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors self-start block"
              >
                {savingNote ? 'Updating memory...' : 'Save Agent Memo'}
              </button>
            </div>

          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center text-slate-400">
            Select a customer from directory to review details.
          </div>
        )}

      </div>

    </div>
  );
}
