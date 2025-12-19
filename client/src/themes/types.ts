import React from 'react';
import { ThemeConfig } from '../lib/types';

export interface ThemeModule {
    id: string;
    name: string;
    Layout: React.FC<{ theme: ThemeConfig }>;
    Controls: React.FC<{
        theme: ThemeConfig;
        setTheme: React.Dispatch<React.SetStateAction<ThemeConfig>>;
    }>;
    defaultConfig?: Partial<ThemeConfig>;
}
