import React, { useState } from 'react';
import { FixedExpense, Category } from '../types';
import Modal from './ui/Modal';

const FixedExpenseItem: React.FC<{ expense: FixedExpense }> = ({ expense }) => {
  const today = new Date().getDate();
  const daysUntilPayment = expense.paymentDay - today;
  let notificationClass = 'bg-white border border-gray-200';
  let notificationText = `Próximo pago: Día ${expense.paymentDay}`;
  let textColor = 'text-gray-500';

  if (daysUntilPayment <= 0) {
    notificationClass = 'bg-red-50 text-red-800 border border-red-200';
    notificationText = `Vencido o vence hoy (Día ${expense.paymentDay})`;
    textColor = 'text-red-600';
  } else if (daysUntilPayment <= 5) {
    notificationClass = 'bg-yellow-50 text-yellow-800 border border-yellow-200';
    notificationText = `Vence en ${daysUntilPayment} días (Día ${expense.paymentDay})`;
    textColor = 'text-yellow-600';
  }

  return (
    <div className={`p-4 rounded-lg shadow mb-3 flex justify-between items-center ${notificationClass}`}>
      <div>
        <p className="font-semibold text-gray-800">{expense.description}</p>
        <p className="text-sm text-gray-500">{expense.category}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg text-gray-800">{expense.amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
        <p className={`text-xs font-medium ${textColor}`}>{notificationText}</p>
      </div>
    </div>
  );
};


const FixedExpenseForm: React.FC<{onSave: (expense: Omit<FixedExpense, 'id'>) => void, onClose: () => void, categories: Category[]}> = ({ onSave, onClose, categories }) => {
    const [expense, setExpense] = useState({
        description: '',
        amount: '',
        category: categories.length > 0 ? categories[0].name : '',
        paymentDay: '1',
    });

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (/^\d*\.?\d*$/.test(value)) {
          setExpense(prev => ({...prev, amount: value}));
      }
    };
    
    const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d{0,2}$/.test(value)) {
            const day = parseInt(value, 10);
            if (day >= 1 && day <= 31) {
                setExpense(prev => ({...prev, paymentDay: value}));
            } else if (value === '') {
                 setExpense(prev => ({...prev, paymentDay: value}));
            }
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setExpense(prev => ({...prev, [name]: value}));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...expense,
            amount: parseFloat(expense.amount),
            paymentDay: parseInt(expense.paymentDay, 10),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="description" value={expense.description} onChange={handleChange} placeholder="Descripción" className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
            <input type="text" inputMode="decimal" name="amount" value={expense.amount} onChange={handleAmountChange} placeholder="Monto Mensual" className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
            <select name="category" value={expense.category} onChange={handleChange} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>
            <input type="text" inputMode="numeric" name="paymentDay" value={expense.paymentDay} onChange={handleDayChange} placeholder="Día de Pago (1-31)" className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
            <div className="flex justify-end pt-2 gap-2">
                <button type="button" onClick={onClose} className="text-gray-800 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5">Cancelar</button>
                <button type="submit" className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5">Guardar</button>
            </div>
        </form>
    );
};

interface FixedExpensesProps {
  expenses: FixedExpense[];
  categories: Category[];
  onAddExpense: (expense: Omit<FixedExpense, 'id'>) => void;
}

const FixedExpenses: React.FC<FixedExpensesProps> = ({ expenses, categories, onAddExpense }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSave = (expense: Omit<FixedExpense, 'id'>) => {
        onAddExpense(expense);
        setIsModalOpen(false);
    }
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Gastos Fijos Mensuales</h2>
        <button onClick={() => setIsModalOpen(true)} className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-4 py-2 text-center"><i className="fas fa-plus mr-2"></i>Nuevo Gasto Fijo</button>
      </div>
      <div>
        {expenses.length > 0 ? (
          expenses.sort((a,b) => a.paymentDay - b.paymentDay).map(exp => <FixedExpenseItem key={exp.id} expense={exp} />)
        ) : (
          <p className="text-center text-gray-500 py-8">No hay gastos fijos registrados.</p>
        )}
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Gasto Fijo">
          <FixedExpenseForm onSave={handleSave} onClose={() => setIsModalOpen(false)} categories={categories} />
      </Modal>
    </div>
  );
};

export default FixedExpenses;