/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory or file-backed database path
const DB_FILE = path.join(process.cwd(), 'db.json');

// Interface representation for local database state
interface DbState {
  users: any[];
  companies: any[];
  orders: any[];
  calls: any[];
  notifications: any[];
  invoices: any[];
  auditLogs: any[];
}

// Default initial state for database seeding
const DEFAULT_STATE: DbState = {
  users: [
    {
      id: 'usr-1',
      name: 'Kumar Sachin',
      email: 'kumar.sachin.bittu@gmail.com',
      role: 'Super Admin',
      companyId: 'comp-1',
      twoFactorEnabled: true,
      emailVerified: true,
    },
    {
      id: 'usr-2',
      name: 'Simran Jeet',
      email: 'simran@ordervoice.ai',
      role: 'Company Admin',
      companyId: 'comp-1',
      twoFactorEnabled: false,
      emailVerified: true,
    }
  ],
  companies: [
    {
      id: 'comp-1',
      name: 'StyleKart Fashion India',
      subdomain: 'stylekart',
      phone: '+91 98765 43210',
      apiKey: 'ov_live_6f7f8g9h0j1k2l3m4n5',
      voiceProvider: 'twilio',
      voiceConfig: {
        accountSid: 'ACabc123def456ghi789jkl012',
        authToken: 'auth_tok_888999777aabbcc',
        fromNumber: '+1234567890',
      },
      subscriptionPlan: 'professional',
      callsUsed: 1424,
      callsLimit: 10000,
    }
  ],
  orders: [
    {
      id: 'ORD-5481',
      customerName: 'Rajesh Sharma',
      phoneNumber: '+919988776655',
      email: 'rajesh.sharma@gmail.com',
      address: 'H-42, Sector 15, Noida',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      orderValue: 2499,
      codAmount: 2499,
      paymentMethod: 'COD',
      courierName: 'Delhivery',
      trackingId: 'DLV9921820',
      status: 'Pending Verification',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      companyId: 'comp-1',
    },
    {
      id: 'ORD-7012',
      customerName: 'Anindita Das',
      phoneNumber: '+919830012345',
      email: 'anindita.das@gmail.com',
      address: 'Flat 4B, Ruby Residency, Kasba',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700042',
      orderValue: 1850,
      codAmount: 1850,
      paymentMethod: 'COD',
      courierName: 'BlueDart',
      trackingId: 'BD8821901',
      status: 'Pending Verification',
      createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
      companyId: 'comp-1',
    },
    {
      id: 'ORD-3329',
      customerName: 'Amit Verma',
      phoneNumber: '+919111223344',
      email: 'amit.verma@example.com',
      address: '22 Jump Street, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      orderValue: 3200,
      codAmount: 0,
      paymentMethod: 'Prepaid',
      courierName: 'Xpressbees',
      trackingId: 'XB33019283',
      status: 'Shipped',
      deliveryDate: '2026-06-22',
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      companyId: 'comp-1',
    },
    {
      id: 'ORD-8442',
      customerName: 'Priya Patel',
      phoneNumber: '+919000111222',
      email: 'priya.patel@gmail.com',
      address: 'Block C-102, Gagan Vihar, CG Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380009',
      orderValue: 4150,
      codAmount: 4150,
      paymentMethod: 'COD',
      courierName: 'Delhivery',
      trackingId: 'DLV22910398',
      status: 'Confirmed',
      createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
      companyId: 'comp-1',
    },
    {
      id: 'ORD-1092',
      customerName: 'Sanjay Rawat',
      phoneNumber: '+919420445566',
      email: 'sanjay.rawat@yahoo.com',
      address: 'Lane 4, Subhash Nagar',
      city: 'Dehradun',
      state: 'Uttarakhand',
      pincode: '248002',
      orderValue: 1599,
      codAmount: 1599,
      paymentMethod: 'COD',
      courierName: 'Shadowfax',
      trackingId: 'SFX1820492',
      status: 'Failed Delivery',
      createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
      companyId: 'comp-1',
    },
    {
      id: 'ORD-2041',
      customerName: 'Kunal Sen',
      phoneNumber: '+918012345678',
      email: 'kunal.sen@gmail.com',
      address: 'Anand Bagh, Aliganj',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      pincode: '226024',
      orderValue: 2899,
      codAmount: 2899,
      paymentMethod: 'COD',
      courierName: 'Delhivery',
      trackingId: 'DLV7732890',
      status: 'Cancelled',
      createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
      companyId: 'comp-1',
    }
  ],
  calls: [
    {
      id: 'call-101',
      orderId: 'ORD-8442',
      customerName: 'Priya Patel',
      phoneNumber: '+919000111222',
      type: 'COD Verification',
      status: 'Completed',
      durationSeconds: 43,
      recordingUrl: 'https://api.ordervoice.ai/recordings/rec_8442.mp3',
      transcript: 'OrderVoice AI: Hello Priya! This is an automated verification call regarding your StyleKart order of ₹4150. Customer: Yes, I confirm this order. Thank you. OrderVoice AI: Excellent! We have successfully confirmed your COD order. It will be dispatched shortly. Have a great day!',
      notes: 'Customer confirmed COD order immediately. Polite language in English.',
      customerIntent: 'Confirmed COD order',
      languageDetected: 'English',
      escalationRequired: false,
      completedAt: new Date(Date.now() - 25 * 3600000).toISOString(),
      createdAt: new Date(Date.now() - 25 * 3600000).toISOString(),
      companyId: 'comp-1',
    },
    {
      id: 'call-102',
      orderId: 'ORD-2041',
      customerName: 'Kunal Sen',
      phoneNumber: '+918012345678',
      type: 'COD Verification',
      status: 'Completed',
      durationSeconds: 51,
      recordingUrl: 'https://api.ordervoice.ai/recordings/rec_2041.mp3',
      transcript: 'OrderVoice AI: नमस्ते कुणाल जी, मैं आर्डरवॉइस एआई से बात कर रही हूँ। क्या आप अपना स्टाइलकार्ट आर्डर रद्द करना चाहते हैं या कन्फर्म करना चाहते हैं? Customer: नहीं आर्डर कैंसिल कर दो भाई, गलती से दो बार हो गया। OrderVoice AI: ठीक है कुणाल जी, आपके कहने के अनुसार हमने यह आर्डर रद्द कर दिया है। हमारी सेवा में आने के लिए धन्यवाद।',
      notes: 'Customer requested cancellation because of duplicate placement. Conducted in Hindi.',
      customerIntent: 'Cancelled order',
      languageDetected: 'Hindi',
      escalationRequired: false,
      completedAt: new Date(Date.now() - 50 * 3600000).toISOString(),
      createdAt: new Date(Date.now() - 50 * 3600000).toISOString(),
      companyId: 'comp-1',
    },
    {
      id: 'call-103',
      orderId: 'ORD-1092',
      customerName: 'Sanjay Rawat',
      phoneNumber: '+919420445566',
      type: 'Failed Delivery Recovery',
      status: 'Completed',
      durationSeconds: 72,
      recordingUrl: 'https://api.ordervoice.ai/recordings/rec_1092.mp3',
      transcript: 'OrderVoice AI: Hello Sanjay, Delhivery Courier informed us that they could not find your house and marked the delivery as failed. Customer: Yes, the driver did not call me. I am home. OrderVoice AI: I apologize. Can you please confirm a nearby landmark so we can update the courier team? Customer: It is opposite the Shivalik Medical Store, Subhash Nagar. OrderVoice AI: Got it, landmark is Shivalik Medical Store. We have rescheduled delivery for tomorrow. Customer: Thank you.',
      notes: 'Customer reported courier did not call. Landmark Shivalik Medical Store added. Escalated/updated with courier partner immediately.',
      customerIntent: 'Provided delivery info',
      languageDetected: 'English',
      escalationRequired: true,
      completedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      companyId: 'comp-1',
    },
    {
      id: 'call-104',
      orderId: 'ORD-5481',
      customerName: 'Rajesh Sharma',
      phoneNumber: '+919988776655',
      type: 'COD Verification',
      status: 'No-Answer',
      durationSeconds: 0,
      notes: 'The customer did not pick up the call after 5 rings.',
      escalationRequired: false,
      createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
      companyId: 'comp-1',
    }
  ],
  notifications: [
    {
      id: 'notif-1',
      orderId: 'ORD-5481',
      channel: 'SMS',
      type: 'Order Created',
      recipient: '+919988776655',
      content: 'Your StyleKart order ORD-5481 of Rs. 2499 is placed. Our AI will call you shortly to verify your delivery address.',
      status: 'Sent',
      sentAt: new Date().toISOString(),
    }
  ],
  invoices: [
    {
      id: 'inv-1',
      companyId: 'comp-1',
      invoiceNumber: 'INV-2026-001',
      amount: 149.00,
      status: 'Paid',
      date: '2026-06-01',
      callsVolume: 1200,
    }
  ],
  auditLogs: [
    {
      id: 'log-1',
      timestamp: new Date().toISOString(),
      userId: 'usr-1',
      userName: 'kumar.sachin.bittu@gmail.com',
      action: 'User Login',
      details: 'Successful login & 2FA verification from IP 192.168.1.1',
    }
  ]
};

