import React, { useState } from 'react';
import type { Payment, PaymentStatus } from '../types';

interface PaymentFormProps {
  customerId: string;
  onSubmit: (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ customerId, onSubmit }) => {
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending' as PaymentStatus,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      customerId,
      amount: parseFloat(formData.amount),
      date: formData.date,
      status: formData.status,
      createdBy: 'current-user', // This should come from auth context
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Importo
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">€</span>
          </div>
          <input
            type="number"
            required
            step="0.01"
            className="pl-7 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Data
        </label>
        <input
          type="date"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Stato
        </label>
        <select
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as PaymentStatus })}
        >
          <option value="pending">In Sospeso</option>
          <option value="confirmed">Confermato</option>
          <option value="problem">Problema</option>
          <option value="processing">In Corso</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Registra Pagamento
      </button>
    </form>
  );
};

export default PaymentForm;