// frontend/src/components/ResourceCard.jsx
import React from 'react';

const ResourceCard = ({ title, subtitle, items, type, onAdd, onDelete }) => {
    // Determine the label for the secondary info (code or initials)
    const getSecondaryLabel = (item) => {
        if (type === 'subject') {
            return item.code;
        }
        if (type === 'teacher') {
            return item.initials; // Assuming teacher model uses 'initials'
        }
        if (type === 'room') {
            return `Cap: ${item.capacity}`; // Assuming room model uses 'capacity'
        }
        return '';
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            {/* Header and Subtitle */}
            <h3 className="text-xl font-semibold mb-1 text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500 mb-4">{subtitle}</p>

            {/* List of Items */}
            {items && items.length > 0 ? (
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {items.map((item) => (
                        <li 
                            key={item._id} 
                            className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md border-l-4 border-blue-400"
                        >
                            <div className="flex-1 min-w-0">
                                <span className="font-medium text-gray-900 truncate">
                                    {item.name}
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                    {getSecondaryLabel(item)}
                                
                                </span>
                            </div>
                            
                            {/* Delete Button */}
                            <button
                                onClick={() => onDelete(item._id, type)}
                                className="text-red-500 hover:text-red-700 ml-3 transition"
                                title={`Delete ${item.name}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 mb-4">No {title.toLowerCase()} added yet.</p>
            )}

            {/* --- THE ADD BUTTON --- */}
            <button
                // This is the CRITICAL line that calls the handleOpenModal function from Dashboard
                onClick={onAdd}
                className="mt-4 px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
                + Add
            </button>
        </div>
    );
};

export default ResourceCard;