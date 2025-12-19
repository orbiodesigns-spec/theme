// This registry allows for easy addition of new layouts.
// To add a new layout:
// 1. Create the component in src/layouts/
// 2. Import it here
// 3. Add a new entry to the LAYOUT_REGISTRY object

import { LayoutItem } from '../lib/types';

// Metadata Registry
export const LAYOUT_REGISTRY: LayoutItem[] = [
    {
        id: 'master-standard',
        name: 'Master Standard',
        description: 'The classic broadcast look with glossy gradients and rounded pills.',
        thumbnail: 'linear-gradient(135deg, #0066cc, #330066)',
        basePrice: 10,
    },
];

export const getLayoutById = (id: string) => LAYOUT_REGISTRY.find(l => l.id === id);
