import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import Modal from './ui/Modal';

const CategoryForm: React.FC<{
    onSave: (category: Omit<Category, 'id'>) => void;
    onClose: () => void;
    editingCategory?: Category | null;
}> = ({ onSave, onClose, editingCategory }) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('fa-tag');
    const [color, setColor] = useState('bg-gray-500');

    const colors = [
        'bg-gray-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500',
        'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-emerald-500',
        'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500',
        'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
        'bg-pink-500', 'bg-rose-500'
    ];

    useEffect(() => {
        if (editingCategory) {
            setName(editingCategory.name);
            setIcon(editingCategory.icon || 'fa-tag');
            setColor(editingCategory.color || 'bg-gray-500');
        } else {
            setName('');
            setIcon('fa-tag');
            setColor('bg-gray-500');
        }
    }, [editingCategory]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            alert('El nombre de la categoría es obligatorio.');
            return;
        }
        onSave({ name, icon, color });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Nombre de la Categoría</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Compras"
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required
                />
            </div>
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Ícono (Font Awesome)</label>
                <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="Ej. fa-shopping-cart"
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                />
                 <p className="text-xs text-gray-500 mt-1">Busca íconos en <a href="https://fontawesome.com/v6/search?m=free&s=solid" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Font Awesome</a> (ej. fa-home).</p>
            </div>
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Color</label>
                <div className="grid grid-cols-6 gap-2">
                    {colors.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className={`w-10 h-10 rounded-full ${c} border-2 ${color === c ? 'border-blue-500 ring-2 ring-blue-300' : 'border-transparent'}`}
                            aria-label={`Select color ${c}`}
                        />
                    ))}
                </div>
            </div>
             <div className="flex justify-end pt-2 gap-2">
                <button type="button" onClick={onClose} className="text-gray-800 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5">Cancelar</button>
                <button type="submit" className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5">{editingCategory ? 'Actualizar' : 'Crear'} Categoría</button>
            </div>
        </form>
    );
};


interface CategoryManagerProps {
    categories: Category[];
    onSaveCategory: (category: Omit<Category, 'id'>, idToUpdate?: string) => void;
    onDeleteCategory: (categoryId: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onSaveCategory, onDeleteCategory }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const handleOpenModal = (category: Category | null = null) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingCategory(null);
        setIsModalOpen(false);
    };

    const handleSave = (categoryData: Omit<Category, 'id'>) => {
        onSaveCategory(categoryData, editingCategory?.id);
    };
    
    const handleDelete = (categoryId: string) => {
        const categoryToDelete = categories.find(c => c.id === categoryId);
        if (!categoryToDelete) return;

        if (window.confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoryToDelete.name}"? Todas las transacciones y gastos fijos asociados se moverán a la categoría "Otro".`)) {
            onDeleteCategory(categoryId);
        }
    };
    
    // Can't delete the default "Otro" category
    const defaultCategories = ['Otro', 'Deudas', 'Pago Tarjeta de Crédito'];


    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-gray-900">Gestionar Categorías</h2>
                 <button onClick={() => handleOpenModal()} className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-4 py-2 text-center">
                    <i className="fas fa-plus mr-2"></i>Nueva Categoría
                </button>
            </div>
            
            <div className="space-y-2">
                {categories.map(cat => (
                    <div key={cat.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.color?.replace('bg-','bg-').replace('-500','-100')} ${cat.color?.replace('bg-','text-').replace('-500','-600')}`}>
                                <i className={`fas ${cat.icon || 'fa-tag'} text-base`}></i>
                            </div>
                            <span className="font-medium text-gray-800">{cat.name}</span>
                        </div>
                        {!defaultCategories.includes(cat.name) && (
                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(cat)} className="text-gray-400 hover:text-blue-600 text-sm p-2 rounded-md">
                                    <i className="fas fa-pencil-alt"></i>
                                </button>
                                <button onClick={() => handleDelete(cat.id)} className="text-gray-400 hover:text-red-600 text-sm p-2 rounded-md">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCategory ? "Editar Categoría" : "Nueva Categoría"}>
                <CategoryForm onSave={handleSave} onClose={handleCloseModal} editingCategory={editingCategory} />
            </Modal>
        </div>
    );
};

export default CategoryManager;
