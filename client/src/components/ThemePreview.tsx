import React from 'react';
import { ThemeConfig } from '../lib/types';
import { themes } from '../themes/registry';

interface EditorProps {
  theme: ThemeConfig;
  layoutId: string;
}

const ThemePreview: React.FC<EditorProps> = ({ theme, layoutId }) => {
  // Use the registry to find the layout component
  const CurrentTheme = themes[layoutId] || themes['master-standard'];
  const LayoutComponent = CurrentTheme.Layout;

  // The designs are built on a 1920x1080 grid.
  // We scale them down to fit the 1280x720 container (Scale factor 0.6666667)
  const scaleRatio = 1280 / 1920;

  return (
    <div
      style={{
        width: '1920px',
        height: '1080px',
        transform: `scale(${scaleRatio})`,
        transformOrigin: 'top left',
      }}
      className="overflow-hidden bg-black"
    >
      <LayoutComponent theme={theme} />
    </div>
  );
};

export default ThemePreview;