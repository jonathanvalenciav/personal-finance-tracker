import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Category } from '../types';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onEdit: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, category, onEdit }) => {
  const isIncome = transaction.type === TransactionType.INCOME;
  const amountColor = isIncome ? 'text-green-600' : 'text-gray-900';
  
  const icon = isIncome ? 'fa-arrow-up' : category?.icon || 'fa-question-circle';
  const iconColor = isIncome ? 'bg-green-100 text-green-600' : category?.color ? `${category.color.replace('bg-','bg-').replace('-500','-100')} ${category.color.replace('bg-','text-').replace('-500','-600')}` : 'bg-gray-100 text-gray-600';
  
  return (
    <li className="group flex items-center p-3 bg-white border-b border-gray-200">
      <div className="flex items-center flex-grow space-x-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
          <i className={`fas ${icon} text-lg`}></i>
        </div>
        <div className="flex-grow">
          <p className="font-semibold text-gray-800">{transaction.description}</p>
          <p className="text-sm text-gray-500">
            {new Date(transaction.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
            {transaction.location && ` - ${transaction.location}`}
          </p>
        </div>
      </div>
      <div className="text-right flex items-center gap-4">
        <p className={`font-bold text-lg ${amountColor}`}>
          {isIncome ? '+' : '-'}
          {transaction.amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
         <button onClick={() => onEdit(transaction)} className="text-gray-400 hover:text-blue-600 text-sm p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
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