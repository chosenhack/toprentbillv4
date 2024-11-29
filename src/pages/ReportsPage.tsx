import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Users,
  UserMinus,
  Repeat,
  Crown
} from 'lucide-react';
import type { RootState } from '../store';
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
  isWithinInterval,
  isSameMonth
} from 'date-fns';
import { it } from 'date-fns/locale';

const ReportsPage = () => {
  const customers = useSelector((state: RootState) => state.customers.items);
  const payments = useSelector((state: RootState) => state.payments.items);

  const currentDate = new Date();
  const lastMonth = subMonths(currentDate, 1);

  const stats = useMemo(() => {
    const currentMonthStart = startOfMonth(currentDate);
    const currentMonthEnd = endOfMonth(currentDate);
    const lastMonthStart = startOfMonth(lastMonth);
    const lastMonthEnd = endOfMonth(lastMonth);

    // Active Subscriptions
    const activeCustomers = customers.filter(c => c.active);
    const activeSubscriptions = activeCustomers.length;

    // New Customers This Month
    const newCustomers = customers.filter(customer => {
      const activationDate = parseISO(customer.activationDate);
      return isWithinInterval(activationDate, {
        start: currentMonthStart,
        end: currentMonthEnd
      });
    });

    // Churn Rate
    const deactivatedThisMonth = customers.filter(customer => {
      if (!customer.deactivationDate) return false;
      const deactivationDate = parseISO(customer.deactivationDate);
      return isWithinInterval(deactivationDate, {
        start: currentMonthStart,
        end: currentMonthEnd
      });
    });

    const churnRate = activeSubscriptions > 0 
      ? (deactivatedThisMonth.length / activeSubscriptions) * 100 
      : 0;

    // Revenue Calculations
    const currentMonthPayments = payments.filter(payment => 
      isSameMonth(parseISO(payment.date), currentDate) &&
      payment.status === 'confirmed'
    );

    const lastMonthPayments = payments.filter(payment => 
      isSameMonth(parseISO(payment.date), lastMonth) &&
      payment.status === 'confirmed'
    );

    const currentMonthRevenue = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const lastMonthRevenue = lastMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Expected Revenue (sum of all active subscriptions)
    const expectedMonthlyRevenue = activeCustomers.reduce((sum, customer) => {
      switch (customer.paymentFrequency) {
        case 'monthly':
          return sum + customer.amount;
        case 'quarterly':
          return sum + (customer.amount / 3);
        case 'biannual':
          return sum + (customer.amount / 6);
        case 'annual':
          return sum + (customer.amount / 12);
        default:
          return sum;
      }
    }, 0);

    // Luxury Customers Stats
    const luxuryCustomers = activeCustomers.filter(c => c.isLuxury);
    const luxuryRevenue = currentMonthPayments
      .filter(payment => {
        const customer = customers.find(c => c.id === payment.customerId);
        return customer?.isLuxury;
      })
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Sales Team Performance
    const salesTeamRevenue = activeCustomers.reduce((acc, customer) => {
      const team = customer.salesTeam;
      const revenue = customer.amount;
      acc[team] = (acc[team] || 0) + revenue;
      return acc;
    }, {} as Record<string, number>);

    return {
      activeSubscriptions,
      newCustomersCount: newCustomers.length,
      churnRate,
      currentMonthRevenue,
      lastMonthRevenue,
      expectedMonthlyRevenue,
      revenueGrowth: ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100,
      luxuryCustomersCount: luxuryCustomers.length,
      luxuryRevenue,
      salesTeamRevenue,
      deactivatedCount: deactivatedThisMonth.length
    };
  }, [customers, payments, currentDate, lastMonth]);

  const getTeamLabel = (team: string): string => {
    switch (team) {
      case 'IT':
        return 'Italia';
      case 'ES':
        return 'Spagna';
      case 'FR':
        return 'Francia';
      case 'WORLD':
        return 'Mondo';
      default:
        return team;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Report</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Abbonamenti Attivi</p>
              <p className="text-2xl font-semibold mt-1">{stats.activeSubscriptions}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasso di Abbandono</p>
              <p className="text-2xl font-semibold mt-1">{stats.churnRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.deactivatedCount} clienti questo mese
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <UserMinus className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fatturato Previsto</p>
              <p className="text-2xl font-semibold mt-1">€{stats.expectedMonthlyRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fatturato Attuale</p>
              <p className="text-2xl font-semibold mt-1">€{stats.currentMonthRevenue.toFixed(2)}</p>
              <p className="text-sm mt-1">
                {stats.revenueGrowth >= 0 ? (
                  <span className="text-green-600">+{stats.revenueGrowth.toFixed(1)}%</span>
                ) : (
                  <span className="text-red-600">{stats.revenueGrowth.toFixed(1)}%</span>
                )}
                {' '}vs mese precedente
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Performance Team di Vendita</h2>
          <div className="space-y-4">
            {Object.entries(stats.salesTeamRevenue).map(([team, revenue]) => (
              <div key={team} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">
                    {team === 'IT' && '🇮🇹'}
                    {team === 'ES' && '🇪🇸'}
                    {team === 'FR' && '🇫🇷'}
                    {team === 'WORLD' && '🌍'}
                  </span>
                  <span className="font-medium">
                    {getTeamLabel(team)}
                  </span>
                </div>
                <span className="font-semibold">€{revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-2 mb-4">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h2 className="text-lg font-semibold">Clienti Luxury</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Numero Clienti</p>
              <p className="text-2xl font-semibold">{stats.luxuryCustomersCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fatturato Mensile</p>
              <p className="text-2xl font-semibold">€{stats.luxuryRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Nuovi Clienti</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{stats.newCustomersCount}</p>
              <p className="text-sm text-gray-600">Questo Mese</p>
            </div>
            <Users className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Rinnovi</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">
                {format(currentDate, 'MMMM yyyy', { locale: it })}
              </p>
              <p className="text-sm text-gray-600">Periodo Corrente</p>
            </div>
            <Repeat className="w-12 h-12 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;