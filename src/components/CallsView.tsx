/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  PhoneCall, 
  Calendar, 
  Clock, 
  FolderLock, 
  Search, 
  FileAudio, 
  BookOpen, 
  RefreshCw, 
  AlertTriangle, 
  Play, 
  CheckCircle,
  HelpCircle,
  User,
  Activity
} from 'lucide-react';
import { Call, CallType } from '../types';

interface CallsViewProps {
  calls: Call[];
  onCallsUpdated: () => void;
}

export default function CallsView({ calls, onCallsUpdated }: CallsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [activePlayback, setActivePlayback] = useState<string | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  // New call scheduling state
  const [scheduleOrder, setScheduleOrder] = useState('');
  const [scheduleType, setScheduleType] = useState<CallType>('COD Verification');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleErr, setScheduleErr] = useState('');

  const filtered = calls.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.id.toLowerCase().includes(q) ||
                        c.customerName.toLowerCase().includes(q) ||
                        c.phoneNumber.includes(q) ||
                        (c.notes && c.notes.toLowerCase().includes(q));
    const matchType = selectedType === 'All' || c.type === selectedType;
    return matchSearch && matchType;
  });

  // Handle call retry routing
  const handleRetryCall = (call: Call) => {
    fetch('/api/calls/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: call.orderId,
        type: call.type,
        scheduledAt: new Date().toISOString()
      })
    })
    .then(res => res.json())
    .then(() => {
      onCallsUpdated();
      alert(`Retrying call scheduled immediately for ${call.customerName}.`);
    })
    .catch(err => console.error('Error scheduling retry:', err));
  };

  // Dynamic Browser Text-to-Speech simulation representing call recording playback
  const handleTTSPlayback = (call: Call) => {
    if (!call.transcript) return;
    
    if (activePlayback === call.id) {
      window.speechSynthesis.cancel();
      setActivePlayback(null);
      return;
    }

    window.speechSynthesis.cancel();
    setActivePlayback(call.id);

    // Parse transcript to play clean speech line by line
    const cleanLines = call.transcript
      .replace(/OrderVoice AI:|Customer:/g, '')
      .split('.')
      .map(x => x.trim())
      .filter(x => x.length > 0);

    let utterIdx = 0;
    
    const speakNext = () => {
      if (utterIdx >= cleanLines.length) {
        setActivePlayback(null);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanLines[utterIdx]);
      
      // Basic language setting for localized speech synthesis
      if (call.languageDetected === 'Hindi') {
        utterance.lang = 'hi-IN';
      } else if (call.languageDetected === 'Bengali') {
        utterance.lang = 'bn-IN';
      } else {
        utterance.lang = 'en-US';
      }

      utterance.onend = () => {
        utterIdx++;
        speakNext();
      };

      utterance.onerror = () => {
        setActivePlayback(null);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleOrder || !scheduleTime) {
      setScheduleErr('Please verify both Order ID and Schedule Date.');
      return;
    }

    fetch('/api/calls/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: scheduleOrder.toUpperCase(),
        type: scheduleType,
        scheduledAt: new Date(scheduleTime).toISOString()
      })
    })
    .then(res => {
      if (!res.ok) throw new Error('Order not found');
      return res.json();
    })
    .then(() => {
      onCallsUpdated();
      setShowScheduleForm(false);
      setScheduleOrder('');
      setScheduleTime('');
      setScheduleErr('');
    })
    .catch(() => {
      setScheduleErr('Order ID not found in system storage.');
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Scheduled':
        return 'text-sky-700 bg-sky-50 border-sky-200';
      case 'No-Answer':
        return 'text-slate-600 bg-slate-50 border-slate-200';
      case 'Failed':
        return 'text-rose-700 bg-rose-50 border-rose-250';
      default:
        return 'text-amber-700 bg-amber-50 border-amber-250';
    }
  };

  return (
    <div key="calls-root" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900">Call Logs & Scheduler</h1>
          <p className="text-xs text-slate-400">Review automated customer conversations, generated transcripts, and schedule dialing tasks.</p>
        </div>
        <button 
          id="btn-schedule-call"
          onClick={() => setShowScheduleForm(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl flex items-center gap-1.5 self-start cursor-pointer shadow-sm"
        >
          <Calendar size={14} /> Schedule AI Call
        </button>
      </div>

      {/* Scheduler Form popup modal */}
      {showScheduleForm && (
        <div id="modal-scheduler" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold font-display text-slate-800 text-base">Schedule Outbound AI task</h3>
              <button 
                onClick={() => setShowScheduleForm(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
            </div>

            {scheduleErr && (
              <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-lg flex items-center gap-1.5">
                <AlertTriangle size={14} />
                <span>{scheduleErr}</span>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs text-slate-600">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Associated Order ID</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. ORD-5481"
                  value={scheduleOrder}
                  onChange={e => setScheduleOrder(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Automated Call Type</label>
                <select
                  value={scheduleType}
                  onChange={e => setScheduleType(e.target.value as CallType)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="COD Verification">COD Verification</option>
                  <option value="Order Confirmation">Order Confirmation</option>
                  <option value="Shipping Update">Shipping Update</option>
                  <option value="Delivery Reminder">Delivery Reminder</option>
                  <option value="Failed Delivery Recovery">Failed Delivery Recovery</option>
                  <option value="Feedback Collection">Feedback Collection</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Schedule Time</label>
                <input 
                  type="datetime-local"
                  required
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-700"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowScheduleForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Close
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-xs cursor-pointer"
                >
                  Schedule Outbound
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Options */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs by customer name, phone, AI notes..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['All', 'COD Verification', 'Failed Delivery Recovery', 'Feedback Collection'].map((t) => (
            <button
              id={`calltype-filter-${t.replace(' ', '-')}`}
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                selectedType === t 
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Logs Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white border border-slate-150 rounded-xl p-10 text-center text-slate-400 italic">
            No matching automated call events discovered.
          </div>
        ) : (
          filtered.map((call) => {
            return (
              <div id={`call-card-${call.id}`} key={call.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition-all duration-250 flex flex-col justify-between">
              <div>
                {/* Header indicators */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 px-2 rounded-lg bg-indigo-50 border border-indigo-100 font-mono text-[10px] font-bold text-indigo-700">
                      {call.id}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">{call.type}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${getStatusStyle(call.status)}`}>
                    {call.status}
                  </span>
                </div>

                {/* Body Content */}
                <div className="mt-3.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-slate-50 text-slate-500">
                      <User size={13} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">{call.customerName}</h4>
                      <p className="text-[10px] text-slate-400">{call.phoneNumber}</p>
                    </div>
                  </div>

                  {/* AI summary */}
                  {call.notes && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
                        <Activity size={10} strokeWidth={3} /> Quality Analyst Note
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600">{call.notes}</p>
                    </div>
                  )}

                  {/* Meta stats tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {call.languageDetected && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                        🌐 {call.languageDetected}
                      </span>
                    )}
                    {call.customerIntent && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                        ⚡ {call.customerIntent}
                      </span>
                    )}
                    {call.durationSeconds > 0 && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1">
                        <Clock size={10} /> {call.durationSeconds}s duration
                      </span>
                    )}
                    {call.escalationRequired && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-widest animate-pulse">
                        ⚠️ Escalated to Human
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Backing action trigger */}
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between gap-2.5">
                {call.transcript ? (
                  <button
                    id={`btn-play-rec-${call.id}`}
                    onClick={() => handleTTSPlayback(call)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50/50 hover:bg-indigo-100/50 px-3 py-1.5 rounded-lg border border-indigo-100/30 transition-all cursor-pointer"
                  >
                    <Play size={10} fill="currentColor" /> 
                    {activePlayback === call.id ? 'Stop Playing' : 'Play Voice Recording'}
                  </button>
                ) : (
                  <div className="text-[10px] text-slate-400 italic">No audio recorded. No Answer.</div>
                )}

                {['Failed', 'No-Answer', 'Busy'].includes(call.status) && (
                  <button
                    id={`btn-retry-${call.id}`}
                    onClick={() => handleRetryCall(call)}
                    className="text-xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-1 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer"
                  >
                    <RefreshCw size={11} className="text-slate-400" /> Redial
                  </button>
                )}
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
}
