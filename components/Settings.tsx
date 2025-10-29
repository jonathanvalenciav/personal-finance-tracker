import React, { useState, useEffect } from 'react';
import { CreditCard, CreditCardStatus, Transaction, Debt, TransactionType, PaymentMethod, DebtType } from '../types';
import Modal from './ui/Modal';

// Extend window interface for gapi and google
declare global {
    interface Window {
        gapi: any;
        google: any;
        tokenClient: any;
    }
}

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''; // Replace with your Google Client ID
const API_KEY = process.env.API_KEY || ''; // The API Key is needed for Picker and Sheets API
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly';


interface CreditCardFormProps {
    onSave: (card: Omit<CreditCard, 'id'>, idToUpdate?: string) => void;
    onClose: () => void;
    editingCard?: CreditCard | null;
}

const CreditCardForm: React.FC<CreditCardFormProps> = ({ onSave, onClose, editingCard }) => {
    const [name, setName] = useState('');
    const [cutOffDay, setCutOffDay] = useState('');
    const [paymentDay, setPaymentDay] = useState('');
    const [status, setStatus] = useState<CreditCardStatus>(CreditCardStatus.ACTIVE);

    useEffect(() => {
        if(editingCard) {
            setName(editingCard.name);
            setCutOffDay(String(editingCard.cutOffDay));
            setPaymentDay(String(editingCard.paymentDay));
            setStatus(editingCard.status);
        } else {
            setName('');
            setCutOffDay('');
            setPaymentDay('');
            setStatus(CreditCardStatus.ACTIVE);
        }
    }, [editingCard]);
    
    const handleDayChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d{0,2}$/.test(value)) {
            const day = parseInt(value, 10);
            if (day >= 1 && day <= 31) {
                setter(value);
            } else if (value === '') {
                 setter(value);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !cutOffDay || !paymentDay) {
            alert('Por favor complete todos los campos.');
            return;
        }
        onSave({
            name,
            cutOffDay: parseInt(cutOffDay, 10),
            paymentDay: parseInt(paymentDay, 10),
            status,
        }, editingCard?.id);
        onClose();
    };

    return (
         <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la tarjeta (ej. Visa Gold)" className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
            <input type="text" inputMode="numeric" value={cutOffDay} onChange={handleDayChange(setCutOffDay)} placeholder="Día de corte (1-31)" className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
            <input type="text" inputMode="numeric" value={paymentDay} onChange={handleDayChange(setPaymentDay)} placeholder="Día de pago (1-31)" className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
             <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Estado</label>
                <select value={status} onChange={e => setStatus(e.target.value as CreditCardStatus)} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                    <option value={CreditCardStatus.ACTIVE}>Activa</option>
                    <option value={CreditCardStatus.INACTIVE}>Inactiva</option>
                </select>
            </div>
            <div className="flex justify-end pt-2 gap-2">
                <button type="button" onClick={onClose} className="text-gray-800 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5">Cancelar</button>
                <button type="submit" className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5">{editingCard ? 'Actualizar' : 'Guardar'}</button>
            </div>
        </form>
    );
};

interface SettingsProps {
    creditCards: CreditCard[];
    onSave: (card: Omit<CreditCard, 'id'>, idToUpdate?: string) => void;
    onDelete: (cardId: string) => void;
    onImportData: (data: { transactions: Omit<Transaction, 'id'>[], debts: Omit<Debt, 'id'>[], categories: string[] }) => void;
}

