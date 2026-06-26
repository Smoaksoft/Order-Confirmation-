/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  LayoutDashboard, 
  ShoppingBag, 
  PhoneCall, 
  Users, 
  Settings as SettingsIcon, 
  LogOut, 
  Lock, 
  CheckCircle, 
  KeyRound,
  AlertCircle,
  HelpCircle,
  User,
  HeartCrack,
  Activity
} from 'lucide-react';
import { Order, Call, User as UserType } from './types';

// Child view components
import DashboardView from './components/DashboardView';
import OrdersView from './components/OrdersView';
import CallsView from './components/CallsView';
import SandboxView from './components/SandboxView';
import CrmView from './components/CrmView';
import SettingsView from './components/SettingsView';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  
  // Login flow states
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('kumar.sachin.bittu@gmail.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [otpVerificationUserId, setOtpVerificationUserId] = useState<string | null>(null);

  // Core navigation state
  const [currentTab, setCurrentTab] = useState('dashboard');
  
  // State lists
  const [orders, setOrders] = useState<Order[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [focusedOrder, setFocusedOrder] = useState<Order | null>(null);

  // Sync data from database REST endpoints
  const refreshDatabase = () => {
    if (!token) return;
    
    // Fetch orders
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error('Error syncing orders:', err));

    // Fetch call logging ledger
    fetch('/api/calls')
      .then(res => res.json())
      .then(data => setCalls(data))
      .catch(err => console.error('Error syncing call logs:', err));
  };

  useEffect(() => {
    if (token) {
      refreshDatabase();
    }
  }, [token]);

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    .then(res => {
      if (!res.ok) throw new Error('Invalid email or password credentials.');
      return res.json();
    })
    .then(data => {
      if (data.requires2FA) {
        setRequires2FA(true);
        setOtpVerificationUserId(data.user.id);
        setAuthError('2FA passcode dispatched successfully. Verify with OTP code: 49210');
      } else {
        setToken(data.token);
        setUser(data.user);
      }
    })
    .catch(err => {
      setAuthError(err.message);
    });
  };

  // Handle Two Factor verification trigger
  const handle2FAVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode !== '49210') {
      setAuthError('Incorrect OTP digits passcode. Please enter valid 2FA code: 49210');
      return;
    }

    fetch('/api/auth/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: otpVerificationUserId, code: twoFactorCode })
    })
    .then(res => res.json())
    .then(data => {
      setToken('token_' + otpVerificationUserId);
      setUser(data.user);
      setRequires2FA(false);
      setAuthError('');
    })
    .catch(err => console.error(err));
  };

  // Direct AI outbound bridge launching
  const handleInitiateCall = (order: Order) => {
    setFocusedOrder(order);
    setCurrentTab('sandbox');
  };

  // Log Out SaaS Session
  const handleLogOut = () => {
    setToken(null);
    setUser(null);
    setRequires2FA(false);
    setTwoFactorCode('');
    setAuthError('');
  };

  // Simulated Signup Trigger
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setAuthError('Please input Name, Email, and Password fields.');
      return;
    }
    // Simple email verification flow
    setAuthError('Registration completed. Check your email for OTP verification token.');
    setTimeout(() => {
      setAuthMode('login');
      setAuthError('Seed verification accomplished. You can now login.');
    }, 2500);
  };

  // Main UI render
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        
        {/* Subtle blur background gradients */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-950/20 rounded-full blur-3xl"></div>

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 text-white space-y-6">
          
          {/* Logo */}
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="p-3 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl shadow-lg shadow-indigo-600/20">
              <BrainCircuit size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight text-white mt-1">OrderVoice AI</h1>
              <p className="text-slate-400 text-xs mt-1">SaaS Outbound Automated Call Orchestration</p>
            </div>
          </div>

          {authError && (
            <div className="bg-slate-800/40 border border-slate-750 text-indigo-300 text-[11px] p-3 rounded-xl flex items-start gap-2 animate-fade-in leading-relaxed">
              <AlertCircle size={14} className="shrink-0 text-indigo-400 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {requires2FA ? (
            /* Two Factor 2FA Input popup page */
            <form onSubmit={handle2FAVerify} className="space-y-4">
              <div className="text-center space-y-1 pb-2">
                <h3 className="font-semibold text-sm">Two-Factor Authentication</h3>
                <p className="text-[11px] text-slate-400">Security requirement: input the simulated OTP token dispatched.</p>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Verification Passcode</label>
                <div className="relative">
                  <Lock size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="49210"
                    value={twoFactorCode}
                    onChange={e => setTwoFactorCode(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-colors font-mono tracking-widest text-center"
                  />
                </div>
              </div>

              <button
                id="btn-verify-2fa"
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 p-2.5 rounded-xl font-semibold text-xs text-white transition-colors cursor-pointer shadow-md mt-4 block"
              >
                Confirm Verification Code
              </button>
            </form>
          ) : authMode === 'login' ? (
            /* Access form */
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Business Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Secret Keyword Passphrase</label>
                    <button 
                      type="button" 
                      onClick={() => { setAuthMode('forgot'); setAuthError(''); }}
                      className="text-[10px] text-indigo-400 hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 p-2.5 rounded-xl font-semibold text-xs text-white transition-colors cursor-pointer shadow-md block mt-4"
              >
                Sign In Security Terminal
              </button>

              <div className="text-center pt-2">
                <p className="text-[10px] text-slate-400">
                  New operator?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setAuthMode('register'); setAuthError(''); }} 
                    className="text-indigo-400 hover:underline inline"
                  >
                    Create Company Hub
                  </button>
                </p>
              </div>
            </form>
          ) : authMode === 'register' ? (
            /* Signup flow mockup */
            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Company Hub Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. StyleKart Fashion"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Administrator Business Email</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@comphub.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Password Passphrase</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 p-2.5 rounded-xl font-semibold text-xs text-white transition-colors cursor-pointer shadow-md block mt-4"
              >
                Register Corporate Space
              </button>

              <div className="text-center pt-2">
                <button 
                  type="button" 
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className="text-[10px] text-indigo-400 hover:underline"
                >
                  Return to standard Login
                </button>
              </div>
            </form>
          ) : (
            /* Forgot scenario */
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Reset admin authority keywords</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed">Enter your email and standard password-reset-token linkage emails will dispatch immediately.</p>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase">Registered Email</label>
                <input 
                  type="email" 
                  required 
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <button 
                onClick={() => { setAuthError(' लिंक ईमेल पर भेज दिया गया है । Link dispatched.'); setAuthMode('login'); }}
                className="w-full bg-indigo-600 p-2.5 rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                Dispatch reset mailer
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Sidebar navigation panel tags mapping
  const sidebarNavItems = [
    { key: 'dashboard', label: 'Monitor Desk', icon: LayoutDashboard },
    { key: 'orders', label: 'Order Hub', icon: ShoppingBag },
    { key: 'calls', label: 'Call Recaps', icon: PhoneCall },
    { key: 'sandbox', label: 'Voice Sandbox', icon: BrainCircuit, ping: true },
    { key: 'crm', label: 'Client CRM', icon: Users },
    { key: 'settings', label: 'SaaS Configs', icon: SettingsIcon },
  ];

  return (
    <div key="saas-main-container" className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      
      {/* 1. Left Sidebar Navigation rail */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col justify-between border-r border-slate-8e0">
        
        {/* Upper segment */}
        <div className="p-5 space-y-6">
          
          {/* Header branding logo wrap */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-md shadow-indigo-600/10">
              <BrainCircuit size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight font-display text-white">OrderVoice AI</h2>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Live Webhooks
              </span>
            </div>
          </div>

          {/* Navigation rail items */}
          <nav className="space-y-1">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  id={`sidebar-nav-${item.key}`}
                  key={item.key}
                  onClick={() => {
                    setCurrentTab(item.key);
                    if (item.key !== 'sandbox') setFocusedOrder(null);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    currentTab === item.key 
                      ? 'bg-slate-850 text-white font-semibold border-l-4 border-indigo-505' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={14} className={currentTab === item.key ? 'text-indigo-400' : ''} />
                    <span>{item.label}</span>
                  </span>
                  {item.ping && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-bounce"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Lower segment / profile info block */}
        <div className="p-5 border-t border-slate-800/80 bg-slate-950/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
              KS
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-100">{user?.name}</h4>
              <p className="text-[9px] text-slate-400">Role: <code className="text-indigo-400 bg-indigo-950/50 py-0.5 px-1.5 rounded">{user?.role}</code></p>
            </div>
          </div>

          <button
            id="btn-sidebar-logout"
            onClick={handleLogOut}
            className="w-full py-2 bg-slate-800/50 hover:bg-slate-800 hover:text-white text-slate-400 text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-800"
          >
            <LogOut size={12} />
            <span>Sign Out Session</span>
          </button>
        </div>

      </aside>

      {/* 2. Main Workstage Section */}
      <main className="flex-1 overflow-y-auto px-5 md:px-8 py-6 pb-12 max-w-7xl mx-auto w-full">
        {currentTab === 'dashboard' && <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />}
        
        {currentTab === 'orders' && (
          <OrdersView 
            orders={orders} 
            onOrdersUpdated={refreshDatabase}
            onInitiateCall={handleInitiateCall} 
          />
        )}

        {currentTab === 'calls' && (
          <CallsView 
            calls={calls} 
            onCallsUpdated={refreshDatabase} 
          />
        )}

        {currentTab === 'sandbox' && (
          <SandboxView 
            orders={orders} 
            onCallSuccess={refreshDatabase}
            focusedOrder={focusedOrder} 
          />
        )}

        {currentTab === 'crm' && <CrmView />}

        {currentTab === 'settings' && <SettingsView />}
      </main>

    </div>
  );
}
