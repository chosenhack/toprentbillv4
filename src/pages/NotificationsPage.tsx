import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  Bell, 
  Calendar, 
  AlertCircle, 
  Clock,
  CheckCircle2,
  UserMinus,
  RefreshCw
} from 'lucide-react';
import type { RootState } from '../store';
import { 
  format, 
  addDays, 
  isWithinInterval, 
  parseISO, 
  differenceInDays,
  isBefore,
  addMonths,
  startOfToday
} from 'date-fns';
import { it } from 'date-fns/locale';

const NotificationsPage = () => {
  const customers = useSelector((state: RootState) => state.customers.items);
  const payments = useSelector((state: RootState) => state.payments.items);
  const today = startOfToday();

  const notifications = useMemo(() => {
    const result = [];

    // Notifiche per pagamenti in scadenza (prossimi 15 giorni)
    const activeCustomers = customers.filter(c => c.active);
    activeCustomers.forEach(customer => {
      let nextPaymentDate = parseISO(customer.activationDate);
      const interval = {
        start: today,
        end: addDays(today, 15)
      };

      // Calcola la prossima data di pagamento
      while (isBefore(nextPaymentDate, today)) {
        switch (customer.paymentFrequency) {
          case 'monthly':
            nextPaymentDate = addMonths(nextPaymentDate, 1);
            break;
          case 'quarterly':
            nextPaymentDate = addMonths(nextPaymentDate, 3);
            break;
          case 'biannual':
            nextPaymentDate = addMonths(nextPaymentDate, 6);
            break;
          case 'annual':
            nextPaymentDate = addMonths(nextPaymentDate, 12);
            break;
          default:
            continue;
        }
      }

      if (isWithinInterval(nextPaymentDate, interval)) {
        result.push({
          id: `payment-${customer.id}-${format(nextPaymentDate, 'yyyy-MM-dd')}`,
          type: 'payment',
          customer,
          date: nextPaymentDate,
          amount: customer.amount,
          daysUntil: differenceInDays(nextPaymentDate, today)
        });
      }
    });

    // Notifiche per pagamenti problematici
    const problemPayments = payments
      .filter(p => p.status === 'problem')
      .map(payment => {
        const customer = customers.find(c => c.id === payment.customerId);
        if (!customer) return null;
        return {
          id: `problem-${payment.id}`,
          type: 'problem',
          customer,
          date: parseISO(payment.date),
          amount: payment.amount,
          paymentId: payment.id
        };
      })
      .filter(Boolean);

    result.push(...problemPayments);

    // Notifiche per clienti recentemente disattivati (ultimi 7 giorni)
    const recentlyDeactivated = customers
      .filter(customer => 
        !customer.active && 
        customer.deactivationDate &&
        isWithinInterval(parseISO(customer.deactivationDate), {
          start: addDays(today, -7),
          end: today
        })
      )
      .map(customer => ({
        id: `deactivated-${customer.id}`,
        type: 'deactivated',
        customer,
        date: parseISO(customer.deactivationDate!),
        amount: customer.amount
      }));

    result.push(...recentlyDeactivated);

    // Ordina le notifiche per data (più recenti prima)
    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [customers, payments, today]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'problem':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'deactivated':
        return <UserMinus className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'payment':
        return 'bg-blue-100';
      case 'problem':
        return 'bg-red-100';
      case 'deactivated':
        return 'bg-orange-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getNotificationMessage = (notification: any) => {
    switch (notification.type) {
      case 'payment':
        if (notification.daysUntil === 0) {
          return `Pagamento di €${notification.amount.toFixed(2)} in scadenza oggi`;
        } else if (notification.daysUntil === 1) {
          return `Pagamento di €${notification.amount.toFixed(2)} in scadenza domani`;
        } else {
          return `Pagamento di €${notification.amount.toFixed(2)} in scadenza tra ${notification.daysUntil} giorni`;
        }
      case 'problem':
        return `Problema con il pagamento di €${notification.amount.toFixed(2)}`;
      case 'deactivated':
        return `Cliente disattivato il ${format(notification.date, 'dd/MM/yyyy')}`;
      default:
        return '';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Bell className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Notifiche</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Nessuna notifica presente</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-full ${getNotificationBg(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.customer.name}
                      </p>
                      <span className="text-sm text-gray-500">
                        {format(notification.date, 'dd/MM/yyyy')}
                      </span>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600">
                      {getNotificationMessage(notification)}
                    </p>

                    <div className="mt-2 flex items-center space-x-4">
                      {notification.customer.stripeLink && (
                        <a
                          href={notification.customer.stripeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Stripe
                        </a>
                      )}
                      {notification.customer.crmLink && (
                        <a
                          href={notification.customer.crmLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          CRM
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;