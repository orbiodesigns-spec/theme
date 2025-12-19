
export interface ThemeConfig {
  bluePrimary: string;
  blueSecondary: string;
  purplePrimary: string;
  purpleSecondary: string;
  ringColor: string;
  innerBarColor: string;
  shineColor: string;
  boxSweepColor: string;
  accentColor: string;
  chromaKeyImage: string;
  // Cricket / Match Data
  team1Name: string;
  team2Name: string;
  team1Score: string;
  team2Score: string;
  team1Flag: string; // ISO code or URL
  team2Flag: string; // ISO code or URL
  textBatsman1: string;
  textBatsman2: string;
  textBowler: string;

  // Middle Strip B Granular Controls
  midStrip1Start: string;
  midStrip1End: string;
  midStrip2Start: string;
  midStrip2End: string;
  midStrip3Start: string;
  midStrip3End: string;
  midStrip4Start: string;
  midStrip4End: string;

  // Bottom Bar Controls
  bottomBar1Start: string;
  bottomBar1End: string;
  bottomBar2Start: string;
  bottomBar2End: string;
}

export const DEFAULT_THEME: ThemeConfig = {
  bluePrimary: '#0066cc',
  blueSecondary: '#003366',
  purplePrimary: '#6600cc',
  purpleSecondary: '#330066',
  ringColor: '#ffffff',
  innerBarColor: '#ffffff',
  shineColor: 'rgba(255, 255, 255, 0.6)',
  boxSweepColor: 'rgba(255, 255, 255, 0.2)',
  accentColor: '#fb923c',
  chromaKeyImage: '',

  team1Name: 'BLUE TEAM',
  team2Name: 'PURPLE TEAM',
  team1Score: '145/3 (18.4)',
  team2Score: 'Target: 146',
  team1Flag: '',
  team2Flag: '',
  textBatsman1: 'Kohli 58*(42)',
  textBatsman2: 'Pandya 12(8)',
  textBowler: 'Starc 2.4-0-28-1',

  // Defaults matching original look
  midStrip1Start: '#0066cc', // Blue Primary
  midStrip1End: '#003366',   // Blue Secondary
  midStrip2Start: '#0066cc', // Blue Primary
  midStrip2End: '#003366',   // Blue Secondary
  midStrip3Start: '#000000', // Black
  midStrip3End: '#000000',   // Black
  midStrip4Start: '#6600cc', // Purple Primary
  midStrip4End: '#330066',   // Purple Secondary

  // Bottom Bar defaults
  bottomBar1Start: '#db2777', // Pink
  bottomBar1End: '#7e22ce',   // Purple
  bottomBar2Start: '#1e3a8a', // Dark Blue
  bottomBar2End: '#0f172a',   // Very Dark Blue
};

export interface Purchase {
  layoutId: string;
  purchaseDate: string; // ISO Date String
  expiryDate: string;   // ISO Date String
  durationLabel: string; // e.g., "1 Month", "1 Year"
  pricePaid: number;
  publicToken?: string; // UUID for public OBS view
  savedThemeConfig?: ThemeConfig; // Persistence
  thumbnail_url?: string;
  layoutName?: string;
  orderId?: string;
  paymentMethod?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  file_url: string;
  file_type: string;
  thumbnail_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductPurchase {
  id: number;
  product_id: number;
  product_name: string;
  product_description?: string;
  price_paid: number;
  order_id?: string;
  purchased_at: string;
  file_url: string;
  file_type: string;
  thumbnail_url?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  purchases: Purchase[];
  productPurchases?: ProductPurchase[];
}

export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  age: number;
  password_hash: string;
  created_at: string;
  purchase_count: number;
  total_spent: number;
}

export interface AdminStats {
  totalUsers: number;
  activeSubs: number;
  totalRevenue: number;
  recentUsers: any[];
}

export interface AdminTransaction {
  order_id: string;
  amount: number;
  status: string;
  created_at: string;
  user_name: string;
  user_email: string;
}

export interface LayoutItem {
  id: string;
  name: string;
  description: string;
  thumbnail?: string; // Legacy/CSS color
  thumbnail_url?: string; // New Image URL
  base_price: number; // Legacy/Reference
  price_1mo?: number;
  price_3mo?: number;
  price_6mo?: number;
  price_1yr?: number;
  is_active?: boolean | number;
}

export interface DurationOption {
  id: '1mo' | '3mo' | '6mo' | '1yr';
  label: string;
  multiplier: number; // Multiplies base price
  months: number;
}

export const DURATION_OPTIONS: DurationOption[] = [
  { id: '1mo', label: '1 Month', multiplier: 1, months: 1 },
  { id: '3mo', label: '3 Months', multiplier: 2.5, months: 3 }, // Slight discount
  { id: '6mo', label: '6 Months', multiplier: 4.5, months: 6 },
  { id: '1yr', label: '1 Year', multiplier: 8, months: 12 }, // Best value
];

export interface SupportQuery {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'PENDING' | 'SOLVED';
  created_at: string;
}


