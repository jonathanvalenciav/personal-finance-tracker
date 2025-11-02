import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Category } from '../types';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onEdit: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, category, onEdit }) => {
  const isIncome = transaction.type === TransactionType.INCOME;
  const isVoided = transaction.status === 'voided';
  
  const isCreditCardRefund = isIncome && transaction.category === 'Pago Tarjeta de Crédito';
  
  const amountColor = isVoided ? 'text-gray-500' : (isIncome ? 'text-green-600' : 'text-gray-900');
  
  const categoryIcon = category?.icon || 'fa-question-circle';
  const categoryIconColor = category?.color ? `${category.color.replace('bg-','bg-').replace('-500','-100')} ${category.color.replace('bg-','text-').replace('-500','-600')}` : 'bg-gray-100 text-gray-600';

  const isSpecialIncome = isIncome && (category?.name === 'Deudas' || category?.name === 'Pago Tarjeta de Crédito');
  const icon = isIncome && !isSpecialIncome ? 'fa-arrow-up' : categoryIcon;
  const iconColor = isIncome && !isSpecialIncome ? 'bg-green-100 text-green-600' : categoryIconColor;
  
  return (
    <li className={`group flex items-center p-3 border-b border-gray-200 ${isVoided ? 'bg-gray-50 opacity-60' : 'bg-white'}`}>
      <div className="flex items-center flex-grow space-x-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
          <i className={`fas ${icon} text-lg`}></i>
        </div>
        <div className="flex-grow">
            <div className="flex items-center gap-2">
                <p className={`font-semibold text-gray-800 ${isVoided ? 'line-through' : ''}`}>{transaction.description}</p>
                {transaction.isLoan && <span className="text-xs font-semibold text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded-full">Préstamo</span>}
                {isCreditCardRefund && <span className="text-xs font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">Abono/Devolución</span>}
            </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-sm text-gray-500">
              {new Date(transaction.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
             {category && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${category.color?.replace('bg-','bg-').replace('-500','-100')} ${category.color?.replace('bg-','text-').replace('-500','-800')}`}>
                    {category.name}
                </span>
            )}
            {transaction.location && <p className="text-sm text-gray-500">- {transaction.location}</p>}
            {isVoided && <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">ANULADA</span>}
          </div>
        </div>
      </div>
      <div className="text-right flex items-center gap-4">
        <p className={`font-bold text-lg ${amountColor} ${isVoided ? 'line-through' : ''}`}>
          {isIncome ? '+' : '-'}
          {transaction.amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
         <button onClick={() => onEdit(transaction)} className="text-gray-400 hover:text-blue-600 text-sm p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 disabled:cursor-not-allowed" disabled={isVoided}>
            <i className="fas fa-pencil-alt"></i>
        </button>
      </div>
    </li>
  );
};


const TransactionList: React.FC<{ transactions: Transaction[]; categories: Category[]; onEditTransaction: (transaction: Transaction) => void; }> = ({ transactions, categories, onEditTransaction }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.name] = cat;
      return acc;
    }, {} as Record<string, Category>);
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    const sortedTransactions = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (startDate || endDate) {
      return sortedTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        
        if (startDate && transactionDate < new Date(startDate)) {
          return false;
        }
        
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (transactionDate > endOfDay) {
            return false;
          }
        }
        
        return true;
      });
    }

    return sortedTransactions.slice(0, 20);
  }, [transactions, startDate, endDate]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Historial de Transacciones</h2>
         <div className="flex items-center gap-2">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2" />
            <span className="text-gray-400">-</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2" />
        </div>
      </div>
      
      <ul className="divide-y divide-gray-200">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map(t => <TransactionItem key={t.id} transaction={t} category={categoryMap[t.category]} onEdit={onEditTransaction}/>)
        ) : (
          <div className="text-center py-10">
             <i className="fas fa-search-dollar text-4xl text-gray-400 mb-3"></i>
            <p className="text-gray-600">No hay transacciones que mostrar.</p>
            <p className="text-sm text-gray-400">Intenta ajustar los filtros de fecha.</p>
          </div>
        )}
      </ul>
    </div>
  );
};

export default TransactionList;