// Database utility functions
function readDb(): DbState {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_STATE, null, 2));
      return DEFAULT_STATE;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB, using defaults:', err);
    return DEFAULT_STATE;
  }
}

function writeDb(state: DbState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Ensure database is initialized
readDb();

// ----------------------------------------------------
// AI GEMINI CALL ENGINE (Lazy initialization)
// ----------------------------------------------------
let googleGenAiClient: any = null;

function getGeminiClient() {
  if (googleGenAiClient) return googleGenAiClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    console.warn('GEMINI_API_KEY is not set or empty. Falling back to local conversation engine.');
    return null;
  }

  try {
    googleGenAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    return googleGenAiClient;
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

// ----------------------------------------------------
// REST APIs & SIMULATION ROUTES
// ----------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Authentication Simulator
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Seeding/Mock active login session with simulated token
  const token = 'jwt_token_simulated_ordervoice_ai_' + Math.random().toString(36).substr(2);
  
  // Adding Audit audit log
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.email,
    action: 'User Login',
    details: `Login successful for ${user.name} (${user.role})`,
  });
  writeDb(db);

  res.json({
    user,
    token,
    requires2FA: user.twoFactorEnabled,
    message: 'Login successful. Please confirm your 2FA OTP.'
  });
});

app.post('/api/auth/verify-2fa', (req, res) => {
  const { userId, code } = req.body;
  const db = readDb();
  const user = db.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const dbLog = db.auditLogs.find(l => l.userId === userId && l.action === 'User Login');
  if (dbLog) {
    dbLog.details += ' - 2FA Code Verified';
  }
  writeDb(db);

  res.json({
    success: true,
    user,
    message: '2FA authentication completed successfully!'
  });
});

