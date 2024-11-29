import { paymentsAPI } from './api';
import type { Payment } from '../types';

export const getPayments = () => {
  return paymentsAPI.getPayments();
};

export const createPayment = (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
  return paymentsAPI.createPayment(payment);
};

export const updatePaymentStatus = (id: string, status: Payment['status']) => {
  return paymentsAPI.updatePaymentStatus(id, status);
};