const Settings: React.FC<SettingsProps> = ({ creditCards, onSave, onDelete, onImportData }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importMessage, setImportMessage] = useState('');

    const handleOpenModal = (cardToEdit: CreditCard | null = null) => {
        setEditingCard(cardToEdit);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCard(null);
    };
    
    const handleDelete = (cardId: string) => {
        if(window.confirm('¿Estás seguro de que quieres eliminar esta tarjeta? Las transacciones asociadas se reclasificarán como "Cuenta Bancaria".')) {
            onDelete(cardId);
        }
    };

    const handleStatusToggle = (card: CreditCard) => {
        const newStatus = card.status === CreditCardStatus.ACTIVE ? CreditCardStatus.INACTIVE : CreditCardStatus.ACTIVE;
        onSave({ ...card, status: newStatus }, card.id);
    };

    const handleImportClick = () => {
        setImportLoading(true);
        setImportMessage('Cargando APIs de Google...');
// FIX: Access gapi through the window object to resolve "Cannot find name 'gapi'".
        window.gapi.load('client:picker', () => {
// FIX: Access gapi through the window object to resolve "Cannot find name 'gapi'".
            window.gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4', () => {
                setImportMessage('Inicializando autenticación...');
// FIX: Access google through the window object to resolve "Cannot find name 'google'".
                window.tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (tokenResponse: any) => {
                        if (tokenResponse.access_token) {
// FIX: Access gapi through the window object to resolve "Cannot find name 'gapi'".
                            window.gapi.auth.setToken({ access_token: tokenResponse.access_token });
                            createPicker();
                        }
                    },
                });
                window.tokenClient.requestAccessToken();
            });
        });
    };

    const createPicker = () => {
        setImportMessage('Abriendo selector de archivos...');
// FIX: Access google through the window object to resolve "Cannot find name 'google'".
        const view = new window.google.picker.View(window.google.picker.ViewId.SPREADSHEETS);
// FIX: Access google through the window object to resolve "Cannot find name 'google'".
        const picker = new window.google.picker.PickerBuilder()
            .setAppId(process.env.GOOGLE_APP_ID || '')
            .setApiKey(API_KEY)
            .addView(view)
// FIX: Access gapi through the window object to resolve "Cannot find name 'gapi'".
            .setOAuthToken(window.gapi.auth.getToken().access_token)
            .setDeveloperKey(API_KEY)
            .setCallback(pickerCallback)
            .build();
        picker.setVisible(true);
    };

    const pickerCallback = async (data: any) => {
// FIX: Access google through the window object to resolve "Cannot find name 'google'".
        if (data[window.google.picker.Response.ACTION] == window.google.picker.Action.PICKED) {
// FIX: Access google through the window object to resolve "Cannot find name 'google'".
            const doc = data[window.google.picker.Response.DOCUMENTS][0];
            const spreadsheetId = doc.id;
            setImportMessage('Archivo seleccionado. Leyendo datos...');
            try {
// FIX: Access gapi through the window object to resolve "Cannot find name 'gapi'".
                const sheetsResponse = await window.gapi.client.sheets.spreadsheets.get({
                    spreadsheetId,
                });
                const sheetNames = sheetsResponse.result.sheets.map((s: any) => s.properties.title);
                const ranges = sheetNames.map((name: string) => `${name}!A:H`);

// FIX: Access gapi through the window object to resolve "Cannot find name 'gapi'".
                const dataResponse = await window.gapi.client.sheets.spreadsheets.values.batchGet({
                    spreadsheetId,
                    ranges,
                });

                setImportMessage('Procesando datos...');
                const parsedData = parseSheetData(dataResponse.result.valueRanges);
                onImportData(parsedData);
                setImportMessage('¡Importación exitosa!');
            } catch (error: any) {
                console.error(error);
                setImportMessage(`Error al importar: ${error.result?.error?.message || error.message}`);
            } finally {
                setImportLoading(false);
            }
        } else {
            setImportLoading(false);
            setImportMessage('');
        }
    };
    
    const parseSheetData = (valueRanges: any[]) => {
        const transactions: Omit<Transaction, 'id'>[] = [];
        const debts: Omit<Debt, 'id'>[] = [];
        const categories = new Set<string>();
        const header = ["DESCRIPCIÓN", "FECHA", "VALOR", "PAGO", "DIFERENCIA", "ESTADO", "CONCEPTO"];
        const colMap: { [key: string]: number } = {};

        // Find header row and map columns
        const firstSheetValues = valueRanges[0]?.values || [];
        const headerRowIndex = firstSheetValues.findIndex((row: string[]) => header.every(h => row.includes(h)));
        if(headerRowIndex === -1) {
            throw new Error("No se pudo encontrar la fila de encabezado en la hoja de cálculo.");
        }
        
        firstSheetValues[headerRowIndex].forEach((h: string, i: number) => {
            if(header.includes(h)) colMap[h] = i;
        });

        const parseAmount = (amountStr: string) => parseFloat(String(amountStr).replace(/[^0-9,-]+/g, "").replace(",", "."));
        
        for (const sheet of valueRanges) {
            for (let i = headerRowIndex + 1; i < (sheet.values?.length || 0); i++) {
                const row = sheet.values[i];
                const description = row[colMap["DESCRIPCIÓN"]];
                if (!description) continue;
                
                const status = row[colMap["ESTADO"]];
                const category = row[colMap["CONCEPTO"]];
                const dateStr = row[colMap["FECHA"]];
                
                const dateParts = dateStr.split('/');
                const date = new Date(Date.UTC(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0])));
                
                const valueAmount = parseAmount(row[colMap["VALOR"]] || '0');
                const paidAmount = parseAmount(row[colMap["PAGO"]] || '0');
                
                const isTDC = description.includes('[TDC]');
                const locationMatch = description.match(/\[(.*?)\]/);
                const location = locationMatch && locationMatch[1] !== 'TDC' ? locationMatch[1] : '';

                if(category) categories.add(category);
                
                if (status === 'PAGO') {
                    transactions.push({
                        amount: valueAmount,
                        description: description.replace(/\[.*?\]/g, '').trim(),
                        date: date.toISOString(),
                        type: TransactionType.EXPENSE, // Assuming all are expenses
                        category: category || 'Otro',
                        location,
                        paymentMethod: isTDC ? PaymentMethod.CREDIT_CARD : PaymentMethod.BANK, // Default to bank
                    });
                } else if (status === 'PENDIENTE') {
                    debts.push({
                        description: description.replace(/\[.*?\]/g, '').trim(),
                        totalAmount: valueAmount,
                        paidAmount,
                        dueDate: date.toISOString(), // Use transaction date as due date
                        type: DebtType.I_OWE,
                        person: isTDC ? "Tarjeta de Crédito" : "Varios",
                    });
                }
            }
        }
        return { transactions, debts, categories: Array.from(categories) };
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Ajustes de Tarjetas de Crédito</h2>
                    <button onClick={() => handleOpenModal()} className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-4 py-2 text-center">
                        <i className="fas fa-plus mr-2"></i>Nueva Tarjeta
                    </button>
                </div>

                <div className="space-y-3">
                    {creditCards.length > 0 ? (
                        creditCards.map(card => (
                            <div key={card.id} className="bg-white border border-gray-200 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{card.name}</p>
                                    <p className="text-sm text-gray-500">Corte: día {card.cutOffDay} | Pago: día {card.paymentDay}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <label htmlFor={`status-toggle-${card.id}`} className="flex items-center cursor-pointer" title={card.status === CreditCardStatus.ACTIVE ? 'Activa' : 'Inactiva'}>
                                        <div className="relative">
                                            <input type="checkbox" id={`status-toggle-${card.id}`} className="sr-only peer" checked={card.status === CreditCardStatus.ACTIVE} onChange={() => handleStatusToggle(card)} />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </div>
                                    </label>
                                    <button onClick={() => handleOpenModal(card)} className="text-gray-500 hover:text-blue-600 p-2 rounded-lg">
                                        <i className="fas fa-edit"></i>
                                    </button>
                                     <button onClick={() => handleDelete(card.id)} className="text-gray-500 hover:text-red-600 p-2 rounded-lg">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                         <p className="text-center text-gray-500 py-8">No has agregado ninguna tarjeta de crédito.</p>
                    )}
                </div>

                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCard ? 'Editar Tarjeta de Crédito' : 'Nueva Tarjeta de Crédito'}>
                    <CreditCardForm onSave={onSave} onClose={handleCloseModal} editingCard={editingCard} />
                </Modal>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Importar Datos</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Importa tu historial de transacciones desde una hoja de cálculo de Google Sheets para comenzar rápidamente.
                    Asegúrate de que tu archivo tenga las columnas: DESCRIPCIÓN, FECHA, VALOR, PAGO, ESTADO, CONCEPTO.
                </p>
                <button 
                    onClick={handleImportClick}
                    disabled={importLoading || !CLIENT_ID}
                    className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    <i className="fab fa-google mr-2"></i>
                    {importLoading ? 'Importando...' : 'Importar desde Google Sheets'}
                </button>
                {importMessage && <p className="text-sm text-center mt-3 text-gray-500">{importMessage}</p>}
                 {!CLIENT_ID && <p className="text-xs text-center mt-2 text-red-500">La importación está deshabilitada. Falta el ID de Cliente de Google.</p>}
            </div>

        </div>
    );
};

export default Settings;