import React, { useState } from 'react';
import { Category } from '../types';

interface CategoryManagerProps {
    categories: Category[];
    onAddCategory: (name: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAddCategory }) => {
    const [newCategory, setNewCategory] = useState('');

    const handleAddCategory = () => {
        if (newCategory.trim() !== '') {
            onAddCategory(newCategory.trim());
            setNewCategory('');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Gestionar Categorías</h2>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nueva categoría"
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                />
                <button onClick={handleAddCategory} className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-5 py-2.5">Agregar</button>
            </div>
            <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                    <span key={cat.id} className="bg-gray-100 text-gray-800 text-sm font-medium me-2 px-2.5 py-1 rounded-full border border-gray-200">
                        {cat.name}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default CategoryManager;