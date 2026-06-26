/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Settings, 
  FileText, 
  Shield, 
  Terminal, 
  RefreshCw, 
  PhoneCall, 
  KeyRound, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Database,
  Lock,
  Globe
} from 'lucide-react';
import { Company, BillingInvoice } from '../types';

export default function SettingsView() {
  const [activeSection, setActiveSection] = useState<'billing' | 'voip' | 'api' | 'security'>('billing');
  const [company, setCompany] = useState<Company | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // VoIP configs state
  const [voiceProvider, setVoiceProvider] = useState<'twilio' | 'exotel'>('twilio');
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [fromNumber, setFromNumber] = useState('');

  useEffect(() => {
    // Fetch billing details
    fetch('/api/billing')
      .then(res => res.json())
      .then(data => {
        setCompany(data.company);
        setInvoices(data.invoices);
        setVoiceProvider(data.company.voiceProvider);
        setAccountSid(data.company.voiceConfig.accountSid);
        setAuthToken(data.company.voiceConfig.authToken);
        setFromNumber(data.company.voiceConfig.fromNumber);
        
        // Fetch audit logs as well
        return fetch('/api/audit-logs');
      })
      .then(res => res.json())
      .then(logs => {
        setAuditLogs(logs);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching settings:', err);
        setLoading(false);
      });
  }, []);

  const handleUpgradePlan = (plan: 'starter' | 'professional' | 'enterprise') => {
    if (!confirm(`Do you wish to confirm switching your SaaS subscription to ${plan.toUpperCase()} plan?`)) return;

    fetch('/api/billing/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan })
    })
    .then(res => res.json())
    .then(data => {
      setCompany(data.company);
      alert(`Subscription successfully migrated to ${plan.toUpperCase()}! Your billing thresholds are updated.`);
    })
    .catch(err => console.error(err));
  };

  const handleSaveVoip = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/company/voip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voiceProvider, accountSid, authToken, fromNumber })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setCompany(data.company);
        alert('VoIP Carrier credentials synchronized and saved successfully! Webhooks are now active.');
      } else {
        alert('Failed to update VoIP settings.');
      }
    })
    .catch(err => {
      console.error(err);
      alert('Error updating VoIP settings.');
    });
  };

  if (loading || !company) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Navigation Items
  const navItems = [
    { key: 'billing', label: 'Subscription & Plans', icon: CreditCard },
    { key: 'voip', label: 'VoIP Trunk Setupings', icon: PhoneCall },
    { key: 'api', label: 'REST OpenAPI Specs', icon: Terminal },
    { key: 'security', label: 'Security Audit Ledger', icon: Shield },
  ];

  return (
    <div key="settings-root" className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      
      {/* Sub tabs navigation */}
      <div className="md:col-span-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              id={`settings-subtab-${item.key}`}
              key={item.key}
              onClick={() => setActiveSection(item.key as any)}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeSection === item.key 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-white border.5 border-slate-100 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Pane Content body */}
      <div className="md:col-span-9 bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs min-h-[450px]">
        
        {/* Billing & Plans sub-tab */}
        {activeSection === 'billing' && (
          <div className="space-y-6 animate-fade-in text-xs text-slate-600">
            <div>
              <h2 className="text-base font-bold font-display text-slate-800">SaaS Subscription & Volume Meter</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Understand call volumes limit, upgrade plans, and view invoices.</p>
            </div>

            {/* Calls usage limits tracker card */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Account Monthly Dial Volume</span>
                <span>{company.callsUsed?.toLocaleString()} / {company.callsLimit === 999999 ? 'Unlimited' : company.callsLimit?.toLocaleString()} calls</span>
              </div>
              
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (company.callsUsed / company.callsLimit) * 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Starter plan threshold: 1,000 calls</span>
                <span className="font-semibold text-indigo-600">Upgrade to eliminate daily queues limits</span>
              </div>
            </div>

            {/* Plan tier grid options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Starter */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${company.subscriptionPlan === 'starter' ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-150'}`}>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm font-display mb-1 flex items-center justify-between">
                    Starter {company.subscriptionPlan === 'starter' && <span className="text-[9px] bg-indigo-100 text-indigo-700.5 py-0.5 px-1.5 rounded uppercase font-semibold">Active</span>}
                  </h3>
                  <div className="text-xl font-bold font-display text-slate-950 mb-3">₹10,999<span className="text-[10px] font-normal text-slate-400">/mo</span></div>
                  <ul className="space-y-1.5 text-[10px] text-slate-500">
                    <li className="flex items-center gap-1">✓ 1,000 Outbound Call Cycles</li>
                    <li className="flex items-center gap-1">✓ English & Hindi coverage</li>
                    <li className="flex items-center gap-1">✓ Basic logs records (7 days)</li>
                  </ul>
                </div>
                {company.subscriptionPlan !== 'starter' && (
                  <button onClick={() => handleUpgradePlan('starter')} className="mt-4 w-full py-1.5 bg-white border border-slate-250 text-slate-700 font-semibold text-[10px] rounded-lg hover:bg-slate-50 cursor-pointer">
                    Downgrade
                  </button>
                )}
              </div>

              {/* Professional */}
              <div className={`p-4 rounded-xl border relative flex flex-col justify-between ${company.subscriptionPlan === 'professional' ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-150'}`}>
                <span className="absolute -top-2.5 right-3 bg-indigo-600 text-white text-[8px] uppercase tracking-widest font-bold font-sans py-0.5 px-2 rounded-full shadow-xs">Popular</span>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm font-display mb-1 flex items-center justify-between">
                    Professional {company.subscriptionPlan === 'professional' && <span className="text-[9px] bg-indigo-100 text-indigo-700 py-0.5 px-1.5 rounded uppercase font-semibold">Active</span>}
                  </h3>
                  <div className="text-xl font-bold font-display text-slate-950 mb-3">₹24,999<span className="text-[10px] font-normal text-slate-400">/mo</span></div>
                  <ul className="space-y-1.5 text-[10px] text-slate-500">
                    <li className="flex items-center gap-1 font-semibold text-slate-700">✓ 10,000 Call Cycles</li>
                    <li className="flex items-center gap-1 text-indigo-600">✓ English + Hindi + Bengali</li>
                    <li className="flex items-center gap-1">✓ Real Gemini Conversational natural API</li>
                    <li className="flex items-center gap-1">✓ 30 days Call recording</li>
                  </ul>
                </div>
                {company.subscriptionPlan !== 'professional' && (
                  <button onClick={() => handleUpgradePlan('professional')} className="mt-4 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px] rounded-lg cursor-pointer">
                    Activate Plan
                  </button>
                )}
              </div>

              {/* Enterprise */}
              <div className={`p-4 rounded-xl border flex flex-col justify-between ${company.subscriptionPlan === 'enterprise' ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-150'}`}>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm font-display mb-1 flex items-center justify-between">
                    Enterprise {company.subscriptionPlan === 'enterprise' && <span className="text-[9px] bg-indigo-100 text-indigo-700 py-0.5 px-1.5 rounded uppercase font-semibold">Active</span>}
                  </h3>
                  <div className="text-xl font-bold font-display text-slate-950 mb-3">₹89,999<span className="text-[10px] font-normal text-slate-400">/mo</span></div>
                  <ul className="space-y-1.5 text-[10px] text-slate-500">
                    <li className="flex items-center gap-1">✓ Custom unlimited calls volume</li>
                    <li className="flex items-center gap-1 text-slate-600 font-semibold">✓ Dedicated SIP trunks</li>
                    <li className="flex items-center gap-1">✓ Live supervisor escalations</li>
                    <li className="flex items-center gap-1">✓ Premium SLA guarantees</li>
                  </ul>
                </div>
                {company.subscriptionPlan !== 'enterprise' && (
                  <button onClick={() => handleUpgradePlan('enterprise')} className="mt-4 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px] rounded-lg cursor-pointer">
                    Upgrade Enterprise
                  </button>
                )}
              </div>
            </div>

            {/* Invoices table segment */}
            <div className="space-y-2 pt-3">
              <h3 className="font-bold text-slate-800 tracking-tight text-xs flex items-center gap-1">
                <FileText size={13} className="text-slate-400" /> Historic SaaS Receipts Invoices
              </h3>
              <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-[11px] text-slate-500">
                  <thead className="bg-slate-50 uppercase text-slate-600 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2">Invoice Code</th>
                      <th className="px-4 py-2">Cycle Date</th>
                      <th className="px-4 py-2">Volume</th>
                      <th className="px-4 py-2">Total Pack Amount</th>
                      <th className="px-4 py-2 text-right">Receipt status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-mono text-indigo-600">{inv.invoiceNumber}</td>
                        <td className="px-4 py-2.5">{inv.date}</td>
                        <td className="px-4 py-2.5">{inv.callsVolume?.toLocaleString()} calls used</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">₹{inv.amount?.toLocaleString()} ({company.subscriptionPlan})</td>
                        <td className="px-4 py-2.5 text-right font-medium text-emerald-600">✓ {inv.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VoIP Configs sub-tab */}
        {activeSection === 'voip' && (
          <div className="space-y-6 animate-fade-in text-xs text-slate-600">
            <div>
              <h2 className="text-base font-bold font-display text-slate-800">VoIP Trunk Integration Gateways</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Configure Exotel or Twilio VoIP credentials for enterprise carrier dialings.</p>
            </div>

            <form onSubmit={handleSaveVoip} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">VOIP Provider Selection</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input 
                      type="radio" 
                      name="voiceProvider" 
                      checked={voiceProvider === 'twilio'} 
                      onChange={() => setVoiceProvider('twilio')} 
                    />
                    Twilio Cloud Dials
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input 
                      type="radio" 
                      name="voiceProvider" 
                      checked={voiceProvider === 'exotel'} 
                      onChange={() => setVoiceProvider('exotel')} 
                    />
                    Exotel Trunk India
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {voiceProvider === 'twilio' ? 'Twilio Account SID' : 'Exotel API Key SID'}
                  </label>
                  <input 
                    type="password"
                    value={accountSid}
                    onChange={e => setAccountSid(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {voiceProvider === 'twilio' ? 'Twilio Auth Token' : 'Exotel Auth Token secret'}
                  </label>
                  <input 
                    type="password"
                    value={authToken}
                    onChange={e => setAuthToken(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">PROGRAMMATIC FROM CALLER CLI NUMBER</label>
                <input 
                  type="text"
                  value={fromNumber}
                  onChange={e => setFromNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono max-w-sm"
                />
                <p className="text-[10px] text-slate-400 mt-2">All verification outcomes undergo live Webhook mapping dynamically.</p>
              </div>

              <button 
                type="submit" 
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs w-full sm:w-auto"
              >
                Sync VoIP Trunk Gateways
              </button>
            </form>

            {/* Dynamic Webhook Configuration Panel */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs mt-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <Globe size={16} className="text-indigo-600" />
                <div>
                  <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Dynamic Voice Provider Routing Webhooks
                  </h4>
                  <p className="text-[10px] text-slate-400">Configure these endpoints to process real-time incoming actions and call-state transitions.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                    {voiceProvider === 'twilio' ? 'Twilio Voice Request URL (HTTP POST)' : 'Exotel Inbound applet URL'}
                  </span>
                  <div className="flex gap-2">
                    <code className="bg-slate-100 border border-slate-200 text-slate-750 font-mono text-[10px] p-2 rounded-xl select-all block w-full truncate font-semibold">
                      {window.location.origin}/api/voice/{voiceProvider}/incoming?orderId=ORD-5481&amp;callType=COD%20Verification
                    </code>
                  </div>
                  <p className="text-[9px] text-slate-400">Query parameters of orderId and callType are processed by Gemini to respond with TwiML speech synthesis.</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                    {voiceProvider === 'twilio' ? 'Twilio Status callback URL (HTTP POST)' : 'Exotel Call Status callback URL'}
                  </span>
                  <div className="flex gap-2">
                    <code className="bg-slate-100 border border-slate-200 text-slate-750 font-mono text-[10px] p-2 rounded-xl select-all block w-full truncate font-semibold">
                      {window.location.origin}/api/voice/{voiceProvider}/status-callback
                    </code>
                  </div>
                  <p className="text-[9px] text-slate-400">Saves the final call duration, recording metadata, and updates call state in the analytics pipeline.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REST API specs sub-tab */}
        {activeSection === 'api' && (
          <div className="space-y-5 animate-fade-in text-xs text-slate-600 h-[480px] overflow-y-auto pr-1">
            <div>
              <h2 className="text-base font-bold font-display text-slate-800">REST APIS Gateway documentation</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Integrate OrderVoice API programmatic outbound dials into your ERP systems.</p>
            </div>

            {/* Rate limiting info banner */}
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-[11px] text-amber-800 flex items-center gap-2">
              <Lock size={14} className="text-amber-600" />
              <span>SaaS Limit: 10 calls/sec. Standard Custom Header requirement: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">Authorization: Bearer [API_KEY]</code></span>
            </div>

            {/* Swagger specs endpoints list */}
            <div className="space-y-4">
              
              {/* Endpoint 1 */}
              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <div className="bg-indigo-50/50 p-3 px-4 border-b border-slate-150 flex items-center gap-2 font-semibold">
                  <span className="bg-indigo-600 text-white font-mono text-[9px] py-0.5 px-2 rounded">POST</span>
                  <span className="font-mono text-slate-800">/api/orders</span>
                </div>
                <div className="p-4 space-y-2 leading-relaxed">
                  <p className="text-slate-500 text-[11px]">Injects an incoming ecommerce order cart to process voice call verification queue pipelines.</p>
                  <label className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Parameters Payload (JSON):</label>
                  <pre className="bg-slate-900 text-emerald-400 font-mono text-[10px] p-3 rounded-lg overflow-x-auto">
{`{
  "customerName": "Sanjay Singh",
  "phoneNumber": "+919420445566",
  "email": "sanjay@gmail.com",
  "address": "Sector 15, Dwarka",
  "city": "New Delhi",
  "state": "Delhi",
  "pincode": "110075",
  "orderValue": 2499,
  "paymentMethod": "COD"
}`}
                  </pre>
                </div>
              </div>

              {/* Endpoint 2 */}
              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <div className="bg-sky-50 p-3 px-4 border-b border-slate-150 flex items-center gap-2 font-semibold">
                  <span className="bg-sky-500 text-white font-mono text-[9px] py-0.5 px-2 rounded">GET</span>
                  <span className="font-mono text-slate-800">/api/orders</span>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-slate-500 text-[11px]">Enables filters query offsets searching. Parameters: <code className="bg-slate-100 p-0.5 font-mono text-[11px]">?status=Pending%20Verification&search=Rajesh</code></p>
                </div>
              </div>

              {/* Endpoint 3 */}
              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <div className="bg-slate-50 p-3 px-4 border-b border-slate-150 flex items-center gap-2 font-semibold">
                  <span className="bg-slate-800 text-white font-mono text-[9px] py-0.5 px-2 rounded">POST</span>
                  <span className="font-mono text-slate-800">/api/calls/schedule</span>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-slate-500 text-[11px]">Programmatically schedule or redial outbound calls scenarios.</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Security Audit ledger sub-tab */}
        {activeSection === 'security' && (
          <div className="space-y-4 animate-fade-in text-xs text-slate-600 h-[480px] overflow-y-auto pr-1">
            <div>
              <h2 className="text-base font-bold font-display text-slate-800 flex items-center gap-1.5">
                <Shield size={16} className="text-indigo-600" /> Security ISO Audit Ledger logs
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Complete untampered security records logs logging RBAC activities.</p>
            </div>

            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/55 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:border-slate-350 transition-colors duration-150">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-md font-bold text-slate-700">
                      {log.action}
                    </span>
                    <p className="text-xs text-slate-850 font-semibold mt-1">{log.details}</p>
                    <div className="text-[9px] text-slate-400">User: <code className="text-slate-600 font-bold">{log.userName}</code></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
