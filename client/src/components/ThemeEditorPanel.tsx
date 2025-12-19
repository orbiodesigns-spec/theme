import React, { useState } from 'react';
import { Settings2, RotateCcw, ChevronRight, ChevronLeft, Save, Loader2 } from 'lucide-react';

interface Props {
    children: React.ReactNode;
    onReset: () => void;
    onSave?: () => void;
    isSaving?: boolean;
}

const ThemeEditorPanel: React.FC<Props> = ({ children, onReset, onSave, isSaving = false }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all duration-300 ${isOpen ? 'translate-x-[340px] opacity-0 pointer-events-none' : 'translate-x-0'}`}
            >
                <Settings2 className="w-6 h-6" />
            </button>

            {/* Main Panel */}
            <div
                className={`fixed top-4 right-4 z-40 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 flex flex-col transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
                    }`}
                style={{ height: 'calc(100vh - 2rem)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50 rounded-t-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-gray-800">
                        <Settings2 className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-sm tracking-wide">Theme Designer</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {onSave && (
                            <button
                                onClick={onSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-xs disabled:opacity-50 shadow-sm"
                                title="Save Changes"
                            >
                                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        )}
                        <button
                            onClick={onReset}
                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                            title="Reset to Defaults"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white/30">
                    {children}
                </div>

                {/* Footer info */}
                <div className="p-3 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl text-center">
                    <p className="text-[10px] text-gray-400 font-medium">Changes save automatically</p>
                </div>
            </div>
        </>
    );
};

export default ThemeEditorPanel;
