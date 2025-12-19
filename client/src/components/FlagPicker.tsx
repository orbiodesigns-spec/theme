import React, { useState, useMemo } from 'react';
import { Search, Globe, ChevronDown, Check } from 'lucide-react';
import { FLAG_CATEGORIES, FlagItem } from '../lib/flags';

interface FlagPickerProps {
    label: string;
    selectedFlag: string; // URL or ID
    onSelect: (flagUrl: string) => void;
}

const FlagPicker: React.FC<FlagPickerProps> = ({ label, selectedFlag, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    // Filter logic
    const filteredCategories = useMemo(() => {
        return FLAG_CATEGORIES.map(cat => ({
            ...cat,
            flags: cat.flags.filter(
                f => f.name.toLowerCase().includes(search.toLowerCase())
            )
        })).filter(cat => cat.flags.length > 0);
    }, [search]);

    const handleSelect = (flag: FlagItem) => {
        onSelect(flag.url);
        setIsOpen(false);
    };

    const selectedFlagItem = useMemo(() => {
        if (!selectedFlag) return null;
        for (const cat of FLAG_CATEGORIES) {
            const found = cat.flags.find(f => f.url === selectedFlag);
            if (found) return found;
        }
        return { name: 'Custom Selection', url: selectedFlag };
    }, [selectedFlag]);

    return (
        <div className="relative">
            <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>

            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-400 transition-colors"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {selectedFlag ? (
                        <img src={selectedFlag} alt="Flag" className="w-6 h-4 object-cover rounded shadow-sm" />
                    ) : (
                        <div className="w-6 h-4 bg-gray-100 rounded shadow-sm flex items-center justify-center">
                            <Globe className="w-3 h-3 text-gray-400" />
                        </div>
                    )}
                    <span className="text-sm text-gray-700 truncate">
                        {selectedFlagItem?.name || 'Select a Flag...'}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                    {/* Content */}
                    <div className="absolute z-50 mt-2 w-full min-w-[300px] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[400px]">

                        {/* Search Bar */}
                        <div className="p-3 border-b border-gray-100 bg-gray-50">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search countries..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                            {filteredCategories.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 text-sm">
                                    No countries found.
                                </div>
                            ) : (
                                filteredCategories.map(cat => (
                                    <div key={cat.id} className="mb-4 last:mb-0">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">
                                            {cat.name}
                                        </h4>
                                        <div className="grid grid-cols-1 gap-1">
                                            {cat.flags.map(flag => (
                                                <button
                                                    key={flag.id}
                                                    onClick={() => handleSelect(flag)}
                                                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${selectedFlag === flag.url
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'hover:bg-gray-50 text-gray-700'
                                                        }`}
                                                >
                                                    <img src={flag.url} alt={flag.name} className="w-8 h-5 object-cover rounded shadow-sm border border-gray-100" />
                                                    <span className="text-sm font-medium flex-1">{flag.name}</span>
                                                    {selectedFlag === flag.url && <Check className="w-4 h-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default FlagPicker;
