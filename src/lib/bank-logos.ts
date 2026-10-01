export interface BankInfo {
    name: string;
    code: string;
    logo: string;
    category: 'commercial' | 'fintech' | 'psb' | 'microfinance';
}

// Logo files live in Plugr_Web/public/bank-logos/{code}.png — see scripts/download-bank-logos.mjs
// and scripts/bank-logo-manifest.json (frontend repo) for how they were sourced.
export const BANK_LOGOS: Record<string, BankInfo> = {
    '044': { name: 'Access Bank', code: '044', category: 'commercial', logo: '/bank-logos/044.png' },
    '011': { name: 'First Bank of Nigeria', code: '011', category: 'commercial', logo: '/bank-logos/011.png' },
    '058': { name: 'Guaranty Trust Bank (GTB)', code: '058', category: 'commercial', logo: '/bank-logos/058.png' },
    '033': { name: 'United Bank for Africa (UBA)', code: '033', category: 'commercial', logo: '/bank-logos/033.png' },
    '057': { name: 'Zenith Bank', code: '057', category: 'commercial', logo: '/bank-logos/057.png' },
    '070': { name: 'Fidelity Bank', code: '070', category: 'commercial', logo: '/bank-logos/070.png' },
    '214': { name: 'FCMB', code: '214', category: 'commercial', logo: '/bank-logos/214.png' },
    '221': { name: 'Stanbic IBTC', code: '221', category: 'commercial', logo: '/bank-logos/221.png' },
    '232': { name: 'Sterling Bank', code: '232', category: 'commercial', logo: '/bank-logos/232.png' },
    '035': { name: 'Wema Bank / ALAT', code: '035', category: 'commercial', logo: '/bank-logos/035.png' },
    '999992': { name: 'OPay', code: '999992', category: 'fintech', logo: '/bank-logos/999992.png' },
    '50515': { name: 'Moniepoint MFB', code: '50515', category: 'fintech', logo: '/bank-logos/50515.png' },
    '50211': { name: 'Kuda Bank', code: '50211', category: 'fintech', logo: '/bank-logos/50211.png' },
    '999991': { name: 'PalmPay', code: '999991', category: 'fintech', logo: '/bank-logos/999991.png' },
    '51318': { name: 'FairMoney MFB', code: '51318', category: 'fintech', logo: '/bank-logos/51318.png' },
    '565': { name: 'Carbon', code: '565', category: 'fintech', logo: '/bank-logos/565.png' },
    '120003': { name: 'MoMo PSB (MTN)', code: '120003', category: 'psb', logo: '/bank-logos/120003.png' },
    '120004': { name: 'Smartcash PSB (Airtel)', code: '120004', category: 'psb', logo: '/bank-logos/120004.png' },
};

export function getBankInfoByCode(code: string): BankInfo | undefined {
    if (!code) return undefined;
    return BANK_LOGOS[code.trim()];
}

export function findLogoByCode(code: string): string | undefined {
    return getBankInfoByCode(code)?.logo;
}