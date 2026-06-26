/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { 
  Search, 
  Plus, 
  FileDown, 
  Upload, 
  Trash2, 
  Edit2, 
  PhoneCall, 
  Filter, 
  Info, 
  X,
  AlertCircle 
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface OrdersViewProps {
  orders: Order[];
  onOrdersUpdated: () => void;
  onInitiateCall: (order: Order) => void;
}

export default function OrdersView({ orders, onOrdersUpdated, onInitiateCall }: OrdersViewProps) {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  
  // Create Order Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errMessage, setErrMessage] = useState('');
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    phoneNumber: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    orderValue: '',
    paymentMethod: 'COD' as 'COD' | 'Prepaid',
    courierName: 'Delhivery',
    trackingId: ''
  });

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter lists
  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = o.id.toLowerCase().includes(q) ||
                        o.customerName.toLowerCase().includes(q) ||
                        o.phoneNumber.includes(q) ||
                        o.city.toLowerCase().includes(q);
    const matchStatus = selectedStatus === 'All' || o.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  // Manual Order Submit
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerName || !newOrder.phoneNumber || !newOrder.address || !newOrder.orderValue) {
      setErrMessage('Please fill in Name, Phone, Address and Order Value.');
      return;
    }

    const valueNum = Number(newOrder.orderValue);
    if (isNaN(valueNum) || valueNum <= 0) {
      setErrMessage('Order value must be a valid number.');
      return;
    }

    const codNeeded = newOrder.paymentMethod === 'Prepaid' ? 0 : valueNum;

    const payload = {
      ...newOrder,
      orderValue: valueNum,
      codAmount: codNeeded,
      status: 'Pending Verification' as OrderStatus,
      trackingId: newOrder.trackingId || 'TRK' + Math.floor(100000 + Math.random() * 900000)
    };

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(() => {
      onOrdersUpdated();
      setIsCreateOpen(false);
      setErrMessage('');
      setNewOrder({
        customerName: '',
        phoneNumber: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        orderValue: '',
        paymentMethod: 'COD',
        courierName: 'Delhivery',
        trackingId: ''
      });
    })
    .catch(err => {
      console.error('Error creating order:', err);
      setErrMessage('Failed to save order.');
    });
  };

  // Delete Order
  const handleDeleteOrder = (id: string) => {
    if (!confirm(`Are you sure you want to delete order ${id}?`)) return;

    fetch(`/api/orders/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => {
        onOrdersUpdated();
      })
      .catch(err => console.error('Error deleting order:', err));
  };

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = ['Order ID', 'Customer Name', 'Phone', 'Address', 'City', 'State', 'Pincode', 'Value', 'Method', 'Status', 'Date'];
    const rows = filtered.map(o => [
      o.id,
      o.customerName,
      o.phoneNumber,
      `"${o.address}"`,
      o.city,
      o.state,
      o.pincode,
      o.orderValue,
      o.paymentMethod,
      o.status,
      new Date(o.createdAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ordervoice_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Drag and Drop trigger
  const processCSVRaw = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length < 2) return;

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const parsedOrders: any[] = [];

    // Simple mapping parse
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 3) continue;

      // Extract details by guessing headers or simple fallback indices
      parsedOrders.push({
        customerName: cols[0] || 'Unknown Customer',
        phoneNumber: cols[1] || '+910000000000',
        email: cols[2] || 'customer@import.in',
        address: cols[3] || 'Street road',
        city: cols[4] || 'Kolkata',
        state: cols[5] || 'West Bengal',
        pincode: cols[6] || '700001',
        orderValue: Number(cols[7]) || 1500,
        paymentMethod: cols[8] || 'COD'
      });
    }

    if (parsedOrders.length === 0) return;

    fetch('/api/orders/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: parsedOrders })
    })
    .then(res => res.json())
    .then(() => {
      onOrdersUpdated();
      alert(`Successfully imported ${parsedOrders.length} orders!`);
    })
    .catch(err => {
      console.error('Error importing orders:', err);
      alert('Failed to parse columns.');
    });
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processCSVRaw(text);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processCSVRaw(text);
    };
    reader.readAsText(file);
  };

  // Helper colors for status badges
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Shipped':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Delivered':
        return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'Failed Delivery':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div key="orders-root" className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900">Order Management</h1>
          <p className="text-xs text-slate-400">Track and filter ecommerce orders and launch automated voice call verification.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-medium text-sm rounded-xl flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
          >
            <FileDown size={14} /> Export CSV
          </button>
          <button 
            id="btn-create-order"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-xl flex items-center gap-1.5 hover:bg-indigo-700 shadow-sm cursor-pointer"
          >
            <Plus size={14} /> Create Order
          </button>
        </div>
      </div>

      {/* Upload area row */}
      <div 
        id="csv-drag-drop"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragging ? 'border-indigo-500 bg-indigo-50/40' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".csv" 
          className="hidden" 
        />
        <Upload size={22} className="text-slate-400 mb-2" />
        <span className="text-xs font-semibold text-slate-700">Bulk Ingestion Channel</span>
        <p className="text-[10px] text-slate-400 mt-0.5">Drag & drop your orders.csv file or click to browse. Standard layout: [Name, Phone, Email, Address, City]</p>
      </div>

      {/* Query Filter row */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name, or phone..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['All', 'Pending Verification', 'Confirmed', 'Cancelled', 'Shipped', 'Failed Delivery'].map((s) => (
            <button
              id={`filter-${s.replace(' ', '-')}`}
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border cursor-pointer whitespace-nowrap transition-all ${
                selectedStatus === s 
                  ? 'bg-slate-900 border-slate-900 text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table rendering */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-500">
            <thead className="text-[11px] uppercase text-slate-700 font-semibold bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Customer details</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">COD Amount</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400 italic">
                    No orders match your filter criteria or search query.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-mono font-semibold text-slate-900">{item.id}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800">{item.customerName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.phoneNumber} | {item.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div>{item.city}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.state} - {item.pincode}</div>
                    </td>
                    <td className="px-5 py-4">
                      {item.paymentMethod === 'COD' ? (
                        <div className="font-semibold text-slate-800">₹{item.codAmount} <span className="text-[10px] text-orange-600 bg-orange-50 font-normal py-0.5 px-1.5 rounded">COD</span></div>
                      ) : (
                        <div className="text-slate-400 italic">₹{item.orderValue} Prepaid</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2 py-1 text-[10px] font-semibold rounded-full border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          id={`btn-call-order-${item.id}`}
                          onClick={() => onInitiateCall(item)}
                          className="p-2 text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer flex items-center gap-1"
                          title="Trigger Live AI call simulation"
                        >
                          <PhoneCall size={12} /> Call
                        </button>
                        <button
                          id={`btn-delete-order-${item.id}`}
                          onClick={() => handleDeleteOrder(item.id)}
                          className="p-2 text-rose-500 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Order Creation Modal popup */}
      {isCreateOpen && (
        <div id="modal-create-order" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-lg shadow-xl overflow-hidden p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold font-display text-slate-800 text-base">New Outbound Order Entry</h3>
              <button 
                onClick={() => setIsCreateOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            {errMessage && (
              <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 text-[11px] p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{errMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Customer Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Kumar Sachin"
                    value={newOrder.customerName}
                    onChange={e => setNewOrder({...newOrder, customerName: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone Number (with Dialing code)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="+919988776655"
                    value={newOrder.phoneNumber}
                    onChange={e => setNewOrder({...newOrder, phoneNumber: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Customer Email</label>
                <input 
                  type="email" 
                  placeholder="kumar.sachin.bittu@gmail.com"
                  value={newOrder.email}
                  onChange={e => setNewOrder({...newOrder, email: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Delivery Address</label>
                <textarea 
                  required
                  placeholder="Street No. 4, Anand Vihar"
                  value={newOrder.address}
                  onChange={e => setNewOrder({...newOrder, address: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none h-14"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">City</label>
                  <input 
                    type="text" 
                    placeholder="Kolkata"
                    value={newOrder.city}
                    onChange={e => setNewOrder({...newOrder, city: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">State</label>
                  <input 
                    type="text" 
                    placeholder="West Bengal"
                    value={newOrder.state}
                    onChange={e => setNewOrder({...newOrder, state: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Pincode</label>
                  <input 
                    type="text" 
                    placeholder="700001"
                    value={newOrder.pincode}
                    onChange={e => setNewOrder({...newOrder, pincode: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Order Value (INR)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="2499"
                    value={newOrder.orderValue}
                    onChange={e => setNewOrder({...newOrder, orderValue: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
                  <select
                    value={newOrder.paymentMethod}
                    onChange={e => setNewOrder({...newOrder, paymentMethod: e.target.value as 'COD' | 'Prepaid'})}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="Prepaid">Prepaid</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsCreateOpen(false)} 
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-xs cursor-pointer"
                >
                  Create and Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
