export interface FlagCategory {
    id: string;
    name: string;
    flags: FlagItem[];
}

export interface FlagItem {
    id: string; // ISO code or unique ID
    name: string;
    url: string;
}

const getFlagUrl = (code: string) => `https://flagcdn.com/w320/${code.toLowerCase()}.png`;

export const FLAG_CATEGORIES: FlagCategory[] = [
    {
        id: 'icc_full',
        name: 'ICC Full Members',
        flags: [
            { id: 'in', name: 'India', url: getFlagUrl('in') },
            { id: 'au', name: 'Australia', url: getFlagUrl('au') },
            { id: 'gb-eng', name: 'England', url: getFlagUrl('gb-eng') },
            { id: 'za', name: 'South Africa', url: getFlagUrl('za') },
            { id: 'nz', name: 'New Zealand', url: getFlagUrl('nz') },
            { id: 'pk', name: 'Pakistan', url: getFlagUrl('pk') },
            { id: 'lk', name: 'Sri Lanka', url: getFlagUrl('lk') },
            { id: 'bd', name: 'Bangladesh', url: getFlagUrl('bd') },
            { id: 'af', name: 'Afghanistan', url: getFlagUrl('af') },
            { id: 'zw', name: 'Zimbabwe', url: getFlagUrl('zw') },
            { id: 'ie', name: 'Ireland', url: getFlagUrl('ie') },
        ]
    },
    {
        id: 'icc_associate',
        name: 'Associate Nations',
        flags: [
            { id: 'us', name: 'USA', url: getFlagUrl('us') },
            { id: 'ca', name: 'Canada', url: getFlagUrl('ca') },
            { id: 'np', name: 'Nepal', url: getFlagUrl('np') },
            { id: 'ae', name: 'UAE', url: getFlagUrl('ae') },
            { id: 'om', name: 'Oman', url: getFlagUrl('om') },
            { id: 'nl', name: 'Netherlands', url: getFlagUrl('nl') },
            { id: 'sc', name: 'Scotland', url: 'https://flagcdn.com/w320/gb-sct.png' }, // Special case for Scotland
            { id: 'na', name: 'Namibia', url: getFlagUrl('na') },
            { id: 'pg', name: 'PNG', url: getFlagUrl('pg') },
            { id: 'ug', name: 'Uganda', url: getFlagUrl('ug') },
        ]
    },
    {
        id: 'generic',
        name: 'Generic / Other',
        flags: [
            { id: 'eu', name: 'Europe', url: getFlagUrl('eu') },
            { id: 'un', name: 'United Nations', url: getFlagUrl('un') },
        ]
    }
];

export const getAllFlags = () => {
    return FLAG_CATEGORIES.flatMap(c => c.flags);
}
