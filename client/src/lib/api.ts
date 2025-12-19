import { User, LayoutItem, Purchase, ThemeConfig, DURATION_OPTIONS, AdminStats, AdminUser, AdminTransaction, SupportQuery, Product } from './types';
import { LAYOUT_REGISTRY } from '../registry/layouts'; // Fallback for layout metadata if needed

const API_Base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  // --- AUTH ---
  login: async (email: string, password: string): Promise<User> => {
    const res = await fetch(`${API_Base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('streamtheme_token', data.token);
    }
    return data;
  },

  register: async (name: string, email: string, password: string, phone: string, age: number): Promise<User> => {
    const res = await fetch(`${API_Base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone, age })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('streamtheme_token', data.token);
    }
    return data;
  },

  resetPassword: async (email: string): Promise<void> => {
    // Not implemented in backend yet, keep as mock or throw
    console.log('Reset password for', email);
    return Promise.resolve();
  },

  submitSupportQuery: async (data: { name: string, email: string, subject: string, message: string }) => {
    const res = await fetch(`${API_Base}/support`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to submit query");
    return res.json();
  },

  // --- DATA ---
  getLayouts: async (): Promise<LayoutItem[]> => {
    const res = await fetch(`${API_Base}/layouts`);
    if (!res.ok) throw new Error("Failed to fetch layouts");
    return res.json();
  },

  purchaseLayout: async (layoutId: string, durationId: string): Promise<User> => {
    // 1. Get current user ID (Simplified: we assume app passes it, but here we cheat and look at localStorage to get ID for the request)
    // Ideally, 'purchaseLayout' should take userId as arg.
    // We will assume the component handles the state update, we just need to return the *updated* user object.
    // But wait... purchaseLayout needs to know WHO is buying.

    const storedUser = localStorage.getItem('streamtheme_user');
    const token = localStorage.getItem('streamtheme_token');
    if (!storedUser || !token) throw new Error("Not logged in");
    const user = JSON.parse(storedUser);

    const duration = DURATION_OPTIONS.find(d => d.id === durationId);
    if (!duration) throw new Error("Invalid duration");

    const price = 20 * duration.multiplier; // Approximation since we are mixing sources

    const res = await fetch(`${API_Base}/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: user.id,
        layoutId,
        durationLabel: duration.label,
        months: duration.months,
        price
      })
    });

    if (!res.ok) throw new Error('Purchase failed');

    const newPurchase = await res.json();

    // Return updated user object locally to save round trip (or fetch profile again)
    return {
      ...user,
      purchases: [...user.purchases.filter((p: Purchase) => p.layoutId !== layoutId), newPurchase]
    };
  },

  saveThemeConfig: async (layoutId: string, config: ThemeConfig): Promise<User | null> => {
    const storedUser = localStorage.getItem('streamtheme_user');
    const token = localStorage.getItem('streamtheme_token');
    if (!storedUser || !token) return null;
    const user = JSON.parse(storedUser) as User;

    await fetch(`${API_Base}/purchases/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId: user.id, layoutId, config })
    });

    // Update local user object to reflect changes immediately
    const updatedUser = {
      ...user,
      purchases: user.purchases.map(p =>
        p.layoutId === layoutId ? { ...p, savedThemeConfig: config } : p
      )
    };

    // Also update storage immediately to be safe
    localStorage.setItem('streamtheme_user', JSON.stringify(updatedUser));

    return updatedUser;
  },

  getPublicLayout: async (token: string, sessionId: string): Promise<{ layoutId: string, config: ThemeConfig | null, isExpired: boolean } | null> => {
    const res = await fetch(`${API_Base}/public/${token}?sessionId=${sessionId}`);
    if (res.status === 409) throw new Error("SESSION_LOCKED");
    if (!res.ok) return null;
    return res.json();
  },

  sendHeartbeat: async (token: string, sessionId: string) => {
    const res = await fetch(`${API_Base}/public/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, sessionId })
    });
    if (res.status === 409) throw new Error("LOCK_LOST");
  },

  createPaymentOrder: async (layoutId: string | null, months: number, couponCode: string, customerPhone: string, productIds?: number[]): Promise<{ orderId: string, amount: number, currency: string, keyId: string, contact: string, email: string }> => {
    const token = localStorage.getItem('streamtheme_token');
    const res = await fetch(`${API_Base}/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ layoutId, months, couponCode, customerPhone, productIds })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to initiate payment");
    }
    return res.json();
  },

  checkCoupon: async (code: string, layoutId?: string): Promise<{ valid: boolean, type: string, value: number, message?: string }> => {
    const token = localStorage.getItem('streamtheme_token');
    const res = await fetch(`${API_Base}/payment/check-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ code, layoutId })
    });
    return res.json();
  },

  verifyPayment: async (data: any): Promise<{ status: string, message: string, user?: User }> => {
    const token = localStorage.getItem('streamtheme_token');
    const res = await fetch(`${API_Base}/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // --- PRODUCTS ---
  getProducts: async (): Promise<Product[]> => {
    const res = await fetch(`${API_Base}/products`);
    if (!res.ok) throw new Error("Failed to fetch products");
    return res.json();
  },

  getProduct: async (id: number): Promise<Product> => {
    const res = await fetch(`${API_Base}/products/${id}`);
    if (!res.ok) throw new Error("Product not found");
    return res.json();
  },

  // --- ADMIN ---
  admin: {
    getStats: async (): Promise<AdminStats> => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      const res = await fetch(`${API_Base}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    getUsers: async (): Promise<AdminUser[]> => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      const res = await fetch(`${API_Base}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    deleteUser: async (id: number) => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      await fetch(`${API_Base}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    },
    addUser: async (data: any) => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      const res = await fetch(`${API_Base}/admin/add-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },

    // Coupons
    getCoupons: async () => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      const res = await fetch(`${API_Base}/admin/coupons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    createCoupon: async (data: any) => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      const res = await fetch(`${API_Base}/admin/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    deleteCoupon: async (code: string) => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      const res = await fetch(`${API_Base}/admin/coupons/${code}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    login: async (username: string, password: string): Promise<{ token: string }> => {
      const res = await fetch(`${API_Base}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error("Invalid Credentials");
      return res.json();
    },
    getTransactions: async (): Promise<AdminTransaction[]> => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      const res = await fetch(`${API_Base}/admin/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    updatePassword: async (userId: number, newPassword: string) => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      await fetch(`${API_Base}/admin/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newPassword })
      });
    },
    getUserSubscriptions: async (userId: number) => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      const res = await fetch(`${API_Base}/admin/users/${userId}/subscriptions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    grantSubscription: async (userId: number, layoutId: string, months: number = 1) => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      await fetch(`${API_Base}/admin/users/${userId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ layoutId, months })
      });
    },
    extendSubscription: async (userId: number, subId: number, months: number = 1) => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      await fetch(`${API_Base}/admin/users/${userId}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ subId, months })
      });
    },
    // Layouts
    createLayout: async (data: { id: string, name: string, base_price: number, thumbnail_url?: string }) => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      const res = await fetch(`${API_Base}/admin/layouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create layout");
      }
      return res.json();
    },
    updateLayout: async (id: string, data: { base_price?: number, price_1mo?: number, price_3mo?: number, price_6mo?: number, price_1yr?: number, is_active?: boolean, thumbnail_url?: string }) => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      const res = await fetch(`${API_Base}/admin/layouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update layout");
      }
      return res.json();
    },
    getLayouts: async (): Promise<LayoutItem[]> => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      const res = await fetch(`${API_Base}/admin/layouts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },

    // Support Queries
    getSupportQueries: async (): Promise<SupportQuery[]> => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      const res = await fetch(`${API_Base}/admin/support`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    updateSupportStatus: async (id: number, status: 'PENDING' | 'SOLVED') => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      await fetch(`${API_Base}/admin/support/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
    },
    deleteSupportQuery: async (id: number) => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      await fetch(`${API_Base}/admin/support/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    },

    // Products
    getProducts: async (): Promise<Product[]> => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      const res = await fetch(`${API_Base}/admin/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    createProduct: async (data: Partial<Product>) => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      const res = await fetch(`${API_Base}/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create product");
      }
      return res.json();
    },
    updateProduct: async (id: number, data: Partial<Product>) => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      const res = await fetch(`${API_Base}/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update product");
      }
      return res.json();
    },
    deleteProduct: async (id: number) => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      const res = await fetch(`${API_Base}/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete product");
    },

    // Settings
    getRegistrationSettings: async (): Promise<{ enabled: boolean }> => {
      const res = await fetch(`${API_Base}/settings/registration`);
      return res.json();
    },
    updateRegistrationSettings: async (enabled: boolean) => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      await fetch(`${API_Base}/admin/settings/registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ enabled })
      });
    },

    // User Status
    updateUserStatus: async (id: number, isActive: boolean) => {
      const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
      await fetch(`${API_Base}/admin/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive })
      });
    }
  }
};
