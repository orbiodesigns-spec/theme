import MasterStandard from './MasterStandard';

import { ThemeModule } from './types';

export const themes: Record<string, ThemeModule> = {
    'master-standard': MasterStandard,
};

export const defaultThemeId = 'master-standard';