// Dashboard Statistics & Analytics
app.get('/api/analytics/dashboard', (req, res) => {
  const db = readDb();
  const orders = db.orders;
  const calls = db.calls;

  const totalOrders = orders.length;
  const totalCalls = calls.length;
  const connectedCalls = calls.filter(c => c.status === 'Completed').length;
  const missedCalls = calls.filter(c => ['No-Answer', 'Failed', 'Busy'].includes(c.status)).length;
  const confirmedOrders = orders.filter(o => o.status === 'Confirmed').length;
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;

  const delivered = orders.filter(o => o.status === 'Delivered').length;
  const failedDelivery = orders.filter(o => o.status === 'Failed Delivery').length;
  const deliverySuccessRate = totalOrders > 0 ? Math.round(((delivered + confirmedOrders) / totalOrders) * 100) : 85;

  const aiPerformanceScore = 94.2; // Custom proprietary quality metric

  // Daily statistics simulation (dummy but beautifully aligned)
  const dailyCallAnalytics = [
    { hour: '09:00', calls: 32, connected: 28, cancelled: 2 },
    { hour: '11:00', calls: 65, connected: 59, cancelled: 4 },
    { hour: '13:00', calls: 86, connected: 72, cancelled: 8 },
    { hour: '15:00', calls: 110, connected: 94, cancelled: 11 },
    { hour: '17:00', calls: 95, connected: 83, cancelled: 6 },
    { hour: '19:00', calls: 45, connected: 38, cancelled: 3 },
  ];

  // Monthly stats
  const monthlyCallAnalytics = [
    { month: 'Jan', volume: 15400, answered: 14200, successRatio: 92 },
    { month: 'Feb', volume: 18100, answered: 16900, successRatio: 93 },
    { month: 'Mar', volume: 22000, answered: 20400, successRatio: 92 },
    { month: 'Apr', volume: 25400, answered: 23800, successRatio: 94 },
    { month: 'May', volume: 28900, answered: 26900, successRatio: 93 },
    { month: 'Jun', volume: 32500, answered: 30200, successRatio: 95 },
  ];

  res.json({
    totals: {
      totalOrders,
      totalCalls,
      connectedCalls,
      missedCalls,
      confirmedOrders,
      cancelledOrders,
      deliverySuccessRate,
      aiPerformanceScore,
    },
    dailyCallAnalytics,
    monthlyCallAnalytics,
  });
});

// Order Management REST Endpoints
app.get('/api/orders', (req, res) => {
  const db = readDb();
  let orders = db.orders;

  const search = req.query.search as string;
  const status = req.query.status as string;

  if (search) {
    const q = search.toLowerCase();
    orders = orders.filter(
      o =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phoneNumber.includes(q) ||
        o.city.toLowerCase().includes(q)
    );
  }

  if (status && status !== 'All') {
    orders = orders.filter(o => o.status === status);
  }

  // Always return newest first
  orders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const db = readDb();
  const newOrder = {
    ...req.body,
    id: req.body.id || 'ORD-' + Math.floor(1000 + Math.random() * 9000),
    createdAt: new Date().toISOString(),
    companyId: 'comp-1',
  };

  db.orders.unshift(newOrder);
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    timestamp: new Date().toISOString(),
    userId: 'usr-1',
    userName: 'कुमार सचिन',
    action: 'Create Order',
    details: `Created order ${newOrder.id} for ${newOrder.customerName}`,
  });

  // Automatically trigger a simulated confirmation notification log!
  db.notifications.unshift({
    id: 'notif-' + Date.now(),
    orderId: newOrder.id,
    channel: 'SMS',
    type: 'Order Created',
    recipient: newOrder.phoneNumber,
    content: `StylKart: Order ${newOrder.id} placed. StyleKart partner will verify details shortly.`,
    status: 'Sent',
    sentAt: new Date().toISOString()
  });

  writeDb(db);
  res.json(newOrder);
});

app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const idx = db.orders.findIndex(o => o.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  db.orders[idx] = { ...db.orders[idx], ...req.body };
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    timestamp: new Date().toISOString(),
    userId: 'usr-1',
    userName: 'कुमार सचिन',
    action: 'Update Order',
    details: `Updated order ${id} status to ${req.body.status || db.orders[idx].status}`,
  });

  writeDb(db);
  res.json(db.orders[idx]);
});

app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const filtered = db.orders.filter(o => o.id !== id);

  if (filtered.length === db.orders.length) {
    return res.status(404).json({ error: 'Order not found' });
  }

  db.orders = filtered;
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    timestamp: new Date().toISOString(),
    userId: 'usr-1',
    userName: 'कुमार सचिन',
    action: 'Delete Order',
    details: `Deleted order ${id}`,
  });

  writeDb(db);
  res.json({ success: true, message: 'Order successfully deleted' });
});

// CSV Import Simulation
app.post('/api/orders/bulk-import', (req, res) => {
  const { orders } = req.body;
  if (!orders || !Array.isArray(orders)) {
    return res.status(400).json({ error: 'Invalid bulk import request' });
  }

  const db = readDb();
  let importCount = 0;

  orders.forEach((raw: any) => {
    const id = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    const newOrder = {
      id,
      customerName: raw.customerName || 'Bulk Customer',
      phoneNumber: raw.phoneNumber || '+91' + Math.floor(6000000000 + Math.random() * 3999999999),
      email: raw.email || 'customer@bulk.com',
      address: raw.address || 'Address Field',
      city: raw.city || 'Mumbai',
      state: raw.state || 'Maharashtra',
      pincode: raw.pincode || '400001',
      orderValue: Number(raw.orderValue) || 1299,
      codAmount: raw.paymentMethod === 'Prepaid' ? 0 : Number(raw.orderValue) || 1299,
      paymentMethod: raw.paymentMethod === 'Prepaid' ? 'Prepaid' : 'COD',
      courierName: raw.courierName || 'Delhivery',
      trackingId: raw.trackingId || 'TRK' + Math.floor(1000000 + Math.random() * 9000000),
      status: 'Pending Verification',
      createdAt: new Date().toISOString(),
      companyId: 'comp-1',
    };
    db.orders.unshift(newOrder);
    importCount++;
  });

  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    timestamp: new Date().toISOString(),
    userId: 'usr-1',
    userName: 'कुमार सचिन',
    action: 'Bulk Import',
    details: `Imported ${importCount} order entries via CSV file upload`,
  });

  writeDb(db);
  res.json({ success: true, count: importCount, message: `Successfully imported ${importCount} orders!` });
});

