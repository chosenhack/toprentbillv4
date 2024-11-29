import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Check, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Users,
  Repeat,
  DollarSign
} from 'lucide-react';
import type { Payment, Customer } from '../types';
import type { RootState, AppDispatch } from '../store';
import { updatePaymentStatus, addPayment } from '../store/slices/paymentsSlice';
import { addActivity } from '../store/slices/activitySlice';
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  isSameMonth, 
  isAfter, 
  isBefore, 
  addMonths, 
  subMonths,
  isWithinInterval,
  addDays,
  addYears 
} from 'date-fns';
import { it } from 'date-fns/locale';

const PaymentsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  
  const payments = useSelector((state: RootState) => state.payments.items);
  const customers = useSelector((state: RootState) => state.customers.items);
  const user = useSelector((state: RootState) => state.auth.user);

  // Generate expected payments for active customers
  const expectedPayments = useMemo(() => {
    const result: Payment[] = [];
    const activeCustomers = customers.filter(c => c.active);
    const oneYearFromNow = addYears(new Date(), 1);

    activeCustomers.forEach(customer => {
      let paymentDate = parseISO(customer.activationDate);
      const deactivationDate = customer.deactivationDate ? parseISO(customer.deactivationDate) : null;

      while (isBefore(paymentDate, oneYearFromNow)) {
        if (deactivationDate && isAfter(paymentDate, deactivationDate)) {
          break;
        }

        const existingPayment = payments.find(p => 
          p.customerId === customer.id && 
          isSameMonth(parseISO(p.date), paymentDate)
        );

        if (!existingPayment) {
          result.push({
            id: `expected-${customer.id}-${format(paymentDate, 'yyyy-MM')}`,
            customerId: customer.id,
            amount: customer.amount,
            date: paymentDate.toISOString(),
            status: 'pending',
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        switch (customer.paymentFrequency) {
          case 'monthly':
            paymentDate = addMonths(paymentDate, 1);
            break;
          case 'quarterly':
            paymentDate = addMonths(paymentDate, 3);
            break;
          case 'biannual':
            paymentDate = addMonths(paymentDate, 6);
            break;
          case 'annual':
            paymentDate = addMonths(paymentDate, 12);
            break;
          case 'oneTime':
            paymentDate = oneYearFromNow;
            break;
        }
      }
    });

    return result;
  }, [customers, payments]);

  const monthlyPayments = useMemo(() => {
    const allPayments = [...payments, ...expectedPayments];
    return allPayments.filter(payment => 
      isSameMonth(parseISO(payment.date), currentDate)
    ).map(payment => ({
      ...payment,
      customer: customers.find(c => c.id === payment.customerId)
    })).filter(p => p.customer);
  }, [payments, expectedPayments, customers, currentDate]);

  const handleStatusChange = async (payment: Payment, newStatus: Payment['status']) => {
    try {
      if (payment.id.startsWith('expected-')) {
        // Se è un pagamento previsto, crea un nuovo pagamento effettivo
        const newPayment = {
          customerId: payment.customerId,
          amount: payment.amount,
          date: payment.date,
          status: newStatus,
          createdBy: user?.name || 'system'
        };
        
        await dispatch(addPayment(newPayment)).unwrap();
        
        dispatch(addActivity({
          type: 'payment_confirmed',
          userId: user?.id || '',
          userName: user?.name || '',
          timestamp: new Date().toISOString(),
          details: {
            customerId: payment.customerId,
            customerName: customers.find(c => c.id === payment.customerId)?.name,
            amount: payment.amount
          }
        }));
      } else {
        // Altrimenti aggiorna lo stato del pagamento esistente
        await dispatch(updatePaymentStatus({ id: payment.id, status: newStatus })).unwrap();
        
        dispatch(addActivity({
          type: 'payment_updated',
          userId: user?.id || '',
          userName: user?.name || '',
          timestamp: new Date().toISOString(),
          details: {
            customerId: payment.customerId,
            customerName: customers.find(c => c.id === payment.customerId)?.name,
            paymentId: payment.id,
            amount: payment.amount,
            oldStatus: payment.status,
            newStatus
          }
        }));
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const monthlyStats = useMemo(() => {
    const confirmedPayments = monthlyPayments.filter(p => p.status === 'confirmed');
    const totalConfirmed = confirmedPayments.length;
    const totalPayments = monthlyPayments.length;

    // Calcola il tasso di conferma basato sul numero di clienti che hanno pagato
    const confirmationRate = totalPayments > 0 
      ? (totalConfirmed / totalPayments) * 100 
      : 0;

    // Calcola i rinnovi (pagamenti per clienti che hanno già pagato in precedenza)
    const renewalPayments = monthlyPayments.filter(p => {
      const previousPayments = payments.filter(prevP => 
        prevP.customerId === p.customerId && 
        isBefore(parseISO(prevP.date), parseISO(p.date))
      );
      return previousPayments.length > 0;
    });

    // Calcola i nuovi clienti del mese
    const newCustomersThisMonth = customers.filter(customer => 
      isSameMonth(parseISO(customer.activationDate), currentDate)
    );

    return {
      totalConfirmed: confirmedPayments.reduce((sum, p) => sum + p.amount, 0),
      totalExpected: monthlyPayments.reduce((sum, p) => sum + p.amount, 0),
      renewalsCount: renewalPayments.length,
      newCustomersCount: newCustomersThisMonth.length,
      newCustomersValue: newCustomersThisMonth.reduce((sum, c) => sum + c.amount, 0),
      confirmationRate
    };
  }, [monthlyPayments, customers, currentDate, payments]);

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'confirmed':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'problem':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'problem':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Pagamenti</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentDate(d => subMonths(d, 1))}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-medium">
            {format(currentDate, 'MMMM yyyy', { locale: it })}
          </span>
          <button
            onClick={() => setCurrentDate(d => addMonths(d, 1))}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rinnovi</p>
              <p className="text-2xl font-semibold mt-1">{monthlyStats.renewalsCount}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Repeat className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nuovi Clienti</p>
              <p className="text-2xl font-semibold mt-1">{monthlyStats.newCustomersCount}</p>
              <p className="text-sm text-gray-500">€{monthlyStats.newCustomersValue.toFixed(2)}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totale Confermato</p>
              <p className="text-2xl font-semibold mt-1">€{monthlyStats.totalConfirmed.toFixed(2)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totale Previsto</p>
              <p className="text-2xl font-semibold mt-1">€{monthlyStats.totalExpected.toFixed(2)}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasso di Conferma</p>
              <p className="text-2xl font-semibold mt-1">
                {monthlyStats.confirmationRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Importo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.customer?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.customer?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(parseISO(payment.date), 'dd/MM/yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      €{payment.amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={payment.status}
                      onChange={(e) => handleStatusChange(payment, e.target.value as Payment['status'])}
                      className={`text-sm rounded-full px-3 py-1 ${getStatusColor(payment.status)}`}
                    >
                      <option value="confirmed">Confermato</option>
                      <option value="pending">In Attesa</option>
                      <option value="problem">Problema</option>
                      <option value="processing">In Elaborazione</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;