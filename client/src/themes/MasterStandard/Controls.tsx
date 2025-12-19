import React from 'react';
import { ThemeConfig } from '../../lib/types';
import SharedControls from '../../components/SharedControls';
import FlagPicker from '../../components/FlagPicker';

interface ControlsProps {
    theme: ThemeConfig;
    setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>;
}

const Controls: React.FC<ControlsProps> = ({ theme, setTheme }) => {
    const handleChange = (key: keyof ThemeConfig, value: string) => {
        setTheme((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6">
            <SharedControls theme={theme} setTheme={setTheme} />

            {/* Blue Side */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Blue Team (Left)</h3>
                <div className="grid grid-cols-1 gap-3">
                    <FlagPicker
                        label="Team Flag"
                        selectedFlag={theme.team1Flag}
                        onSelect={(url) => handleChange('team1Flag', url)}
                    />
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Primary Gradient</label>
                        <input
                            type="color"
                            value={theme.bluePrimary}
                            onChange={(e) => handleChange('bluePrimary', e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-none"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Secondary Gradient</label>
                        <input
                            type="color"
                            value={theme.blueSecondary}
                            onChange={(e) => handleChange('blueSecondary', e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-none"
                        />
                    </div>
                </div>
            </div>

            {/* Purple Side */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Purple Team (Right)</h3>
                <div className="grid grid-cols-1 gap-3">
                    <FlagPicker
                        label="Team Flag"
                        selectedFlag={theme.team2Flag}
                        onSelect={(url) => handleChange('team2Flag', url)}
                    />
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Primary Gradient</label>
                        <input
                            type="color"
                            value={theme.purplePrimary}
                            onChange={(e) => handleChange('purplePrimary', e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-none"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Secondary Gradient</label>
                        <input
                            type="color"
                            value={theme.purpleSecondary}
                            onChange={(e) => handleChange('purpleSecondary', e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-none"
                        />
                    </div>
                </div>
            </div>

            {/* Strip B Granular Controls */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Strip B Segments (L to R)</h3>

                {/* Segment 1 */}
                <div className="bg-gray-50 p-2 rounded-lg space-y-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Segment 1 (Far Left)</span>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">Start</label>
                            <input type="color" value={theme.midStrip1Start} onChange={(e) => handleChange('midStrip1Start', e.target.value)} className="w-full h-6 rounded cursor-pointer border-none" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">End</label>
                            <input type="color" value={theme.midStrip1End} onChange={(e) => handleChange('midStrip1End', e.target.value)} className="w-full h-6 rounded cursor-pointer border-none" />
                        </div>
                    </div>
                </div>

                {/* Segment 2 */}
                <div className="bg-gray-50 p-2 rounded-lg space-y-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Segment 2 (Inner Left)</span>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">Start</label>
                            <input type="color" value={theme.midStrip2Start} onChange={(e) => handleChange('midStrip2Start', e.target.value)} className="w-full h-6 rounded cursor-pointer border-none" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">End</label>
                            <input type="color" value={theme.midStrip2End} onChange={(e) => handleChange('midStrip2End', e.target.value)} className="w-full h-6 rounded cursor-pointer border-none" />
                        </div>
                    </div>
                </div>

                {/* Segment 3 */}
                <div className="bg-gray-50 p-2 rounded-lg space-y-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Segment 3 (Middle Spacer)</span>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">Start</label>
                            <input type="color" value={theme.midStrip3Start} onChange={(e) => handleChange('midStrip3Start', e.target.value)} className="w-full h-6 rounded cursor-pointer border-none" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">End</label>
                            <input type="color" value={theme.midStrip3End} onChange={(e) => handleChange('midStrip3End', e.target.value)} className="w-full h-6 rounded cursor-pointer border-none" />
                        </div>
                    </div>
                </div>

                {/* Segment 4 */}
                <div className="bg-gray-50 p-2 rounded-lg space-y-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Segment 4 (Right)</span>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">Start</label>
                            <input type="color" value={theme.midStrip4Start} onChange={(e) => handleChange('midStrip4Start', e.target.value)} className="w-full h-6 rounded cursor-pointer border-none" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">End</label>
                            <input type="color" value={theme.midStrip4End} onChange={(e) => handleChange('midStrip4End', e.target.value)} className="w-full h-6 rounded cursor-pointer border-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar Controls */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bottom Bar (L to R)</h3>

                {/* Bottom Bar Segment 1 (Left) */}
                <div className="bg-gray-50 p-2 rounded-lg space-y-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Segment 1 (Left - Pink/Purple)</span>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">Start</label>
                            <input type="color" value={theme.bottomBar1Start} onChange={(e) => handleChange('bottomBar1Start', e.target.value)} className="w-full h-6 rounded cursor-pointer border-none" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">End</label>
                            <input type="color" value={theme.bottomBar1End} onChange={(e) => handleChange('bottomBar1End', e.target.value)} className="w-full h-6 rounded cursor-pointer border-none" />
                        </div>
                    </div>
                </div>

                {/* Bottom Bar Segment 2 (Right) */}
                <div className="bg-gray-50 p-2 rounded-lg space-y-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Segment 2 (Right - Blue)</span>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">Start</label>
                            <input type="color" value={theme.bottomBar2Start} onChange={(e) => handleChange('bottomBar2Start', e.target.value)} className="w-full h-6 rounded cursor-pointer border-none" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">End</label>
                            <input type="color" value={theme.bottomBar2End} onChange={(e) => handleChange('bottomBar2End', e.target.value)} className="w-full h-6 rounded cursor-pointer border-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Details & Effects</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Ring Color</label>
                        <input
                            type="color"
                            value={theme.ringColor}
                            onChange={(e) => handleChange('ringColor', e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-none"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Header Shine Color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={theme.shineColor === 'rgba(255, 255, 255, 0.6)' ? '#ffffff' : theme.shineColor}
                                onChange={(e) => handleChange('shineColor', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Box Sweep Color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={theme.boxSweepColor === 'rgba(255, 255, 255, 0.2)' ? '#ffffff' : theme.boxSweepColor}
                                onChange={(e) => handleChange('boxSweepColor', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Controls;
