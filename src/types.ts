/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Super Admin' | 'Company Admin' | 'Manager' | 'Support Agent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
}

export interface Company {
  id: string;
  name: string;
  subdomain: string;
  phone: string;
  apiKey: string;
  voiceProvider: 'twilio' | 'exotel';
  voiceConfig: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  subscriptionPlan: 'starter' | 'professional' | 'enterprise';
  callsUsed: number;
  callsLimit: number;
}

export type OrderStatus =
  | 'Pending Verification'
  | 'Confirmed'
  | 'Cancelled'
  | 'Shipped'
  | 'Out For Delivery'
  | 'Delivered'
  | 'Failed Delivery'
  | 'Returned'
  | 'Refunded';

export interface Order {
  id: string; // Order ID e.g. ORD-1029
  customerName: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  orderValue: number;
  codAmount: number;
  paymentMethod: 'COD' | 'Prepaid';
  courierName: string;
  trackingId: string;
  status: OrderStatus;
  deliveryDate?: string;
  createdAt: string;
  companyId: string;
}

export type CallType =
  | 'COD Verification'
  | 'Order Confirmation'
  | 'Shipping Update'
  | 'Delivery Reminder'
  | 'Failed Delivery Recovery'
  | 'Feedback Collection';

export type CallStatus =
  | 'Scheduled'
  | 'In-Progress'
  | 'Completed'
  | 'Missed'
  | 'Failed'
  | 'Busy'
  | 'No-Answer';

export interface Call {
  id: string;
  orderId: string;
  customerName: string;
  phoneNumber: string;
  type: CallType;
  status: CallStatus;
  durationSeconds: number; // e.g. 45
  recordingUrl?: string;
  transcript?: string; // Transcript text
  notes?: string; // AI generated summary/notes
  customerIntent?: string; // e.g. "Confirmed COD order", "Requested Sunday delivery"
  languageDetected?: 'English' | 'Hindi' | 'Bengali' | 'Unknown';
  escalationRequired: boolean;
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
  companyId: string;
}

export interface CustomerProfile {
  phoneNumber: string;
  name: string;
  email: string;
  city: string;
  state: string;
  orders: Order[];
  calls: Call[];
  notes: string;
  customerSatisfaction?: number; // 1-5 stars
}

export interface NotificationLog {
  id: string;
  orderId: string;
  channel: 'Email' | 'SMS' | 'WhatsApp';
  type: 'Order Created' | 'Call Completed' | 'Failed Call' | 'Delivery Reminder';
  recipient: string;
  content: string;
  status: 'Sent' | 'Failed' | 'Pending';
  sentAt: string;
}

export interface BillingInvoice {
  id: string;
  companyId: string;
  invoiceNumber: string;
  amount: number;
  status: 'Paid' | 'Unpaid';
  date: string;
  callsVolume: number;
}
