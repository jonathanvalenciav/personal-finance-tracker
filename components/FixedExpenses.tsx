import React, { useState, useEffect } from 'react';
import { FixedExpense, Category } from '../types';
import Modal from './ui/Modal';

interface FixedExpenseItemProps {
    expense: FixedExpense;
    onPay: (expense: FixedExpense) => void;
    onEdit: (expense: FixedExpense) => void;
    onDelete: (id: string) => void;
}

const FixedExpenseItem: React.FC<FixedExpenseItemProps> = ({ expense, onPay, onEdit, onDelete }) => {
  const today = new Date().getDate();
  const currentMonthStr = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const isPaidThisMonth = expense.lastPaidMonth === currentMonthStr;

  let notificationClass = 'bg-white border border-gray-200';
  let notificationText = `Próximo pago: Día ${expense.paymentDay}`;

  if (isPaidThisMonth) {
    notificationClass = 'bg-green-50 text-green-800 border border-green-200';
    notificationText = `Pagado este mes (Día ${expense.paymentDay})`;
  } else {
    const daysUntilPayment = expense.paymentDay - today;
    if (daysUntilPayment <= 0) {
      notificationClass = 'bg-red-50 text-red-800 border border-red-200';
      notificationText = `Vencido o vence hoy (Día ${expense.paymentDay})`;
    } else if (daysUntilPayment <= 5) {
      notificationClass = 'bg-yellow-50 text-yellow-800 border border-yellow-200';
      notificationText = `Vence en ${daysUntilPayment} días (Día ${expense.paymentDay})`;
    }
  }

  return (
    <div className={`p-4 rounded-lg shadow mb-3 flex justify-between items-center group ${notificationClass}`}>
      <div>
        <p className="font-semibold text-gray-800">{expense.description}</p>
        <p className="text-sm text-gray-500">{expense.category}</p>
         <p className="text-xs font-medium mt-1">{notificationText}</p>
      </div>
      <div className="text-right flex items-center gap-3">
        <p className="font-bold text-lg text-gray-800">{expense.amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
        <div className="flex items-center gap-1">
            {!isPaidThisMonth && (
                 <button onClick={() => onPay(expense)} className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-4 py-2">Pagar</button>
            )}
             {isPaidThisMonth && (
                 <span className="text-white bg-green-500 font-medium rounded-lg text-sm px-4 py-2"><i className="fas fa-check-circle mr-1"></i>Pagado</span>
            )}
            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => onEdit(expense)} className="text-gray-400 hover:text-blue-600 text-sm p-1 rounded-md"><i className="fas fa-pencil-alt"></i></button>
                 <button onClick={() => onDelete(expense.id)} className="text-gray-400 hover:text-red-600 text-sm p-1 rounded-md"><i className="fas fa-trash"></i></button>
            </div>
        </div>
      </div>
    </div>
  );
};


const FixedExpenseForm: React.FC<{onSave: (expense: Omit<FixedExpense, 'id' | 'lastPaidMonth'>, idToUpdate?: string) => void, onClose: () => void, categories: Category[], editingExpense?: FixedExpense | null}> = ({ onSave, onClose, categories, editingExpense }) => {
    const [expense, setExpense] = useState({
        description: '',
        amount: '',
        category: categories.length > 0 ? categories[0].name : '',
        paymentDay: '1',
    });
    
    useEffect(() => {
        if (editingExpense) {
            setExpense({
                description: editingExpense.description,
                amount: String(editingExpense.amount),
                category: editingExpense.category,
                paymentDay: String(editingExpense.paymentDay),
            });
        }
    }, [editingExpense]);

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
        }, editingExpense?.id);
        onClose();
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
                <button type="submit" className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5">{editingExpense ? 'Actualizar' : 'Guardar'}</button>
            </div>
        </form>
    );
};

interface FixedExpensesProps {
  expenses: FixedExpense[];
  categories: Category[];
  onSaveExpense: (expense: Omit<FixedExpense, 'id' | 'lastPaidMonth'>, idToUpdate?: string) => void;
  onPayExpense: (id: string, amount: number) => void;
  onDeleteExpense: (id: string) => void;
}

const FixedExpenses: React.FC<FixedExpensesProps> = ({ expenses, categories, onSaveExpense, onPayExpense, onDeleteExpense }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
    const [payingExpense, setPayingExpense] = useState<FixedExpense | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');

    useEffect(() => {
        if (payingExpense) {
            setPaymentAmount(String(payingExpense.amount));
        }
    }, [payingExpense]);

    const handleOpenModal = (expense: FixedExpense | null = null) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingExpense(null);
        setIsModalOpen(false);
    };
    
    const handleStartPayment = (expense: FixedExpense) => {
        setPayingExpense(expense);
    };

    const handleCancelPayment = () => {
        setPayingExpense(null);
        setPaymentAmount('');
    };
    
    const handleConfirmPayment = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);
        if (payingExpense && amount > 0) {
            onPayExpense(payingExpense.id, amount);
            handleCancelPayment();
        } else {
            alert("Por favor, ingrese un monto válido.");
        }
    };

    const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value)) {
            setPaymentAmount(value);
        }
    };

    const handleSave = (expense: Omit<FixedExpense, 'id' | 'lastPaidMonth'>, idToUpdate?: string) => {
        onSaveExpense(expense, idToUpdate);
        handleCloseModal();
    }
    
    const handleDelete = (id: string) => {
        if(window.confirm('¿Estás seguro de que quieres eliminar este gasto fijo?')) {
            onDeleteExpense(id);
        }
    }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Gastos Fijos Mensuales</h2>
        <button onClick={() => handleOpenModal()} className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-4 py-2 text-center"><i className="fas fa-plus mr-2"></i>Nuevo Gasto Fijo</button>
      </div>
      <div>
        {expenses.length > 0 ? (
          expenses.sort((a,b) => a.paymentDay - b.paymentDay).map(exp => <FixedExpenseItem key={exp.id} expense={exp} onPay={handleStartPayment} onEdit={handleOpenModal} onDelete={handleDelete}/>)
        ) : (
          <p className="text-center text-gray-500 py-8">No hay gastos fijos registrados.</p>
        )}
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingExpense ? "Editar Gasto Fijo" : "Nuevo Gasto Fijo"}>
          <FixedExpenseForm onSave={handleSave} onClose={handleCloseModal} categories={categories} editingExpense={editingExpense} />
      </Modal>

      <Modal isOpen={!!payingExpense} onClose={handleCancelPayment} title="Confirmar Pago de Gasto Fijo">
            <form onSubmit={handleConfirmPayment} className="space-y-4">
                <p>Estás pagando: <span className="font-semibold">{payingExpense?.description}</span></p>
                <div>
                    <label htmlFor="paymentAmount" className="block mb-2 text-sm font-medium text-gray-700">Monto a Pagar</label>
                    <input 
                        id="paymentAmount"
                        type="text" 
                        inputMode="decimal" 
                        value={paymentAmount}
                        onChange={handlePaymentAmountChange} 
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                        required 
                    />
                    <p className="text-xs text-gray-500 mt-1">El valor predeterminado es {payingExpense?.amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}. Ajústalo si este mes fue diferente.</p>
                </div>
                <div className="flex justify-end pt-2 gap-2">
                    <button type="button" onClick={handleCancelPayment} className="text-gray-800 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5">Cancelar</button>
                    <button type="submit" className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5">Confirmar Pago</button>
                </div>
            </form>
        </Modal>
    </div>
  );
};

export default FixedExpenses;