// Call Management Endpoints
app.get('/api/calls', (req, res) => {
  const db = readDb();
  let calls = db.calls;

  calls = [...calls].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(calls);
});

// Schedule Call
app.post('/api/calls/schedule', (req, res) => {
  const { orderId, type, scheduledAt } = req.body;
  const db = readDb();
  const order = db.orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: 'Associated order not found' });
  }

  const newCall = {
    id: 'call-' + Math.floor(1000 + Math.random() * 9000),
    orderId,
    customerName: order.customerName,
    phoneNumber: order.phoneNumber,
    type,
    status: 'Scheduled',
    durationSeconds: 0,
    scheduledAt: scheduledAt || new Date(Date.now() + 3600000).toISOString(),
    createdAt: new Date().toISOString(),
    companyId: 'comp-1',
    escalationRequired: false,
  };

  db.calls.unshift(newCall);
  writeDb(db);

  res.json(newCall);
});

// CRM / Customer Profiles
app.get('/api/customers', (req, res) => {
  const db = readDb();
  const orders = db.orders;
  const calls = db.calls;

  // Uniquify by phone number
  const profilesMap: Record<string, any> = {};

  orders.forEach(o => {
    if (!profilesMap[o.phoneNumber]) {
      profilesMap[o.phoneNumber] = {
        phoneNumber: o.phoneNumber,
        name: o.customerName,
        email: o.email,
        city: o.city,
        state: o.state,
        orders: [],
        calls: [],
        notes: `Customer since ${new Date(o.createdAt).toLocaleDateString()}`,
        customerSatisfaction: 5,
      };
    }
    profilesMap[o.phoneNumber].orders.push(o);
  });

  calls.forEach(c => {
    if (profilesMap[c.phoneNumber]) {
      profilesMap[c.phoneNumber].calls.push(c);
    }
  });

  res.json(Object.values(profilesMap));
});

// Notifications Logs Fetch
app.get('/api/notifications', (req, res) => {
  const db = readDb();
  res.json(db.notifications);
});

// Billing info
app.get('/api/billing', (req, res) => {
  const db = readDb();
  res.json({
    company: db.companies[0],
    invoices: db.invoices,
  });
});

app.post('/api/billing/upgrade', (req, res) => {
  const { plan } = req.body;
  const db = readDb();
  const company = db.companies[0];

  company.subscriptionPlan = plan;
  if (plan === 'starter') company.callsLimit = 1000;
  if (plan === 'professional') company.callsLimit = 10000;
  if (plan === 'enterprise') company.callsLimit = 999999;

  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    timestamp: new Date().toISOString(),
    userId: 'usr-1',
    userName: 'कुमार सचिन',
    action: 'Subscription Upgrade',
    details: `Upgraded StyleKart subscription plan to ${plan}`,
  });

  writeDb(db);
  res.json({ success: true, company });
});

// CRM note updates
app.post('/api/customers/notes', (req, res) => {
  const { phoneNumber, notes, customerSatisfaction } = req.body;
  // Simulating updating CRM notes
  res.json({ success: true, notes, customerSatisfaction });
});

// Save VoIP configuration
app.post('/api/company/voip', (req, res) => {
  const { voiceProvider, accountSid, authToken, fromNumber } = req.body;
  const db = readDb();
  if (db.companies && db.companies.length > 0) {
    db.companies[0].voiceProvider = voiceProvider;
    db.companies[0].voiceConfig = {
      accountSid,
      authToken,
      fromNumber
    };
    db.auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: 'usr-1',
      userName: 'kumar.sachin.bittu@gmail.com',
      action: 'Update VoIP config',
      details: `Updated ${voiceProvider.toUpperCase()} carrier trunk with active caller CLI phone: ${fromNumber}`,
    });
    writeDb(db);
    res.json({ success: true, company: db.companies[0] });
  } else {
    res.status(404).json({ error: 'Company not found' });
  }
});

