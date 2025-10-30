import React, { useState, useMemo } from 'react';
import { Transaction, Category, Debt, FixedExpense, ActiveTab, TransactionType, PaymentMethod, DebtType, CreditCard, CreditCardStatus } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import BalanceSummary from './components/BalanceSummary';
import TransactionList from './components/TransactionList';
import DebtManager from './components/DebtManager';
import FixedExpenses from './components/FixedExpenses';
import Modal from './components/ui/Modal';
import TransactionForm from './components/TransactionForm';
import CategoryManager from './components/CategoryManager';
import Settings from './components/Settings';

const App: React.FC = () => {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', [
    { id: '1', name: 'Comida', icon: 'fa-utensils', color: 'bg-orange-500' },
    { id: '2', name: 'Transporte', icon: 'fa-bus', color: 'bg-blue-500' },
    { id: '3', name: 'Vivienda', icon: 'fa-home', color: 'bg-cyan-500' },
    { id: '4', name: 'Ocio', icon: 'fa-film', color: 'bg-purple-500' },
    { id: '5', name: 'Salud', icon: 'fa-heartbeat', color: 'bg-red-500' },
    { id: '6', name: 'Sueldo', icon: 'fa-dollar-sign', color: 'bg-green-500' },
    { id: '7', name: 'Pago Tarjeta de Crédito', icon: 'fa-credit-card', color: 'bg-pink-500' },
    { id: '8', name: 'Deudas', icon: 'fa-hand-holding-usd', color: 'bg-yellow-500' },
    { id: '9', name: 'Otro', icon: 'fa-question-circle', color: 'bg-gray-500' },
  ]);
  const [debts, setDebts] = useLocalStorage<Debt[]>('debts', []);
  const [fixedExpenses, setFixedExpenses] = useLocalStorage<FixedExpense[]>('fixedExpenses', []);
  const [creditCards, setCreditCards] = useLocalStorage<CreditCard[]>('creditCards', []);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);


  const locations = useMemo(() => {
    const uniqueLocations = new Set(transactions.map(t => t.location).filter(Boolean));
    return Array.from(uniqueLocations);
  }, [transactions]);

  const handleUpdateCreditCardDebt = (transaction: Transaction, operation: 'add' | 'subtract') => {
    if (transaction.type !== TransactionType.EXPENSE || transaction.paymentMethod !== PaymentMethod.CREDIT_CARD || !transaction.creditCardId) {
      return;
    }

    const creditCard = creditCards.find(c => c.id === transaction.creditCardId);
    if (!creditCard) return;

    const transactionDate = new Date(transaction.date);
    const transactionDay = transactionDate.getUTCDate();

    let closingDate = new Date(Date.UTC(transactionDate.getUTCFullYear(), transactionDate.getUTCMonth(), creditCard.cutOffDay));

    if (transactionDay > creditCard.cutOffDay) {
      closingDate.setUTCMonth(closingDate.getUTCMonth() + 1);
    }

    let paymentDueDate = new Date(closingDate);
    paymentDueDate.setUTCMonth(paymentDueDate.getUTCMonth() + 1);
    paymentDueDate.setUTCDate(creditCard.paymentDay);
    
    const billingCycleId = `cc-debt-${creditCard.id}-${closingDate.getUTCFullYear()}-${closingDate.getUTCMonth()}`;

    setDebts(prevDebts => {
      const existingDebtIndex = prevDebts.findIndex(d => d.billingCycleIdentifier === billingCycleId);
      const amount = operation === 'add' ? transaction.amount : -transaction.amount;

      if (existingDebtIndex !== -1) {
        const updatedDebts = [...prevDebts];
        const existingDebt = updatedDebts[existingDebtIndex];
        existingDebt.totalAmount += amount;
        
        existingDebt.person = creditCard.id;

        if(existingDebt.totalAmount <= 0.01) { 
            return updatedDebts.filter(d => d.billingCycleIdentifier !== billingCycleId);
        }
        return updatedDebts;
      } else if (operation === 'add') {
        const newDebt: Debt = {
          id: crypto.randomUUID(),
          description: `${creditCard.name} - Cierre ${closingDate.toLocaleDateString('es-ES', { timeZone: 'UTC' })}`,
          totalAmount: transaction.amount,
          paidAmount: 0,
          dueDate: paymentDueDate.toISOString(),
          type: DebtType.I_OWE,
          person: creditCard.id,
          billingCycleIdentifier: billingCycleId,
        };
        return [...prevDebts, newDebt];
      }
      return prevDebts;
    });
  };

  const saveTransaction = (transactionData: Omit<Transaction, 'id'>, idToUpdate?: string) => {
    if (idToUpdate) {
      const originalTransaction = transactions.find(t => t.id === idToUpdate);
      if (originalTransaction) {
        handleUpdateCreditCardDebt(originalTransaction, 'subtract');
      }
      const updatedTransaction = { ...transactionData, id: idToUpdate };
      handleUpdateCreditCardDebt(updatedTransaction, 'add');
      setTransactions(prev => prev.map(t => t.id === idToUpdate ? updatedTransaction : t));
    } else {
      const newTransaction = { ...transactionData, id: crypto.randomUUID() };
      handleUpdateCreditCardDebt(newTransaction, 'add');
      setTransactions(prev => [...prev, newTransaction]);
    }
  };

  const handleStartEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionModalOpen(true);
  };
  
  const handleCloseTransactionModal = () => {
    setEditingTransaction(null);
    setTransactionModalOpen(false);
  };

  const addCategory = (name: string) => {
    if (!categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
        setCategories(prev => [...prev, { id: crypto.randomUUID(), name, icon: 'fa-question-circle', color: 'bg-gray-500' }]);
    } else {
        alert("La categoría ya existe.");
    }
  };

  const saveDebt = (debtData: Omit<Debt, 'id' | 'paidAmount' | 'billingCycleIdentifier'>, idToUpdate?: string) => {
    if (idToUpdate) {
        setDebts(prev => prev.map(d => 
            d.id === idToUpdate ? { ...d, ...debtData, id: idToUpdate } : d
        ));
    } else {
        const newDebt: Debt = {
            ...debtData,
            id: crypto.randomUUID(),
            paidAmount: 0,
        };
        setDebts(prev => [...prev, newDebt]);
    }
  };
  
  const deleteDebt = (debtId: string) => {
      setDebts(prev => prev.filter(d => d.id !== debtId));
  }

  const payDebt = (debtId: string, amount: number) => {
    let debtToPay: Debt | undefined;
    setDebts(prev => prev.map(d => {
        if (d.id === debtId) {
            debtToPay = d;
            return { ...d, paidAmount: d.paidAmount + amount };
        }
        return d;
    }));

    if(debtToPay) {
        const isCreditCardPayment = creditCards.some(c => c.id === debtToPay?.person);
        saveTransaction({
            amount,
            description: `Pago de deuda: ${debtToPay.description}`,
            date: new Date().toISOString(),
            type: TransactionType.EXPENSE,
            category: isCreditCardPayment ? 'Pago Tarjeta de Crédito' : 'Deudas',
            location: '',
            paymentMethod: PaymentMethod.BANK
        })
    }
  };
  
  const saveFixedExpense = (expenseData: Omit<FixedExpense, 'id' | 'lastPaidMonth'>, idToUpdate?: string) => {
    if (idToUpdate) {
        setFixedExpenses(prev => prev.map(e => e.id === idToUpdate ? { ...e, ...expenseData, id: idToUpdate } : e));
    } else {
        setFixedExpenses(prev => [...prev, { ...expenseData, id: crypto.randomUUID() }]);
    }
  };

  const deleteFixedExpense = (id: string) => {
      setFixedExpenses(prev => prev.filter(e => e.id !== id));
  }

  const payFixedExpense = (id: string, amountToPay: number) => {
      const expense = fixedExpenses.find(e => e.id === id);
      if (!expense) return;

      saveTransaction({
          amount: amountToPay,
          description: `Pago Gasto Fijo: ${expense.description}`,
          date: new Date().toISOString(),
          type: TransactionType.EXPENSE,
          category: expense.category,
          location: '',
          paymentMethod: PaymentMethod.BANK,
      });

      const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
      setFixedExpenses(prev => prev.map(e => e.id === id ? { ...e, lastPaidMonth: currentMonthStr } : e));
  }

  const saveCreditCard = (card: Omit<CreditCard, 'id'>, idToUpdate?: string) => {
    if (idToUpdate) {
        setCreditCards(prev => prev.map(c => c.id === idToUpdate ? {...card, id: idToUpdate} : c));
    } else {
        setCreditCards(prev => [...prev, {...card, id: crypto.randomUUID(), status: CreditCardStatus.ACTIVE }]);
    }
  }

  const deleteCreditCard = (cardId: string) => {
    setTransactions(prev =>
      prev.map(t =>
        t.creditCardId === cardId
          ? { ...t, paymentMethod: PaymentMethod.BANK, creditCardId: undefined }
          : t
      )
    );
    setCreditCards(prev => prev.filter(c => c.id !== cardId));
  };
  
  const handleImportData = (data: { transactions: Omit<Transaction, 'id'>[], debts: Omit<Debt, 'id'>[], categories: string[] }) => {
    const existingCategoryNames = new Set(categories.map(c => c.name.toLowerCase()));
    const newCategories = data.categories
        .filter(name => !existingCategoryNames.has(name.toLowerCase()))
        .map(name => ({ id: crypto.randomUUID(), name, icon: 'fa-folder-open', color: 'bg-stone-500' }));

    if (newCategories.length > 0) {
        setCategories(prev => [...prev, ...newCategories]);
    }

    let importedCardId = creditCards.find(c => c.name === 'Tarjeta Importada')?.id;
    if (!importedCardId && data.transactions.some(t => t.paymentMethod === PaymentMethod.CREDIT_CARD)) {
        const newCard: CreditCard = {
            id: crypto.randomUUID(),
            name: 'Tarjeta Importada',
            cutOffDay: 25,
            paymentDay: 10,
            status: CreditCardStatus.INACTIVE,
        };
        importedCardId = newCard.id;
        setCreditCards(prev => [...prev, newCard]);
    }

    const newTransactions = data.transactions.map(t => ({
        ...t,
        id: crypto.randomUUID(),
        creditCardId: t.paymentMethod === PaymentMethod.CREDIT_CARD ? importedCardId : undefined
    }));

    const newDebts = data.debts.map(d => ({
        ...d,
        id: crypto.randomUUID()
    }));
    
    setTransactions(prev => [...prev, ...newTransactions]);
    setDebts(prev => [...prev, ...newDebts]);

    alert(`¡Importación completada!\n- ${newTransactions.length} transacciones agregadas\n- ${newDebts.length} deudas agregadas\n- ${newCategories.length} nuevas categorías`);
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'debts':
        return <DebtManager debts={debts} onSaveDebt={saveDebt} onPayDebt={payDebt} onDeleteDebt={deleteDebt} />;
      case 'fixedExpenses':
        return <FixedExpenses expenses={fixedExpenses} categories={categories} onSaveExpense={saveFixedExpense} onPayExpense={payFixedExpense} onDeleteExpense={deleteFixedExpense} />;
      case 'categories':
        return <CategoryManager categories={categories} onAddCategory={addCategory} />;
      case 'settings':
        return <Settings creditCards={creditCards} onSave={saveCreditCard} onDelete={deleteCreditCard} onImportData={handleImportData}/>;
      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            <BalanceSummary transactions={transactions} debts={debts} creditCards={creditCards} />
            <TransactionList transactions={transactions} categories={categories} onEditTransaction={handleStartEditTransaction} />
          </div>
        );
    }
  };

  const SideNavButton: React.FC<{tab: ActiveTab, icon: string, label: string}> = ({tab, icon, label}) => (
      <button 
          onClick={() => setActiveTab(tab)}
          className={`flex items-center w-full p-2.5 my-1 rounded-md transition-colors duration-200 ${activeTab === tab ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
          aria-label={label}
      >
          <i className={`fas ${icon} text-lg w-8`}></i>
          <span className="ml-3">{label}</span>
      </button>
  );

  const MobileNavButton: React.FC<{tab: ActiveTab, icon: string, label: string}> = ({tab, icon, label}) => (
      <button 
          onClick={() => setActiveTab(tab)}
          className={`flex-1 p-2 text-center rounded-lg transition-colors duration-200 ${activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          aria-label={label}
      >
          <i className={`fas ${icon} text-lg block mx-auto mb-1`}></i>
          <span className="text-xs font-medium">{label}</span>
      </button>
  );

  return (
    <div className="min-h-screen flex flex-col text-gray-800">
      <header className="bg-white shadow p-4 sticky top-0 z-40 text-gray-900 border-b border-gray-200">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold"><i className="fas fa-chart-pie mr-2"></i>Finanzas Personales</h1>
          <button onClick={() => setTransactionModalOpen(true)} className="hidden md:inline-block bg-green-600 text-white hover:bg-green-700 font-bold rounded-lg text-sm px-5 py-2.5 text-center transition-colors">
            <i className="fas fa-plus mr-2"></i>Nueva Transacción
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white p-4 border-r border-gray-200">
          <nav className="flex-1 space-y-1">
            <SideNavButton tab="dashboard" icon="fa-home" label="Inicio"/>
            <SideNavButton tab="debts" icon="fa-credit-card" label="Deudas"/>
            <SideNavButton tab="fixedExpenses" icon="fa-calendar-alt" label="Gastos Fijos"/>
            <SideNavButton tab="categories" icon="fa-tags" label="Categorías"/>
            <SideNavButton tab="settings" icon="fa-cog" label="Ajustes"/>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 bg-gray-100 overflow-y-auto">
          {renderContent()}
        </main>
      </div>


      {/* Floating Action Button for mobile */}
      <button 
        onClick={() => setTransactionModalOpen(true)}
        className="md:hidden fixed bottom-24 right-4 bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center z-50 shadow-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-transform transform hover:scale-110"
        aria-label="Nueva Transacción"
      >
        <i className="fas fa-plus text-2xl"></i>
      </button>

      {/* Mobile Nav Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg grid grid-cols-5 items-center p-1 z-40 border-t border-gray-200">
        <MobileNavButton tab="dashboard" icon="fa-home" label="Inicio"/>
        <MobileNavButton tab="debts" icon="fa-credit-card" label="Deudas"/>
        <MobileNavButton tab="fixedExpenses" icon="fa-calendar-alt" label="Fijos"/>
        <MobileNavButton tab="categories" icon="fa-tags" label="Categorías"/>
        <MobileNavButton tab="settings" icon="fa-cog" label="Ajustes"/>
      </nav>

      <Modal isOpen={isTransactionModalOpen} onClose={handleCloseTransactionModal} title={editingTransaction ? "Editar Transacción" : "Registrar Transacción"}>
        <TransactionForm
          onSave={saveTransaction}
          onClose={handleCloseTransactionModal}
          categories={categories}
          locations={locations}
          creditCards={creditCards.filter(c => c.status === CreditCardStatus.ACTIVE)}
          editingTransaction={editingTransaction}
        />
      </Modal>
    </div>
  );
};

export default App;