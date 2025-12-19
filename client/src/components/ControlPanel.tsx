import React from 'react';
import { ThemeConfig } from '../lib/types';
import { Palette, X, RotateCcw, Image as ImageIcon } from 'lucide-react';

interface ControlPanelProps {
  theme: ThemeConfig;
  setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>;
  onReset: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ theme, setTheme, onReset }) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const handleChange = (key: keyof ThemeConfig, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 bg-white p-3 rounded-full shadow-xl hover:bg-gray-100 transition-colors border-2 border-gray-200"
        title="Open Theme Settings"
      >
        <Palette className="w-6 h-6 text-gray-800" />
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Theme Colors
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            title="Reset to Default"
          >
            <RotateCcw className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto">



        {/* Chroma Key Image */}
        <div className="space-y-3">
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

        {/* Blue Side */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Blue Team (Left)</h3>
          <div className="grid grid-cols-1 gap-3">
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

      </div>
      <div className="p-3 bg-gray-50 text-xs text-gray-400 text-center border-t border-gray-200">
        Changes reflect immediately
      </div>
    </div >
  );
};

export default ControlPanel;