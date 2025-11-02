import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, PaymentMethod, Category, CreditCard, Debt, DebtType } from '../types';

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, 'id'>, idToUpdate?: string, linkedDebtId?: string, loanDetails?: { isLoan: boolean; person: string; dueDate: string; }) => void;
  onClose: () => void;
  onVoid?: (transactionId: string) => void;
  categories: Category[];
  locations: string[];
  creditCards: CreditCard[]; // Should only receive active cards
  editingTransaction?: Transaction | null;
  debts: Debt[];
  debtsOwedToMe: Debt[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSave, onClose, onVoid, categories, locations, creditCards, editingTransaction, debts, debtsOwedToMe }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK);
  const [creditCardId, setCreditCardId] = useState<string | undefined>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [linkedDebtId, setLinkedDebtId] = useState<string>('');
  
  const [isLoan, setIsLoan] = useState(false);
  const [loanPerson, setLoanPerson] = useState('');
  const [loanDueDate, setLoanDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [advanceFee, setAdvanceFee] = useState('');

  const creditCardDebts = debts.filter(d => d.type === DebtType.I_OWE && d.billingCycleIdentifier && (d.totalAmount - d.paidAmount > 0.01));

  const isCashAdvance = type === TransactionType.INCOME && isLoan && paymentMethod === PaymentMethod.CREDIT_CARD;

  useEffect(() => {
    if (editingTransaction) {
      const linkedDebt = debts.find(d => d.originatingTransactionId === editingTransaction.id);
      
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setDescription(editingTransaction.description);
      setCategory(editingTransaction.category);
      setLocation(editingTransaction.location);
      setAdvanceFee(String(editingTransaction.advanceFee || ''));
      
      const cardIsActive = creditCards.some(c => c.id === editingTransaction.creditCardId);
      
      if (editingTransaction.paymentMethod === PaymentMethod.CREDIT_CARD && !cardIsActive) {
        setPaymentMethod(PaymentMethod.BANK);
        setCreditCardId('');
      } else {
        setPaymentMethod(editingTransaction.paymentMethod);
        setCreditCardId(editingTransaction.creditCardId);
      }
      
      setDate(new Date(editingTransaction.date).toISOString().split('T')[0]);
      setLinkedDebtId(editingTransaction.paidDebtId || '');

      const isLoanTransaction = !!editingTransaction.isLoan || !!linkedDebt;
      setIsLoan(isLoanTransaction);

      if (isLoanTransaction && linkedDebt) {
        setLoanPerson(linkedDebt.person);
        setLoanDueDate(new Date(linkedDebt.dueDate).toISOString().split('T')[0]);
      } else {
        setLoanPerson('');
        setLoanDueDate(new Date().toISOString().split('T')[0]);
      }

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
        setIsLoan(false);
        setLoanPerson('');
        setLoanDueDate(new Date().toISOString().split('T')[0]);
        setLinkedDebtId('');
        setAdvanceFee('');
    }
  }, [editingTransaction, categories, creditCards, debts]);

  useEffect(() => {
      // Don't auto-clear fields when editing
      if (editingTransaction) return;

      // When type or category changes, check if the currently selected debt is still valid
      const debt = debts.find(d => d.id === linkedDebtId);
      if (!debt) return; // No debt is linked, so nothing to clear.

      let isValid = false;
      // Case 1: Receiving money for a debt someone owes me.
      if (type === TransactionType.INCOME && debt.type === DebtType.THEY_OWE_ME) {
          isValid = true;
      }
      // Case 2: Paying a credit card debt.
      else if (type === TransactionType.EXPENSE && category === 'Pago Tarjeta de Crédito' && debt.billingCycleIdentifier) {
          isValid = true;
      }
      // Case 3: Receiving a refund/credit for a credit card.
      else if (type === TransactionType.INCOME && category === 'Pago Tarjeta de Crédito' && debt.billingCycleIdentifier) {
          isValid = true;
      }

      if (!isValid) {
          setLinkedDebtId('');
      }

  }, [type, category, editingTransaction, debts, linkedDebtId]);
  
  useEffect(() => {
    if (isLoan) {
        setCategory('Deudas');
        setLinkedDebtId('');
    }
  }, [isLoan]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
        setAmount(value);
    }
  };
  
   const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
        setAdvanceFee(value);
    }
  };

  const handleDebtLinkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const debtId = e.target.value;
    setLinkedDebtId(debtId);

    if (debtId) {
        const selectedDebt = debts.find(d => d.id === debtId); // Find from all debts
        if (!selectedDebt) return;

        if (selectedDebt.type === DebtType.THEY_OWE_ME) { // Payment for a loan I gave
            setDescription(`Abono de ${selectedDebt.person}: ${selectedDebt.description}`);
            setCategory('Deudas');
        } else if (selectedDebt.billingCycleIdentifier) { // Payment related to a credit card
            if (type === TransactionType.EXPENSE) { // A regular payment
                const remaining = selectedDebt.totalAmount - selectedDebt.paidAmount;
                setAmount(String(remaining));
                setDescription(`Pago ${selectedDebt.description}`);
            }
        }
    } else {
      if (!editingTransaction) {
        setAmount('');
        setDescription('');
        setCategory(categories.length > 0 ? categories[0].name : '');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !category || (paymentMethod === PaymentMethod.CREDIT_CARD && !creditCardId)) {
        alert('Por favor, complete todos los campos requeridos.');
        return;
    }
    if (isLoan && !loanPerson && !isCashAdvance) {
        alert('Por favor, indique la persona involucrada en el préstamo.');
        return;
    }

    const transactionData: Omit<Transaction, 'id'> = {
      amount: parseFloat(amount),
      description: description,
      date: new Date(date).toISOString(),
      type,
      category: isLoan ? 'Deudas' : category,
      location,
      paymentMethod,
      creditCardId: paymentMethod === PaymentMethod.CREDIT_CARD ? creditCardId : undefined,
      isLoan,
      advanceFee: isCashAdvance ? parseFloat(advanceFee) || 0 : undefined,
    };

    const loanDetails = { isLoan, person: isCashAdvance ? creditCards.find(c=>c.id === creditCardId)?.name || 'Avance T.C.' : loanPerson, dueDate: loanDueDate };

    onSave(transactionData, editingTransaction?.id, linkedDebtId, loanDetails);
    onClose();
  };
  
  const isDebtLinkFieldsDisabled = (type === TransactionType.INCOME && debtsOwedToMe.some(d => d.id === linkedDebtId) && !editingTransaction);
  const isCreditCardExpensePayment = type === TransactionType.EXPENSE && category === 'Pago Tarjeta de Crédito';
  const isCreditCardIncomePayment = type === TransactionType.INCOME && category === 'Pago Tarjeta de Crédito';

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
      
      <div className="flex items-center justify-between">
        <label htmlFor="is-loan-toggle" className="text-sm font-medium text-gray-900">Es un préstamo</label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="is-loan-toggle"
            className="sr-only peer"
            checked={isLoan}
            onChange={(e) => setIsLoan(e.target.checked)}
            disabled={editingTransaction && !!editingTransaction.paidDebtId}
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
        </label>
      </div>

      {isLoan && !isCashAdvance && (
        <div className="p-3 bg-gray-50 border rounded-lg space-y-4">
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">{type === TransactionType.EXPENSE ? 'Persona a la que presto (Deudor)' : 'Persona que me presta (Acreedor)'}</label>
                <input type="text" value={loanPerson} onChange={(e) => setLoanPerson(e.target.value)} placeholder="Nombre completo" className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
            </div>
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Fecha de Vencimiento del Préstamo</label>
                <input type="date" value={loanDueDate} onChange={(e) => setLoanDueDate(e.target.value)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
            </div>
        </div>
       )}

      {isCashAdvance && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
             <p className="text-sm text-blue-800 font-medium">Estás registrando un avance de Tarjeta de Crédito.</p>
             <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Costo de la Transacción</label>
                <input type="text" inputMode="decimal" value={advanceFee} onChange={handleFeeChange} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="0.00" />
                 <p className="text-xs text-gray-500 mt-1">Ingresa la comisión o costo del avance. La deuda total en la tarjeta será el monto recibido más este costo.</p>
            </div>
        </div>
      )}

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Descripción</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:bg-gray-100 disabled:text-gray-500" required disabled={isDebtLinkFieldsDisabled} />
      </div>
      
       <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Categoría</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:bg-gray-100 disabled:text-gray-500" required disabled={isDebtLinkFieldsDisabled || isLoan}>
            <option value="" disabled>Seleccione una categoría</option>
            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
        </select>
      </div>

      {type === TransactionType.INCOME && !isCreditCardIncomePayment && !editingTransaction && debtsOwedToMe.length > 0 && !isLoan && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Asociar a una deuda que me deben (Opcional)</label>
          <select value={linkedDebtId} onChange={handleDebtLinkChange} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
            <option value="">Ninguna</option>
            {debtsOwedToMe.map(debt => {
                const remaining = debt.totalAmount - debt.paidAmount;
                return (
                  <option key={debt.id} value={debt.id}>
                    {`${debt.description} (${debt.person}) - Restan: ${remaining.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                  </option>
                )
            })}
          </select>
        </div>
      )}

      {isCreditCardExpensePayment && !editingTransaction && creditCardDebts.length > 0 && !isLoan && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Pagar Deuda de Tarjeta (Opcional)</label>
          <select value={linkedDebtId} onChange={handleDebtLinkChange} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
            <option value="">Seleccionar deuda a pagar</option>
            {creditCardDebts.map(debt => {
                const remaining = debt.totalAmount - debt.paidAmount;
                return (
                  <option key={debt.id} value={debt.id}>
                    {`${debt.description} - Restan: ${remaining.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                  </option>
                )
            })}
          </select>
        </div>
      )}
      
      {isCreditCardIncomePayment && !editingTransaction && creditCardDebts.length > 0 && !isLoan && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Abonar a Deuda de Tarjeta (Devolución)</label>
          <select value={linkedDebtId} onChange={handleDebtLinkChange} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
            <option value="">Seleccionar deuda a abonar</option>
            {creditCardDebts.map(debt => {
                const remaining = debt.totalAmount - debt.paidAmount;
                return (
                  <option key={debt.id} value={debt.id}>
                    {`${debt.description} - Restan: ${remaining.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                  </option>
                )
            })}
          </select>
        </div>
      )}


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

      <div className="flex justify-between items-center pt-4">
        <div>
          {editingTransaction && onVoid && (
            <button
              type="button"
              onClick={() => onVoid(editingTransaction.id)}
              className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
            >
              Anular Transacción
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="text-gray-800 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5">Cancelar</button>
          <button type="submit" className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none">
              {editingTransaction ? 'Actualizar' : 'Guardar'} Transacción
          </button>
        </div>
      </div>
    </form>
  );
};

export default TransactionForm;