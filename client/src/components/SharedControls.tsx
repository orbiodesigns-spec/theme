import React from 'react';
import { ThemeConfig } from '../lib/types';
import { Image as ImageIcon } from 'lucide-react';

interface SharedControlsProps {
    theme: ThemeConfig;
    setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>;
}

const SharedControls: React.FC<SharedControlsProps> = ({ theme, setTheme }) => {
    const handleChange = (key: keyof ThemeConfig, value: string) => {
        setTheme((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <>
            {/* Chroma Key Image */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" /> Background Preview
                </h3>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Image URL</label>
                    <input
                        type="text"
                        value={theme.chromaKeyImage}
                        onChange={(e) => handleChange('chromaKeyImage', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-gray-400">Paste a direct image link to preview on green screen</p>
                </div>
            </div>
        </>
    );
};

export default SharedControls;
