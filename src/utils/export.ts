import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import type { Customer } from '../types';

export const exportCustomersToCSV = (
  filter: 'all' | 'active' | 'inactive',
  startDate?: string,
  endDate?: string
) => {
  let customers = window.__INITIAL_DATA__.customers as Customer[];

  // Filter by status
  if (filter === 'active') {
    customers = customers.filter(c => c.active);
  } else if (filter === 'inactive') {
    customers = customers.filter(c => !c.active);
  }

  // Filter by date range
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date

    customers = customers.filter(customer => {
      const activationDate = new Date(customer.activationDate);
      return activationDate >= start && activationDate <= end;
    });
  }

  const data = customers.map(customer => ({
    'Nome': customer.name,
    'Email': customer.email,
    'Tipo Abbonamento': customer.subscriptionType,
    'Frequenza Pagamento': customer.paymentFrequency,
    'Importo': customer.amount,
    'Sales Team': customer.salesTeam,
    'Luxury': customer.isLuxury ? 'Sì' : 'No',
    'Stato': customer.active ? 'Attivo' : 'Inattivo',
    'Data Attivazione': new Date(customer.activationDate).toLocaleDateString(),
    'Data Disattivazione': customer.deactivationDate 
      ? new Date(customer.deactivationDate).toLocaleDateString() 
      : '',
    'Nome Azienda': customer.billingInfo?.companyName || '',
    'P.IVA': customer.billingInfo?.vatNumber || '',
    'Nazione': customer.billingInfo?.country || '',
    'Indirizzo': customer.billingInfo?.address || '',
    'SDI': customer.billingInfo?.sdi || '',
    'PEC': customer.billingInfo?.pec || '',
    'Link Stripe': customer.stripeLink || '',
    'Link CRM': customer.crmLink || ''
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `clienti_export_${new Date().toISOString().split('T')[0]}.csv`);
};