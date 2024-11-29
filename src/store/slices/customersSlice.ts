import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Customer } from '../../types';

interface CustomersState {
  items: Customer[];
  loading: boolean;
  error: string | null;
}

const initialState: CustomersState = {
  items: [],
  loading: false,
  error: null,
};

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    addCustomer: (state, action: PayloadAction<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newCustomer: Customer = {
        ...action.payload,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      state.items.push(newCustomer);
    },
    updateCustomer: (state, action: PayloadAction<{ id: string } & Partial<Customer>>) => {
      const index = state.items.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload,
          updatedAt: new Date().toISOString()
        };
      }
    },
    deactivateCustomer: (state, action: PayloadAction<{ id: string; deactivationDate: string }>) => {
      const customer = state.items.find(c => c.id === action.payload.id);
      if (customer) {
        customer.active = false;
        customer.deactivationDate = action.payload.deactivationDate;
        customer.updatedAt = new Date().toISOString();
      }
    },
    reactivateCustomer: (state, action: PayloadAction<{ id: string; activationDate: string }>) => {
      const customer = state.items.find(c => c.id === action.payload.id);
      if (customer) {
        customer.active = true;
        customer.activationDate = action.payload.activationDate;
        customer.deactivationDate = undefined;
        customer.updatedAt = new Date().toISOString();
      }
    }
  }
});

export const { 
  addCustomer, 
  updateCustomer, 
  deactivateCustomer, 
  reactivateCustomer 
} = customersSlice.actions;

export default customersSlice.reducer;