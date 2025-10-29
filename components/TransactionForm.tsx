import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, PaymentMethod, Category, CreditCard, CreditCardStatus } from '../types';

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, 'id'>, idToUpdate?: string) => void;
  onClose: () => void;
  categories: Category[];
  locations: string[];
  creditCards: CreditCard[]; // Should only receive active cards
  editingTransaction?: Transaction | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSave, onClose, categories, locations, creditCards, editingTransaction }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK);
  const [creditCardId, setCreditCardId] = useState<string | undefined>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setDescription(editingTransaction.description);
      setCategory(editingTransaction.category);
      setLocation(editingTransaction.location);
      
      const cardIsActive = creditCards.some(c => c.id === editingTransaction.creditCardId);
      
      if (editingTransaction.paymentMethod === PaymentMethod.CREDIT_CARD && !cardIsActive) {
        setPaymentMethod(PaymentMethod.BANK);
        setCreditCardId('');
      } else {
        setPaymentMethod(editingTransaction.paymentMethod);
        setCreditCardId(editingTransaction.creditCardId);
      }
      
      setDate(new Date(editingTransaction.date).toISOString().split('T')[0]);
    } else {
        // Reset form for new transaction
        setType(TransactionType.EXPENSE);
        setAmount('');
        setDescription('');
        setCategory(categories.length > 0 ? categories[0].name : '');
        setLocation('');
        setPaymentMethod(PaymentMethod.BANK);
        setCreditCardId(creditCards.length > 0 ? creditCards[0].id : '');
        setDate(new Date().toISOString().split('T')[0]);
    }
  }, [editingTransaction, categories, creditCards]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
        setAmount(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !category || (paymentMethod === PaymentMethod.CREDIT_CARD && !creditCardId)) {
        alert('Por favor, complete todos los campos requeridos.');
        return;
    }

    onSave({
      amount: parseFloat(amount),
      description,
      date: new Date(date).toISOString(),
      type,
      category,
      location,
      paymentMethod,
      creditCardId: paymentMethod === PaymentMethod.CREDIT_CARD ? creditCardId : undefined,
    }, editingTransaction?.id);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-center bg-gray-100 p-1 rounded-full border border-gray-300">
        <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`px-8 py-2 text-sm font-semibold rounded-full w-full ${type === TransactionType.EXPENSE ? 'bg-red-500 text-white shadow' : 'text-gray-600'}`}>Gasto</button>
        <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`px-8 py-2 text-sm font-semibold rounded-full w-full ${type === TransactionType.INCOME ? 'bg-green-500 text-white shadow' : 'text-gray-600'}`}>Ingreso</button>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Monto</label>
        <input type="text" inputMode="decimal" value={amount} onChange={handleAmountChange} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="0.00" required />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Descripción</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
      </div>
      
       <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Categoría</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            <option value="" disabled>Seleccione una categoría</option>
            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Lugar</label>
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} list="locations" className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
        <datalist id="locations">
            {locations.map(loc => <option key={loc} value={loc} />)}
        </datalist>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Método de Pago</label>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
          <option value={PaymentMethod.BANK}>Cuenta Bancaria</option>
          <option value={PaymentMethod.CASH}>Efectivo</option>
          {creditCards && creditCards.length > 0 && (
            <option value={PaymentMethod.CREDIT_CARD}>Tarjeta de Crédito</option>
          )}
        </select>
      </div>

      {paymentMethod === PaymentMethod.CREDIT_CARD && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Tarjeta</label>
          <select value={creditCardId} onChange={(e) => setCreditCardId(e.target.value)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
            <option value="">Seleccione una tarjeta</option>
            {creditCards.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Fecha</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
      </div>

      <div className="flex justify-end pt-4 gap-2">
        <button type="button" onClick={onClose} className="text-gray-800 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5">Cancelar</button>
        <button type="submit" className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none">
            {editingTransaction ? 'Actualizar' : 'Guardar'} Transacción
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;