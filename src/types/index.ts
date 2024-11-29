export type SubscriptionType =
  | 'SITO_1.0'
  | 'FLEET_PRO_SITO_2.0'
  | 'SITO_2.0'
  | 'FLEET_SITO_2.0'
  | 'PERSONALIZZAZIONI'
  | 'BOOKING_ENGINE'
  | 'CUSTOM'
  | 'FLEET_PRO_BOOKING_ENGINE'
  | 'FLEET_BASIC_BOOKING_ENGINE'
  | 'PAY_AS_YOU_GO'
  | 'FLEET_PRO'
  | 'FLEET_BASIC';

export type PaymentFrequency = 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'oneTime';

export type PaymentStatus = 'confirmed' | 'pending' | 'problem' | 'processing';

export type SalesTeam = 'IT' | 'ES' | 'FR' | 'WORLD';

export interface BillingInfo {
  companyName: string;
  vatNumber: string;
  country: string;
  address: string;
  sdi: string;
  pec: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  subscriptionType: SubscriptionType;
  paymentFrequency: PaymentFrequency;
  amount: number;
  stripeLink: string;
  crmLink: string;
  billingInfo?: BillingInfo;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  deactivationDate?: string;
  activationDate: string;
  salesTeam: SalesTeam;
  isLuxury: boolean;
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  status: PaymentStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export type ActivityType = 
  | 'customer_created'
  | 'customer_updated'
  | 'customer_deactivated'
  | 'customer_reactivated'
  | 'payment_created'
  | 'payment_confirmed'
  | 'payment_updated'
  | 'payment_status_updated'
  | 'customers_imported'
  | 'user_login'
  | 'user_logout';

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  timestamp: string;
  details: {
    customerId?: string;
    customerName?: string;
    paymentId?: string;
    amount?: number;
    oldStatus?: PaymentStatus;
    newStatus?: PaymentStatus;
    importCount?: number;
    description?: string;
  };
}

declare global {
  interface Window {
    __INITIAL_DATA__: {
      customers: Customer[];
    };
  }
}