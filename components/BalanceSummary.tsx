import React, { useMemo } from 'react';
import { Transaction, TransactionType, PaymentMethod, Debt, CreditCard } from '../types';

interface BalanceSummaryProps {
  transactions: Transaction[];
  debts: Debt[];
  creditCards: CreditCard[];
}

const StatCard: React.FC<{ title: string; amount: number; icon: string; color: string }> = ({ title, amount, icon, color }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center space-x-4">
    <div className={`rounded-full p-3 ${color} text-white`}>
      <i className={`fas ${icon} text-xl w-6 h-6 text-center`}></i>
    </div>
    <div>
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-gray-900">
        {amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </p>
    </div>
  </div>
);


const BalanceSummary: React.FC<BalanceSummaryProps> = ({ transactions, debts, creditCards }) => {
  const { total, bank, cash, creditCardDebt } = useMemo(() => {
    let bankBalance = 0;
    let cashBalance = 0;

    transactions
      .filter(t => t.paymentMethod !== PaymentMethod.CREDIT_CARD)
      .forEach(t => {
        const amount = t.type === TransactionType.INCOME ? t.amount : -t.amount;
        if (t.paymentMethod === PaymentMethod.BANK) {
          bankBalance += amount;
        } else {
          cashBalance += amount;
        }
      });

    const activeCardIds = new Set(creditCards.map(c => c.id));
    const ccDebt = debts
      .filter(d => d.billingCycleIdentifier && activeCardIds.has(d.person))
      .reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);

    return { 
      total: bankBalance + cashBalance, 
      bank: bankBalance, 
      cash: cashBalance,
      creditCardDebt: ccDebt
    };
  }, [transactions, debts, creditCards]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Disponible" amount={total} icon="fa-wallet" color="bg-blue-500" />
      <StatCard title="Cuenta Bancaria" amount={bank} icon="fa-university" color="bg-green-500" />
      <StatCard title="Efectivo" amount={cash} icon="fa-money-bill-wave" color="bg-yellow-500" />
      <StatCard title="Deuda Tarjetas" amount={creditCardDebt} icon="fa-credit-card" color="bg-red-500" />
    </div>
  );
};

export default BalanceSummary;