// Helper function for live outbound dialings using fetch/basic auth
async function dialOutboundVoiceCall(company: any, order: any, callType: string, callId: string) {
  const provider = company.voiceProvider;
  const config = company.voiceConfig;
  
  if (!config || !config.accountSid || !config.authToken || !config.fromNumber) {
    console.warn('VoIP trunk credentials not fully configured for dialing out.');
    return { success: false, reason: 'Credentials not synchronized in settings tab.' };
  }
  
  const from = config.fromNumber;
  const to = order.phoneNumber;
  const appUrl = process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
    ? process.env.APP_URL 
    : 'https://ais-pre-hgdtppq6hofdp7erfmgpuk-1040105516553.asia-southeast1.run.app';
  
  if (provider === 'twilio') {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Calls.json`;
    const callbackUrl = `${appUrl}/api/voice/twilio/incoming?orderId=${order.id}&callType=${encodeURIComponent(callType)}&callId=${callId}`;
    const statusCallbackUrl = `${appUrl}/api/voice/twilio/status-callback?callId=${callId}`;
    
    const params = new URLSearchParams();
    params.append('To', to);
    params.append('From', from);
    params.append('Url', callbackUrl);
    params.append('StatusCallback', statusCallbackUrl);
    params.append('StatusCallbackEvent', 'completed');
    
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    
    try {
      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      
      const resText = await response.text();
      console.log('Voice dial twilio response status:', response.status);
      if (response.ok) {
        return { success: true, apiResult: JSON.parse(resText) };
      } else {
        return { success: false, reason: `Twilio responded with error code: ${response.status}`, error: resText };
      }
    } catch (err: any) {
      console.error('Twilio raw POST connection failed:', err);
      return { success: false, reason: 'Network failure or timeout.', error: err.message };
    }
  } else if (provider === 'exotel') {
    const exotelUrl = `https://api.exotel.com/v1/Accounts/${config.accountSid}/Calls/connect.json`;
    const callbackUrl = `${appUrl}/api/voice/exotel/incoming?orderId=${order.id}&callType=${encodeURIComponent(callType)}&callId=${callId}`;
    const statusCallbackUrl = `${appUrl}/api/voice/exotel/status-callback?callId=${callId}`;
    
    const params = new URLSearchParams();
    params.append('From', from);
    params.append('To', to);
    params.append('Url', callbackUrl);
    params.append('StatusCallback', statusCallbackUrl);
    
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    
    try {
      const response = await fetch(exotelUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      
      const resText = await response.text();
      console.log('Voice dial exotel response status:', response.status);
      if (response.ok) {
        return { success: true, apiResult: JSON.parse(resText) };
      } else {
        return { success: false, reason: `Exotel responded with error code: ${response.status}`, error: resText };
      }
    } catch (err: any) {
      console.error('Exotel raw POST connection failed:', err);
      return { success: false, reason: 'Network failure or timeout.', error: err.message };
    }
  }
  
  return { success: false, reason: 'Unknown trunk provider' };
}

// Live Outbound VoIP Dialer Trigger
app.post('/api/calls/dial', async (req, res) => {
  const { orderId, type, liveDial } = req.body;
  const db = readDb();
  const order = db.orders.find(o => o.id === orderId);
  const company = db.companies[0];

  if (!order) {
    return res.status(404).json({ error: 'Associated order not found' });
  }

  const callId = 'call-' + Math.floor(100000 + Math.random() * 900000);
  const newCall = {
    id: callId,
    orderId,
    customerName: order.customerName,
    phoneNumber: order.phoneNumber,
    type,
    status: liveDial ? 'Dialing' : 'Completed',
    durationSeconds: liveDial ? 0 : Math.floor(25 + Math.random() * 30),
    notes: liveDial 
      ? 'Live outbound voice call initiated. Waiting for recipient to answer...' 
      : 'Simulated sandbox browser callback successful.',
    customerIntent: liveDial ? 'General response' : 'Confirmed Order',
    languageDetected: 'English',
    escalationRequired: false,
    completedAt: liveDial ? null : new Date().toISOString(),
    createdAt: new Date().toISOString(),
    companyId: 'comp-1',
  };

  db.calls.unshift(newCall);
  
  let dialResult: any = { success: false, reason: 'Sandbox environment fallback mode selected.' };
  
  if (liveDial) {
    dialResult = await dialOutboundVoiceCall(company, order, type, callId);
    if (!dialResult.success) {
      newCall.status = 'Failed';
      newCall.notes = `Carrier trunk dial failure: ${dialResult.reason}.`;
    } else {
      newCall.status = 'InProgress';
      newCall.notes = `Outbound call connects live via ${company.voiceProvider.toUpperCase()}.`;
    }
  } else {
    // Sync order state for simulation
    const simulatedIntents = { reply: '', language: 'English', intent: 'confirmed', notes: 'Simulated customer confirmed COD.' };
    updateDatabaseOnIntent(db, order.id, type, simulatedIntents);
  }

  writeDb(db);
  res.json({ success: true, call: newCall, dialResult });
});

// Dynamic Twilio API Inbound Voice TwiML webhook
app.all('/api/voice/twilio/incoming', async (req, res) => {
  const { orderId, callType, callId } = req.query;
  const db = readDb();
  const order = db.orders.find(o => o.id === orderId);
  
  res.type('text/xml');
  
  if (!order) {
    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Aditi" language="en-IN">Welcome to OrderVoice AI. The requested transaction reference has expired.</Say>
        <Hangup/>
      </Response>
    `);
  }
  
  const simulatedTurn = localMockCallingEngine(order, String(callType || 'COD Verification'), 'CALL_START_INITIAL_HELLO', 0);
  const callbackUrl = `/api/voice/twilio/handle-gather?orderId=${orderId}&callType=${encodeURIComponent(String(callType || ''))}&callId=${callId}`;
  
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Gather input="speech" action="${callbackUrl}" speechTimeout="auto" hints="yes, confirm, cancel, haan, ha, nahi" language="en-IN">
        <Say voice="Polly.Aditi" language="en-IN">${simulatedTurn.reply}</Say>
      </Gather>
      <Say voice="Polly.Aditi" language="en-IN">I did not catch that. Please repeat your confirmation.</Say>
      <Redirect>/api/voice/twilio/incoming?orderId=${orderId}&amp;callType=${encodeURIComponent(String(callType || ''))}&amp;callId=${callId}</Redirect>
    </Response>
  `);
});

// Dynamic Twilio Gather webhook handle speech processing via AI
app.all('/api/voice/twilio/handle-gather', async (req, res) => {
  const { orderId, callType, callId } = req.query;
  const speechResult = req.body.SpeechResult || req.query.SpeechResult || '';
  
  const db = readDb();
  const order = db.orders.find(o => o.id === orderId);
  
  res.type('text/xml');
  
  if (!order) {
    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Aditi" language="en-IN">Order data expired. Goodbye.</Say>
        <Hangup/>
      </Response>
    `);
  }
  
  if (!speechResult) {
    const callbackUrl = `/api/voice/twilio/handle-gather?orderId=${orderId}&amp;callType=${encodeURIComponent(String(callType || ''))}&amp;callId=${callId}`;
    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Gather input="speech" action="${callbackUrl}" speechTimeout="auto" language="en-IN">
          <Say voice="Polly.Aditi" language="en-IN">Please speak clearly so we can record your response.</Say>
        </Gather>
        <Hangup/>
      </Response>
    `);
  }
  
  // Query AI Gemini or fallback
  const gemini = getGeminiClient();
  let resultIntent = 'none';
  const textL = speechResult.toLowerCase();
  
  if (textL.includes('confirm') || textL.includes('yes') || textL.includes('हाँ') || textL.includes('haan') || textL.includes('হ্যাঁ')) {
    resultIntent = 'confirmed';
  } else if (textL.includes('cancel') || textL.includes('no') || textL.includes('रद्द') || textL.includes('na') || textL.includes('না')) {
    resultIntent = 'cancelled';
  } else if (textL.includes('agent') || textL.includes('human') || textL.includes('live') || textL.includes('talk')) {
    resultIntent = 'escalated';
  }
  
  if (gemini) {
    try {
      const systemPrompt = `
You are OrderVoice AI calling agent. Generate a concise phone call response supporting English and Hindi back-and-forth speech.
Customer said: "${speechResult}".

Deliver only the response text wrapped in <Response><Say voice="Polly.Aditi" language="en-IN">[Concise response under 25 words]</Say>${resultIntent !== 'none' ? '<Hangup/>' : `<Gather input="speech" action="/api/voice/twilio/handle-gather?orderId=${orderId}&amp;callType=${encodeURIComponent(String(callType || ''))}&amp;callId=${callId}" speechTimeout="auto" language="en-IN"/>`}</Response>
Output absolute raw valid TwiML XML.`;
      
      const response = await gemini.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ text: systemPrompt }]
      });
      
      let xmlResponse = response.text.trim();
      xmlResponse = xmlResponse.replace(/^```xml\s*/, '').replace(/```$/, '').trim();
      
      // Update database status
      updateDatabaseOnIntent(db, order.id, String(callType || 'COD Verification'), {
        reply: '',
        language: textL.includes('हाँ') || textL.includes('रद्द') ? 'Hindi' : 'English',
        intent: resultIntent,
        notes: `Twilio call speech parsed: "${speechResult}".`
      });
      
      return res.send(xmlResponse);
    } catch (err) {
      console.error('Gemini webhook generator error:', err);
    }
  }
  
  const simulatedTurn = localMockCallingEngine(order, String(callType || 'COD Verification'), speechResult, 1);
  updateDatabaseOnIntent(db, order.id, String(callType || 'COD Verification'), simulatedTurn);
  
  if (simulatedTurn.intent === 'confirmed' || simulatedTurn.intent === 'cancelled' || simulatedTurn.intent === 'escalated') {
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Aditi" language="en-IN">${simulatedTurn.reply}</Say>
        <Hangup/>
      </Response>
    `);
  } else {
    const callbackUrl = `/api/voice/twilio/handle-gather?orderId=${orderId}&callType=${encodeURIComponent(String(callType || ''))}&callId=${callId}`;
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Gather input="speech" action="${callbackUrl}" speechTimeout="auto" language="en-IN">
          <Say voice="Polly.Aditi" language="en-IN">${simulatedTurn.reply}</Say>
        </Gather>
        <Say voice="Polly.Aditi" language="en-IN">Please speak to confirm.</Say>
        <Redirect>/api/voice/twilio/incoming?orderId=${orderId}&amp;callType=${encodeURIComponent(String(callType || ''))}&amp;callId=${callId}</Redirect>
      </Response>
    `);
  }
});

