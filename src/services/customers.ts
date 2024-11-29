import { customersAPI } from './api';
import type { Customer } from '../types';

export const getCustomers = () => {
  return customersAPI.getCustomers();
};

export const createCustomer = (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
  return customersAPI.createCustomer(customer);
};