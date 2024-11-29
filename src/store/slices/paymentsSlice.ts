import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as paymentService from '../../services/payments';
import type { Payment } from '../../types';

interface PaymentsState {
  items: Payment[];
  loading: boolean;
  error: string | null;
}

const initialState: PaymentsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchPayments = createAsyncThunk(
  'payments/fetchAll',
  async () => {
    return await paymentService.getPayments();
  }
);

export const addPayment = createAsyncThunk(
  'payments/add',
  async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await paymentService.createPayment(payment);
  }
);

export const updatePaymentStatus = createAsyncThunk(
  'payments/updateStatus',
  async ({ id, status }: { id: string; status: Payment['status'] }) => {
    return await paymentService.updatePaymentStatus(id, status);
  }
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Payments
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error fetching payments';
      })
      // Add Payment
      .addCase(addPayment.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      // Update Payment Status
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  }
});

export default paymentsSlice.reducer;