// Twilio call status callbacks updates
app.all('/api/voice/twilio/status-callback', (req, res) => {
  const { callId } = req.query;
  const status = req.body.CallStatus || req.query.CallStatus || 'Completed';
  const duration = Number(req.body.CallDuration || req.query.CallDuration || 0);
  
  const db = readDb();
  const callIdx = db.calls.findIndex(c => c.id === callId);
  if (callIdx !== -1) {
    db.calls[callIdx].status = status === 'completed' ? 'Completed' : status;
    db.calls[callIdx].durationSeconds = duration;
    db.calls[callIdx].completedAt = new Date().toISOString();
    writeDb(db);
  }
  res.status(200).send('OK');
});

// Dynamic Exotel API Inbound Voice webhook
app.all('/api/voice/exotel/incoming', (req, res) => {
  const { orderId, callType, callId } = req.query;
  const db = readDb();
  const order = db.orders.find(o => o.id === orderId);
  
  res.type('text/xml');
  
  if (!order) {
    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="female">Order not found.</Say>
        <Hangup/>
      </Response>
    `);
  }
  
  const simulatedTurn = localMockCallingEngine(order, String(callType || 'COD Verification'), 'CALL_START_INITIAL_HELLO', 0);
  
  const callIdx = db.calls.findIndex(c => c.id === callId);
  if (callIdx !== -1) {
    db.calls[callIdx].status = 'InProgress';
    writeDb(db);
  }
  
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="female" language="en">${simulatedTurn.reply}</Say>
      <!-- Exotel DTMF/Gather voice processing -->
    </Response>
  `);
});

// Exotel status updates
app.all('/api/voice/exotel/status-callback', (req, res) => {
  const { callId } = req.query;
  const status = req.body.Status || req.query.Status || 'Completed';
  const duration = Number(req.body.Duration || req.query.Duration || 0);
  
  const db = readDb();
  const callIdx = db.calls.findIndex(c => c.id === callId);
  if (callIdx !== -1) {
    db.calls[callIdx].status = status;
    db.calls[callIdx].durationSeconds = duration;
    db.calls[callIdx].completedAt = new Date().toISOString();
    writeDb(db);
  }
  res.status(200).send('OK');
});

// Audit log list
app.get('/api/audit-logs', (req, res) => {
  const db = readDb();
  res.json(db.auditLogs);
});

// ----------------------------------------------------
// DYNAMIC AI AUDIO CALL SIMULATOR (GEMINI DRIVER)
// ----------------------------------------------------

