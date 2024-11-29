import type { Customer, Payment, Activity } from '../types';

// Base API class for common functionality
class BaseAPI {
  protected handleError(error: any): never {
    console.error('API Error:', error);
    throw error;
  }
}

// Customers API
export class CustomersAPI extends BaseAPI {
  getCustomers(): Promise<Customer[]> {
    try {
      const data = localStorage.getItem('customers');
      return Promise.resolve(data ? JSON.parse(data) : []);
    } catch (error) {
      return this.handleError(error);
    }
  }

  createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    try {
      const newCustomer = {
        ...customer,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const customers = this.getCustomersSync();
      customers.push(newCustomer);
      localStorage.setItem('customers', JSON.stringify(customers));

      return Promise.resolve(newCustomer);
    } catch (error) {
      return this.handleError(error);
    }
  }

  private getCustomersSync(): Customer[] {
    const data = localStorage.getItem('customers');
    return data ? JSON.parse(data) : [];
  }
}

// Payments API
export class PaymentsAPI extends BaseAPI {
  getPayments(): Promise<Payment[]> {
    try {
      const data = localStorage.getItem('payments');
      return Promise.resolve(data ? JSON.parse(data) : []);
    } catch (error) {
      return this.handleError(error);
    }
  }

  createPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    try {
      const newPayment = {
        ...payment,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const payments = this.getPaymentsSync();
      payments.push(newPayment);
      localStorage.setItem('payments', JSON.stringify(payments));

      return Promise.resolve(newPayment);
    } catch (error) {
      return this.handleError(error);
    }
  }

  updatePaymentStatus(id: string, status: Payment['status']): Promise<Payment> {
    try {
      const payments = this.getPaymentsSync();
      const paymentIndex = payments.findIndex(p => p.id === id);
      
      if (paymentIndex === -1) {
        throw new Error('Payment not found');
      }

      const updatedPayment = {
        ...payments[paymentIndex],
        status,
        updatedAt: new Date().toISOString()
      };

      payments[paymentIndex] = updatedPayment;
      localStorage.setItem('payments', JSON.stringify(payments));

      return Promise.resolve(updatedPayment);
    } catch (error) {
      return this.handleError(error);
    }
  }

  private getPaymentsSync(): Payment[] {
    const data = localStorage.getItem('payments');
    return data ? JSON.parse(data) : [];
  }
}

// Activities API
export class ActivitiesAPI extends BaseAPI {
  getActivities(): Promise<Activity[]> {
    try {
      const data = localStorage.getItem('activities');
      return Promise.resolve(data ? JSON.parse(data) : []);
    } catch (error) {
      return this.handleError(error);
    }
  }

  createActivity(activity: Omit<Activity, 'id'>): Promise<Activity> {
    try {
      const newActivity = {
        ...activity,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      };

      const activities = this.getActivitiesSync();
      activities.push(newActivity);
      localStorage.setItem('activities', JSON.stringify(activities));

      return Promise.resolve(newActivity);
    } catch (error) {
      return this.handleError(error);
    }
  }

  private getActivitiesSync(): Activity[] {
    const data = localStorage.getItem('activities');
    return data ? JSON.parse(data) : [];
  }
}

// Export API instances
export const customersAPI = new CustomersAPI();
export const paymentsAPI = new PaymentsAPI();
export const activitiesAPI = new ActivitiesAPI();