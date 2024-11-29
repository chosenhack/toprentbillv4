import React from 'react';
import { useSelector } from 'react-redux';
import { History, User, Calendar, ArrowRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import type { RootState } from '../store';

const ActivityPage = () => {
  const activities = useSelector((state: RootState) => state.activity.items);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'customer_created':
      case 'customer_updated':
      case 'customer_deactivated':
        return <User className="w-5 h-5 text-blue-600" />;
      case 'payment_confirmed':
      case 'payment_updated':
        return <Calendar className="w-5 h-5 text-green-600" />;
      case 'user_login':
        return <ArrowRight className="w-5 h-5 text-purple-600" />;
      default:
        return <History className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActivityDescription = (activity: any) => {
    const { type, details } = activity;
    switch (type) {
      case 'customer_created':
        return `Nuovo cliente creato: ${details.customerName}`;
      case 'customer_updated':
        return `Cliente aggiornato: ${details.customerName}`;
      case 'customer_deactivated':
        return `Cliente disattivato: ${details.customerName}`;
      case 'payment_confirmed':
        return `Pagamento confermato: €${details.amount} per ${details.customerName}`;
      case 'payment_updated':
        return `Pagamento aggiornato per ${details.customerName}`;
      case 'user_login':
        return 'Accesso effettuato';
      default:
        return 'Attività registrata';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'customer_created':
        return 'bg-blue-100';
      case 'customer_updated':
        return 'bg-yellow-100';
      case 'customer_deactivated':
        return 'bg-red-100';
      case 'payment_confirmed':
        return 'bg-green-100';
      case 'payment_updated':
        return 'bg-purple-100';
      case 'user_login':
        return 'bg-indigo-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <History className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Registro Attività</h1>
      </div>

      {activities.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Nessuna attività registrata</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.userName}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(activity.timestamp), { 
                            addSuffix: true,
                            locale: it 
                          })}
                        </span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(activity.timestamp), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {getActivityDescription(activity)}
                    </p>
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

export default ActivityPage;