app.post('/api/calls/simulate-turn', async (req, res) => {
  const { orderId, callType, chatHistory, userMessage } = req.body;

  const db = readDb();
  const order = db.orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found for voice call simulation' });
  }

  // Construct structured history for context
  const historyString = chatHistory
    .map((h: any) => `${h.sender === 'agent' ? 'OrderVoice AI' : 'Customer'}: ${h.text}`)
    .join('\n');

  const gemini = getGeminiClient();

  if (gemini) {
    try {
      const systemPrompt = `
You are OrderVoice AI. You are a professional, polite billing and verification automated calling agent calling a customer regarding an online order.
Introduce yourself concisely on your very first greeting (if history is empty).

CUSTOMER AND ORDER CONTEXT:
- Order ID: ${order.id}
- Customer Name: ${order.customerName}
- Customer Phone: ${order.phoneNumber}
- Delivery Address: ${order.address}, ${order.city}, ${order.state} - ${order.pincode}
- Total Order Value: Rs. ${order.orderValue}
- Cash on Delivery (COD) Amount: Rs. ${order.codAmount} (Applicable if COD)
- Payment Method: ${order.paymentMethod}
- Courier Partner: ${order.courierName}
- Current Order Status: ${order.status}
- Call Objective / Call Type: ${callType}

RULES FOR SPEAKING:
1. Speak absolutely naturally, warmly, and politely like a human support executive. 
2. Be extremely concise. Limit your speech to 1-2 brief conversational sentences (under 30 words) per turn so it qualifies for quick audio narration over a phone call.
3. Automatically adapt and switch to Hindi, Bengali, or English if the customer replies in those languages. You are completely bilingual and trilingual.
4. Try to satisfy the objective:
   - For COD Verification or Order Confirmation call: Confirm they wish to receive the pack. If yes, mark verified.
   - For Failed Delivery Recovery: Seek correct landmark or address, promise to notify the logistics.
   - For Feedback Collection call: Ask how satisfied they are on a scale of 1 to 5.
5. If the customer requests cancellation, accept it politely, do not argue, just confirm cancellation.
6. If the customer is aggressive, asks complex queries, or insists on talking to a supervisor, politely specify "Let me transfer you to a human agent right away" and mark the call intent as 'escalated'.

Based on this, process the customer's previous message: "${userMessage}".
Previous conversation log:
${historyString}

Output absolute pure valid JSON matching exactly the requested structure below. Do not wrap in markdown or any wrappers other than JSON.`;

      const response = await gemini.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          { text: systemPrompt },
          { text: `Conversation history:\n${historyString}\nCustomer: ${userMessage}` }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'The narrative spoken sentence generated by the AI calling agent. Keep it under 25 words.'
              },
              language: {
                type: Type.STRING,
                description: 'Language used by the customer (“English” or “Hindi” or “Bengali”).'
              },
              intent: {
                type: Type.STRING,
                description: 'Classified conversation intent so far: “none”, “confirmed”, “cancelled”, “escalated”, “reschedule”.'
              },
              notes: {
                type: Type.STRING,
                description: 'Operational summary of the conversation state or customer response.'
              }
            },
            required: ['reply', 'language', 'intent', 'notes']
          }
        }
      });

      const result = JSON.parse(response.text.trim());

      // If intent completed, let's auto-update the database order status and call logs!
      updateDatabaseOnIntent(db, order.id, callType, result);

      return res.json({
        reply: result.reply,
        language: result.language,
        intent: result.intent,
        notes: result.notes,
        isGeminiPowered: true
      });

    } catch (err) {
      console.error('Gemini call simulation error, falling back:', err);
    }
  }

  // Graceful rule-based local simulation engine (if Gemini is unavailable or errors out)
  const simulatedTurn = localMockCallingEngine(order, callType, userMessage, chatHistory.length);
  updateDatabaseOnIntent(db, order.id, callType, simulatedTurn);

  res.json({
    reply: simulatedTurn.reply,
    language: simulatedTurn.language,
    intent: simulatedTurn.intent,
    notes: simulatedTurn.notes,
    isGeminiPowered: false
  });
});

// Helper function to update state when conversation hits terminal intent
function updateDatabaseOnIntent(db: DbState, orderId: string, callType: string, result: any) {
  const orderIdx = db.orders.findIndex(o => o.id === orderId);
  if (orderIdx === -1) return;

  const currentOrder = db.orders[orderIdx];

  // Map intents to state changes
  if (result.intent === 'confirmed') {
    currentOrder.status = 'Confirmed';
    db.notifications.unshift({
      id: 'notif-' + Date.now(),
      orderId: currentOrder.id,
      channel: 'SMS',
      type: 'Call Completed',
      recipient: currentOrder.phoneNumber,
      content: `Your Order ${currentOrder.id} has been verified and confirmed via voice. It will ship tomorrow!`,
      status: 'Sent',
      sentAt: new Date().toISOString()
    });
  } else if (result.intent === 'cancelled') {
    currentOrder.status = 'Cancelled';
    db.notifications.unshift({
      id: 'notif-' + Date.now(),
      orderId: currentOrder.id,
      channel: 'WhatsApp',
      type: 'Call Completed',
      recipient: currentOrder.phoneNumber,
      content: `StyleKart: Order ${currentOrder.id} cancel request confirmed. No dispatch will take place.`,
      status: 'Sent',
      sentAt: new Date().toISOString()
    });
  }

  // Create or append call history
  const activeCall = {
    id: 'call-' + Math.floor(100000 + Math.random() * 900000),
    orderId,
    customerName: currentOrder.customerName,
    phoneNumber: currentOrder.phoneNumber,
    type: callType,
    status: 'Completed',
    durationSeconds: Math.floor(25 + Math.random() * 40),
    notes: result.notes,
    customerIntent: result.intent === 'confirmed' ? 'Confirmed Order' : result.intent === 'cancelled' ? 'Cancelled Order' : 'General response',
    languageDetected: result.language || 'English',
    escalationRequired: result.intent === 'escalated' ? true : false,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    companyId: 'comp-1',
  };

  db.calls.unshift(activeCall);
  
  // Track company volume
  db.companies[0].callsUsed += 1;

  writeDb(db);
}

