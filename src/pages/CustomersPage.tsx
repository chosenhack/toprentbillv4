import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import CustomerForm from '../components/CustomerForm';
import CsvImportExport from '../components/CsvImportExport';
import { Users, Plus, ExternalLink, Crown, Edit, X, Power } from 'lucide-react';
import type { Customer, SalesTeam } from '../types';
import type { RootState, AppDispatch } from '../store';
import { addCustomer, updateCustomer, deactivateCustomer, reactivateCustomer } from '../store/slices/customersSlice';
import { addActivity } from '../store/slices/activitySlice';

const tableHeaders = [
  { id: 'customer', label: 'Cliente' },
  { id: 'email', label: 'Email' },
  { id: 'subscription', label: 'Abbonamento' },
  { id: 'frequency', label: 'Frequenza' },
  { id: 'amount', label: 'Importo' },
  { id: 'status', label: 'Stato' },
  { id: 'links', label: 'Links' },
  { id: 'actions', label: 'Azioni' }
] as const;

const CustomersPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [showForm, setShowForm] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const customers = useSelector((state: RootState) => state.customers.items);
  const user = useSelector((state: RootState) => state.auth.user);

  const handleAddCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch(addCustomer(customerData));
    dispatch(addActivity({
      type: 'customer_created',
      userId: user?.id || '',
      userName: user?.name || '',
      timestamp: new Date().toISOString(),
      details: {
        customerName: customerData.name
      }
    }));
    setShowForm(false);
  };

  const handleUpdateCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingCustomer) {
      dispatch(updateCustomer({ id: editingCustomer.id, ...customerData }));
      dispatch(addActivity({
        type: 'customer_updated',
        userId: user?.id || '',
        userName: user?.name || '',
        timestamp: new Date().toISOString(),
        details: {
          customerId: editingCustomer.id,
          customerName: customerData.name
        }
      }));
      setEditingCustomer(null);
      setShowForm(false);
    }
  };

  const handleToggleActive = (customer: Customer) => {
    if (customer.active) {
      dispatch(deactivateCustomer({ 
        id: customer.id, 
        deactivationDate: new Date().toISOString() 
      }));
      dispatch(addActivity({
        type: 'customer_deactivated',
        userId: user?.id || '',
        userName: user?.name || '',
        timestamp: new Date().toISOString(),
        details: {
          customerId: customer.id,
          customerName: customer.name
        }
      }));
    } else {
      dispatch(reactivateCustomer({ 
        id: customer.id, 
        activationDate: new Date().toISOString() 
      }));
    }
  };

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  const getTeamFlag = (team: SalesTeam) => {
    switch (team) {
      case 'IT':
        return 'https://flagpedia.net/data/flags/emoji/twitter/256x256/it.png';
      case 'ES':
        return 'https://flagpedia.net/data/flags/emoji/twitter/256x256/es.png';
      case 'FR':
        return 'https://flagpedia.net/data/flags/emoji/twitter/256x256/fr.png';
      case 'WORLD':
        return '🌍';
      default:
        return '';
    }
  };

  const activeCustomers = customers.filter(c => c.active);
  const inactiveCustomers = customers.filter(c => !c.active);
  const displayedCustomers = showInactive ? inactiveCustomers : activeCustomers;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Clienti</h1>
        </div>
        <div className="flex space-x-4">
          <CsvImportExport />
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`px-4 py-2 rounded-lg border ${
              showInactive ? 'bg-gray-100 text-gray-700' : 'bg-white text-gray-600'
            } hover:bg-gray-50`}
          >
            {showInactive ? 'Mostra Attivi' : 'Mostra Inattivi'}
          </button>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setShowForm(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Cliente</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingCustomer ? 'Modifica Cliente' : 'Aggiungi Nuovo Cliente'}
            </h2>
            <button
              onClick={handleCloseForm}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <CustomerForm 
            onSubmit={editingCustomer ? handleUpdateCustomer : handleAddCustomer}
            initialData={editingCustomer}
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {tableHeaders.map(header => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {customer.salesTeam !== 'WORLD' ? (
                        <img 
                          src={getTeamFlag(customer.salesTeam)} 
                          alt={`${customer.salesTeam} flag`}
                          className="w-6 h-4 object-cover rounded"
                        />
                      ) : (
                        <span className="text-lg">{getTeamFlag(customer.salesTeam)}</span>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                          {customer.isLuxury && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        {customer.billingInfo && (
                          <div className="text-xs text-gray-500">
                            {customer.billingInfo.companyName}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.subscriptionType.replace(/_/g, ' ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.paymentFrequency === 'monthly' && 'Mensile'}
                      {customer.paymentFrequency === 'quarterly' && 'Trimestrale'}
                      {customer.paymentFrequency === 'biannual' && 'Semestrale'}
                      {customer.paymentFrequency === 'annual' && 'Annuale'}
                      {customer.paymentFrequency === 'oneTime' && 'Una Tantum'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      €{customer.amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(customer)}
                      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        customer.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{customer.active ? 'Attivo' : 'Inattivo'}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-3">
                      {customer.stripeLink && (
                        <a
                          href={customer.stripeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {customer.crmLink && (
                        <a
                          href={customer.crmLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEditClick(customer)}
                      className="text-gray-600 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
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

export default CustomersPage;