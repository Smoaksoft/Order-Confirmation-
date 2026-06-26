/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  ShoppingBag, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  BrainCircuit, 
  Clock, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/dashboard')
      .then(res => res.json())
      .then(data => {
        setStats(data.totals);
        setDailyData(data.dailyCallAnalytics);
        setMonthlyData(data.monthlyCallAnalytics);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching dashboard stats:', err);
        setLoading(false);
      });
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const statItems = [
    { 
      id: 'total-orders',
      title: 'Total Orders', 
      value: stats.totalOrders, 
      desc: 'Overall received volume', 
      icon: ShoppingBag, 
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      action: 'orders' 
    },
    { 
      id: 'total-calls',
      title: 'Total AI Calls', 
      value: stats.totalCalls, 
      desc: 'Outbound automated dialings', 
      icon: PhoneCall, 
      color: 'bg-sky-50 text-sky-600 border-sky-100',
      action: 'calls' 
    },
    { 
      id: 'confirmed-orders',
      title: 'COD Confirmed', 
      value: stats.confirmedOrders, 
      desc: 'Verified via voice agent', 
      icon: CheckCircle2, 
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      action: 'orders'
    },
    { 
      id: 'cancelled-orders',
      title: 'COD Cancelled', 
      value: stats.cancelledOrders, 
      desc: 'Saves shipment RTO costs', 
      icon: XCircle, 
      color: 'bg-rose-50 text-rose-600 border-rose-100',
      action: 'orders'
    },
    { 
      id: 'delivery-rate',
      title: 'Delivery SLA', 
      value: `${stats.deliverySuccessRate}%`, 
      desc: 'RTO prevention success', 
      icon: TrendingUp, 
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      action: 'billing'
    },
    { 
      id: 'ai-score',
      title: 'AI Accuracy', 
      value: `${stats.aiPerformanceScore}%`, 
      desc: 'Natural language score', 
      icon: BrainCircuit, 
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      action: 'sandbox'
    },
  ];

  return (
    <div key="dashboard-root" className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 md:p-8 text-white shadow-sm">
        <div>
          <span className="bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Operational Live Environment
          </span>
          <h1 className="text-2xl md:text-3xl font-bold font-display mt-3">StyleKart Dashboard</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            OrderVoice AI manages outbound call schedules, verifying COD, handling failed deliveries, and reducing courier RTO losses.
          </p>
        </div>
        <button 
          id="btn-sandbox-nav"
          onClick={() => onNavigate('sandbox')}
          className="mt-4 md:mt-0 px-5 py-3 bg-white text-indigo-950 font-medium rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm hover:scale-101 duration-150 cursor-pointer"
        >
          <BrainCircuit size={16} />
          Launch AI Caller
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div 
              id={item.id}
              key={item.title}
              onClick={() => onNavigate(item.action)}
              className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-slate-300 hover:shadow-xs transition-all duration-200 group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">{item.title}</span>
                <span className={`p-2.5 rounded-xl border ${item.color} transition-all duration-300 group-hover:scale-105`}>
                  <Icon size={18} />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-slate-900 tracking-tight font-display">{item.value}</span>
                <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                  <span>{item.desc}</span>
                  <span className="text-indigo-600 font-medium group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex items-center gap-0.5">
                    View <ArrowUpRight size={10} />
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recharts Panels Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily call hourly analytics */}
        <div id="panel-daily-analytics" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 font-display text-base">Outbound Calls Load</h3>
              <p className="text-xs text-slate-400">Hourly call distribution and response outcomes</p>
            </div>
            <div className="flex gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span>Triggered</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-300"></span>Answered</span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConnected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="calls" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCalls)" />
                <Area type="monotone" dataKey="connected" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorConnected)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Call metrics */}
        <div id="panel-monthly-analytics" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 font-display text-base">Monthly Volume & Quality</h3>
              <p className="text-xs text-slate-400">Total monthly calls vs. agent connection percentage</p>
            </div>
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <Clock size={12} /> Live Sync
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="volume" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === monthlyData.length - 1 ? '#6366f1' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
