import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { addCustomer } from '../store/slices/customersSlice';
import { addActivity } from '../store/slices/activitySlice';
import type { Customer, SubscriptionType, PaymentFrequency, SalesTeam } from '../types';
import type { RootState } from '../store';
import Papa from 'papaparse';

const CsvImportExport = () => {
  const dispatch = useDispatch();
  const existingCustomers = useSelector((state: RootState) => state.customers.items);
  const user = useSelector((state: RootState) => state.auth.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{
    show: boolean;
    success: boolean;
    message: string;
  }>({ show: false, success: false, message: '' });

  const csvTemplate = `Nome,Email,Tipo Abbonamento,Frequenza Pagamento,Importo,Sales Team,Luxury,Nome Azienda,P.IVA,Nazione,Indirizzo,SDI,PEC,Link Stripe,Link CRM
Acme Corporation,billing@acme.com,FLEET_PRO,monthly,299.99,IT,true,Acme Corp SRL,IT12345678901,Italia,Via Roma 1 Milano,ABC123,pec@acme.com,https://dashboard.stripe.com/customers/cus_xxx,https://crm.example.com/customer/123
TechStart SRL,admin@techstart.it,SITO_2.0,annual,899.99,ES,false,TechStart SRL,ES98765432109,Spagna,Calle Mayor 23 Madrid,XYZ789,pec@techstart.it,https://dashboard.stripe.com/customers/cus_yyy,https://crm.example.com/customer/456`;

  const validateSubscriptionType = (value: string): SubscriptionType | null => {
    const validTypes: SubscriptionType[] = [
      'SITO_1.0', 'FLEET_PRO_SITO_2.0', 'SITO_2.0', 'FLEET_SITO_2.0',
      'PERSONALIZZAZIONI', 'BOOKING_ENGINE', 'CUSTOM', 'FLEET_PRO_BOOKING_ENGINE',
      'FLEET_BASIC_BOOKING_ENGINE', 'PAY_AS_YOU_GO', 'FLEET_PRO', 'FLEET_BASIC'
    ];
    return validTypes.includes(value as SubscriptionType) ? value as SubscriptionType : null;
  };

  const validatePaymentFrequency = (value: string): PaymentFrequency | null => {
    const validFrequencies: PaymentFrequency[] = ['monthly', 'quarterly', 'biannual', 'annual', 'oneTime'];
    return validFrequencies.includes(value as PaymentFrequency) ? value as PaymentFrequency : null;
  };

  const validateSalesTeam = (value: string): SalesTeam | null => {
    const validTeams: SalesTeam[] = ['IT', 'ES', 'FR', 'WORLD'];
    return validTeams.includes(value as SalesTeam) ? value as SalesTeam : null;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        let successCount = 0;
        let errorCount = 0;

        for (const row of results.data as any[]) {
          try {
            if (!row['Nome'] || !row['Email']) {
              errorCount++;
              continue;
            }

            const subscriptionType = validateSubscriptionType(row['Tipo Abbonamento']);
            const paymentFrequency = validatePaymentFrequency(row['Frequenza Pagamento']);
            const salesTeam = validateSalesTeam(row['Sales Team']);
            const amount = parseFloat(row['Importo']);

            if (!subscriptionType || !paymentFrequency || !salesTeam || isNaN(amount)) {
              errorCount++;
              continue;
            }

            const customerData = {
              name: row['Nome'].trim(),
              email: row['Email'].trim().toLowerCase(),
              subscriptionType,
              paymentFrequency,
              amount,
              salesTeam,
              isLuxury: row['Luxury']?.toLowerCase() === 'true',
              active: true,
              activationDate: new Date().toISOString(),
              stripeLink: row['Link Stripe']?.trim() || '',
              crmLink: row['Link CRM']?.trim() || '',
              billingInfo: row['Nome Azienda'] ? {
                companyName: row['Nome Azienda'].trim(),
                vatNumber: row['P.IVA']?.trim(),
                country: row['Nazione']?.trim(),
                address: row['Indirizzo']?.trim(),
                sdi: row['SDI']?.trim(),
                pec: row['PEC']?.trim()
              } : undefined
            };

            dispatch(addCustomer(customerData));
            
            dispatch(addActivity({
              type: 'customer_created',
              userId: user?.id || '',
              userName: user?.name || '',
              timestamp: new Date().toISOString(),
              details: {
                customerName: customerData.name,
                description: 'Cliente importato da CSV'
              }
            }));

            successCount++;
          } catch (error) {
            errorCount++;
          }
        }

        setImportStatus({
          show: true,
          success: errorCount === 0,
          message: `Importati ${successCount} nuovi clienti${errorCount > 0 ? `, ${errorCount} errori` : ''}`
        });

        setTimeout(() => {
          setImportStatus(prev => ({ ...prev, show: false }));
        }, 5000);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  };

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_clienti.csv';
    link.click();
  };

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={downloadTemplate}
        className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <Download className="w-4 h-4" />
        <span>Scarica Template</span>
      </button>

      <div className="relative">
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
          id="csvInput"
        />
        <label
          htmlFor="csvInput"
          className="flex items-center space-x-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Importa CSV</span>
        </label>
      </div>

      {importStatus.show && (
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
          importStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {importStatus.success ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}
    </div>
  );
};

export default CsvImportExport;