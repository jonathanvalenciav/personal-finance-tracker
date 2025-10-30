import React, { useState, useEffect } from 'react';
import { Debt, DebtType } from '../types';
import Modal from './ui/Modal';

interface DebtItemProps {
  debt: Debt;
  onPay: (debtId: string, amount: number) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debtId: string) => void;
}

const DebtItem: React.FC<DebtItemProps> = ({ debt, onPay, onEdit, onDelete }) => {
  const remaining = debt.totalAmount - debt.paidAmount;
  const progress = debt.totalAmount > 0 ? (debt.paidAmount / debt.totalAmount) * 100 : 0;
  const isOwedToMe = debt.type === DebtType.THEY_OWE_ME;
  const isCreditCardDebt = !!debt.billingCycleIdentifier;
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
        setPaymentAmount(value);
    }
  };

  const handlePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (amount > 0 && amount <= remaining) {
      onPay(debt.id, amount);
      setIsPaying(false);
      setPaymentAmount('');
    } else {
      alert("Monto de pago inválido.");
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-3 group">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-gray-800">{debt.description}</p>
          <p className="text-sm text-gray-500">{isOwedToMe ? `De: ${debt.person}` : `A: ${debt.person}`}</p>
          <p className="text-xs text-gray-400">Vence: {new Date(debt.dueDate).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</p>
        </div>
        <div className="text-right flex items-center gap-2">
            <div>
                 <p className="font-bold text-lg text-gray-800">{remaining.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
                 <p className="text-sm text-gray-500">de {debt.totalAmount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
            </div>
             {!isCreditCardDebt && (
                <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(debt)} className="text-gray-400 hover:text-blue-600 text-sm p-1 rounded-md"><i className="fas fa-pencil-alt"></i></button>
                    <button onClick={() => onDelete(debt.id)} className="text-gray-400 hover:text-red-600 text-sm p-1 rounded-md"><i className="fas fa-trash"></i></button>
                </div>
            )}
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="mt-2 text-right">
         {remaining > 0 && <button onClick={() => setIsPaying(true)} className="text-blue-600 hover:underline text-sm font-medium">Registrar Pago</button>}
      </div>

       {isPaying && (
        <div className="mt-3 flex gap-2">
            <input 
                type="text"
                inputMode="decimal"
                value={paymentAmount}
                onChange={handlePaymentAmountChange}
                placeholder="Monto"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />
            <button onClick={handlePayment} className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-4 py-2">Pagar</button>
            <button onClick={() => setIsPaying(false)} className="text-gray-500 text-sm px-4 py-2">X</button>
        </div>
       )}
    </div>
  );
};


const DebtForm: React.FC<{onSave: (debt: Omit<Debt, 'id' | 'paidAmount' | 'billingCycleIdentifier'>, idToUpdate?: string) => void, onClose: () => void, editingDebt?: Debt | null}> = ({ onSave, onClose, editingDebt }) => {
    const [debt, setDebt] = useState({
        description: '',
        totalAmount: '',
        dueDate: new Date().toISOString().split('T')[0],
        type: DebtType.I_OWE,
        person: ''
    });
    
    useEffect(() => {
        if (editingDebt) {
            setDebt({
                description: editingDebt.description,
                totalAmount: String(editingDebt.totalAmount),
                dueDate: new Date(editingDebt.dueDate).toISOString().split('T')[0],
                type: editingDebt.type,
                person: editingDebt.person,
            });
        }
    }, [editingDebt]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDebt(prev => ({...prev, [name]: value}));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (/^\d*\.?\d*$/.test(value)) {
          setDebt(prev => ({...prev, totalAmount: value}));
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...debt,
            totalAmount: parseFloat(debt.totalAmount)
        }, editingDebt?.id);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <select name="type" value={debt.type} onChange={handleChange} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                <option value={DebtType.I_OWE}>Yo Debo</option>
                <option value={DebtType.THEY_OWE_ME}>Me Deben</option>
            </select>
            <input type="text" name="person" value={debt.person} onChange={handleChange} placeholder={debt.type === DebtType.I_OWE ? "A quién le debo" : "Quién me debe"} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
            <input type="text" name="description" value={debt.description} onChange={handleChange} placeholder="Descripción" className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
            <input type="text" inputMode="decimal" name="totalAmount" value={debt.totalAmount} onChange={handleAmountChange} placeholder="Monto Total" className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
            <input type="date" name="dueDate" value={debt.dueDate} onChange={handleChange} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
            <div className="flex justify-end pt-2 gap-2">
                <button type="button" onClick={onClose} className="text-gray-800 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5">Cancelar</button>
                <button type="submit" className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5">{editingDebt ? 'Actualizar' : 'Guardar'} Deuda</button>
            </div>
        </form>
    );
};


interface DebtManagerProps {
  debts: Debt[];
  onSaveDebt: (debt: Omit<Debt, 'id' | 'paidAmount' | 'billingCycleIdentifier'>, idToUpdate?: string) => void;
  onPayDebt: (debtId: string, amount: number) => void;
  onDeleteDebt: (debtId: string) => void;
}

const DebtManager: React.FC<DebtManagerProps> = ({ debts, onSaveDebt, onPayDebt, onDeleteDebt }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

    const myDebts = debts.filter(d => d.type === DebtType.I_OWE);
    const debtsToMe = debts.filter(d => d.type === DebtType.THEY_OWE_ME);

    const handleOpenModal = (debt: Debt | null = null) => {
        setEditingDebt(debt);
        setIsModalOpen(true);
    }
    
    const handleCloseModal = () => {
        setEditingDebt(null);
        setIsModalOpen(false);
    }

    const handleSave = (debtData: Omit<Debt, 'id' | 'paidAmount' | 'billingCycleIdentifier'>, idToUpdate?: string) => {
        onSaveDebt(debtData, idToUpdate);
        handleCloseModal();
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta deuda?')) {
            onDeleteDebt(id);
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Gestión de Deudas</h2>
                <button onClick={() => handleOpenModal()} className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-4 py-2 text-center"><i className="fas fa-plus mr-2"></i>Nueva Deuda</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold mb-2 text-red-600">Lo que debo</h3>
                    {myDebts.length > 0 ? myDebts.map(d => <DebtItem key={d.id} debt={d} onPay={onPayDebt} onEdit={handleOpenModal} onDelete={handleDelete}/>) : <p className="text-gray-500 text-sm">No tienes deudas pendientes.</p>}
                </div>
                <div>
                    <h3 className="font-semibold mb-2 text-green-600">Lo que me deben</h3>
                    {debtsToMe.length > 0 ? debtsToMe.map(d => <DebtItem key={d.id} debt={d} onPay={onPayDebt} onEdit={handleOpenModal} onDelete={handleDelete}/>) : <p className="text-gray-500 text-sm">Nadie te debe dinero.</p>}
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingDebt ? "Editar Deuda" : "Nueva Deuda"}>
                <DebtForm onSave={handleSave} onClose={handleCloseModal} editingDebt={editingDebt} />
            </Modal>
        </div>
    );
};

export default DebtManager;