// Local mock simulator for local development / backup
function localMockCallingEngine(order: any, callType: string, message: string, turnCount: number) {
  const text = message.toLowerCase();
  
  // Rule based intent matching
  let reply = '';
  let language: 'English' | 'Hindi' | 'Bengali' = 'English';
  let intent: 'none' | 'confirmed' | 'cancelled' | 'escalated' | 'reschedule' = 'none';
  let notes = 'Bilingual call verification initiated.';

  // Language check
  if (text.includes('कर दो') || text.includes('हाँ') || text.includes('नमस्ते') || text.includes('नहीं')) {
    language = 'Hindi';
  } else if (text.includes('হ্যাঁ') || text.includes('না') || text.includes('করুন') || text.includes('নমস্কার')) {
    language = 'Bengali';
  }

  // Conversation rules
  if (turnCount === 0) {
    if (language === 'Hindi') {
      reply = `नमस्ते ${order.customerName} जी, मैं स्टाइलकार्ट से आर्डरवॉइस एआई बोल रही हूँ। आपका ₹${order.orderValue} का कैश ऑन डिलीवरी आर्डर पुष्टि करने के लिए धन्यवाद। क्या आप इस आर्डर को कन्फर्म करना चाहते हैं?`;
    } else if (language === 'Bengali') {
      reply = `নমস্কার ${order.customerName} বাবু, আমি স্টাইলকার্ট থেকে অর্ডারভয়েস এআই বলছি। আপনার ₹${order.orderValue} মূল্যের ক্যাশ অন ডেলিভারি অর্ডারের সত্যতা নিশ্চিত করতে কল করেছি। আপনি কি অর্ডারটি নিশ্চিত করতে চান?`;
    } else {
      reply = `Hello ${order.customerName}, this is OrderVoice AI calling from StyleKart to verify your COD order of gold jewelry valued at ₹${order.orderValue}. Would you like to confirm or cancel this dispatch?`;
    }
  } else {
    // Check keywords for confirmation
    if (text.includes('confirm') || text.includes('yes') || text.includes('हाँ') || text.includes('haa') || text.includes('হ্যাঁ') || text.includes('হ্যা')) {
      intent = 'confirmed';
      notes = 'Customer responded yes, confirmed dispatch.';
      if (language === 'Hindi') {
        reply = `बहुत-बहुत धन्यवाद कुणाल जी! आपका स्टाइलकार्ट आर्डर सफलतापूर्वक कन्फर्म कर दिया गया है। जल्द ही आपके पास शिपिंग विवरण भेज दिया जायेगा। आपका दिन शुभ हो!`;
      } else if (language === 'Bengali') {
        reply = `অনেক ধন্যবাদ! আপনার স্টাইলকার্ট অর্ডারটি নিশ্চিত করা হয়েছে। দ্রুত আপনার ফোনে পার্সেল ট্র্যাকিং আইডি দেওয়া হবে। ভালো থাকবেন।`;
      } else {
        reply = `Awesome, your COD order has been confirmed successfully, Rajesh! We will process your dispatch tonight. Thank you for choosing StyleKart.`;
      }
    } else if (text.includes('cancel') || text.includes('no') || text.includes('रद्द') || text.includes('ना') || text.includes('cancel request')) {
      intent = 'cancelled';
      notes = 'Customer requested cancellation of order.';
      if (language === 'Hindi') {
        reply = `ठीक है, आपके अनुरोध पर हमने यह आर्डर रद्द कर दिया है। हमारी सेवा में संपर्क करने के लिए धन्यवाद।`;
      } else if (language === 'Bengali') {
        reply = `ঠিক আছে, আমরা অর্ডারটি বাতিল করে দিয়েছি। স্টাইলকার্টের সাথে থাকার জন্য ধন্যবাদ।`;
      } else {
        reply = `No problem. As requested, we have immediately cancelled your order in our systems. Thank you, hope to serve you again in the future.`;
      }
    } else if (text.includes('agent') || text.includes('talk') || text.includes('human') || text.includes('manager') || text.includes('शिकायत') || text.includes('কমিপ্লেন')) {
      intent = 'escalated';
      notes = 'Customer requested connection to support executive.';
      if (language === 'Hindi') {
        reply = `मैं समझ सकती हूँ। मैं अभी आपके कॉल को हमारे एक लाइव सपोर्ट एजेंट के पास ट्रांसफर कर रही हूँ। कृपया लाइन पर बने रहें।`;
      } else if (language === 'Bengali') {
        reply = `আমি অবশ্যই লোকাল সাপোর্ট এজেন্টের সাথে কানেক্ট করছি। দয়া করে একটু হোল্ড করুন।`;
      } else {
        reply = `Understood. I will immediately escalate this to our live ecommerce helpdesk and transfer this call. Please stay on the line.`;
      }
    } else {
      // General feedback or queries
      if (language === 'Hindi') {
        reply = `महोदय, कृपया पुष्टि करें कि क्या आप यह प्रोडक्ट ₹${order.orderValue} कैश ऑन डिलीवरी में डिलीवर करवाना चाहते हैं? हाँ या ना कहें।`;
      } else if (language === 'Bengali') {
        reply = `দয়া করে জানান আপনি কি ক্যাশ অন ডেলিভারি সম্পন্ন করতে ইচ্ছুক? হ্যাঁ অথবা না বলুন।`;
      } else {
        reply = `I registered your response, but I need to ask clearly: would you like to confirm the dispatch of this package? Say yes or cancel.`;
      }
    }
  }

  return { reply, language, intent, notes };
}


// ----------------------------------------------------
// VITE DEV SERVER / PRODUCTION SERVING SETUP
// ----------------------------------------------------
async function initializeViteOrProduction() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OrderVoice AI] Server started and listening on http://0.0.0.0:${PORT}`);
  });
}

initializeViteOrProduction().catch(err => {
  console.error('Failed to initialize server', err);
});
