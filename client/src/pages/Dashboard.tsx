
import React, { useEffect, useState } from 'react';
import { User, LayoutItem, DURATION_OPTIONS, Purchase, Product } from '../lib/types';
import { api } from '../lib/api';

import { useNavigate } from 'react-router-dom';
import { Loader2, LogOut, Layout, Clock, ShoppingBag, Home, AlertCircle, CheckCircle, Calendar, Tag, CreditCard, HelpCircle, Package, FileText } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
  onSelectLayout: (layoutId: string) => void;
  onUserUpdate: (user: User) => void;
}

const Dashboard: React.FC<Props> = ({ user: initialUser, onLogout, onSelectLayout, onUserUpdate }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User>(initialUser);
  const [layouts, setLayouts] = useState<LayoutItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'store'>('overview');

  // Purchase Modal State
  const [purchasingLayout, setPurchasingLayout] = useState<LayoutItem | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string>('1mo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<{ valid: boolean, message: string, value: number, type: string } | null>(null);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    const loadData = async () => {
      const [layoutData, productData] = await Promise.all([
        api.getLayouts(),
        api.getProducts()
      ]);
      setLayouts(layoutData);
      setProducts(productData);
      setLoading(false);
    };
    loadData();
  }, []);

  // Reset coupon and cart when modal closes or opens, and reload products
  useEffect(() => {
    if (purchasingLayout) {
      setCouponCode('');
      setCouponStatus(null);
      setSelectedProducts([]);
      // Reload products to get latest from admin
      api.getProducts().then(data => setProducts(data));
    }
  }, [purchasingLayout]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await api.checkCoupon(couponCode, purchasingLayout?.id);
      if (res.valid) {
        setCouponStatus({ valid: true, message: 'Coupon Applied!', value: res.value, type: res.type });
      } else {
        setCouponStatus({ valid: false, message: res.message || 'Invalid Coupon', value: 0, type: '' });
      }
    } catch (err) {
      setCouponStatus({ valid: false, message: 'Error checking coupon', value: 0, type: '' });
    }
  };

  const calculatePrice = () => {
    if (!purchasingLayout) return { total: 0, final: 0, discount: 0 };

    let baseTotal = 0;
    // ensure base_price is number
    const basePrice = parseFloat(purchasingLayout.base_price?.toString() || '0');

    switch (selectedDuration) {
      case '1mo': baseTotal = parseFloat(purchasingLayout.price_1mo?.toString() || '0') || basePrice * 1; break;
      case '3mo': baseTotal = parseFloat(purchasingLayout.price_3mo?.toString() || '0') || basePrice * 2.5; break;
      case '6mo': baseTotal = parseFloat(purchasingLayout.price_6mo?.toString() || '0') || basePrice * 4.5; break;
      case '1yr': baseTotal = parseFloat(purchasingLayout.price_1yr?.toString() || '0') || basePrice * 8; break;
      default: baseTotal = basePrice;
    }

    // Add product prices (ensure numbers)
    const productTotal = selectedProducts.reduce((sum, p) => sum + parseFloat(p.price?.toString() || '0'), 0);
    const grandTotal = baseTotal + productTotal;

    let discount = 0;
    if (couponStatus && couponStatus.valid) {
      if (couponStatus.type === 'PERCENT') {
        discount = grandTotal * (couponStatus.value / 100);
      } else {
        discount = couponStatus.value;
      }
    }
    return { total: grandTotal, final: Math.max(1, grandTotal - discount), discount, productTotal, subscriptionTotal: baseTotal };
  };

  const handlePurchase = async () => {
    if (!purchasingLayout) return;

    setIsProcessing(true);
    try {
      const duration = DURATION_OPTIONS.find(d => d.id === selectedDuration) || DURATION_OPTIONS[0];
      const productIds = selectedProducts.map(p => p.id);

      // 1. Load Razorpay SDK
      const loadRazorpay = () => {
        return new Promise((resolve) => {
          if ((window as any).Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const res = await loadRazorpay();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        setIsProcessing(false);
        return;
      }

      // 2. Create Order on Backend
      const { orderId, amount, currency, keyId, contact, email } = await api.createPaymentOrder(
        purchasingLayout.id,
        duration.months,
        couponStatus?.valid ? couponCode : '',
        user.phone || '9999999999',
        productIds
      );

      // 3. Initialize Razorpay Options
      const options = {
        key: keyId,
        amount: amount.toString(),
        currency: currency,
        name: "Stream Theme Store",
        description: `Purchase ${purchasingLayout.name}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.status === 'SUCCESS') {
              if (verifyRes.user) {
                setUser(verifyRes.user);
                onUserUpdate(verifyRes.user);
              }
              alert('Payment Successful!');
              setPurchasingLayout(null);
            } else {
              alert('Payment Verification Failed!');
            }
          } catch (err) {
            console.error("Verification Error", err);
            alert('Payment Verification Error');
          }
          setIsProcessing(false);
        },
        prefill: {
          name: user.name,
          email: email,
          contact: contact
        },
        theme: {
          color: "#2563eb"
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (error: any) {
      console.error('Payment Init Error:', error);
      alert(`Payment failed: ${error.message || JSON.stringify(error)}`);
      setIsProcessing(false);
    }
  };

  const addProductToCart = (product: Product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const removeProductFromCart = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  // ... Helpers ...

  const getDaysRemaining = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Combine Layout info with User Purchase info
  const myPurchases = user.purchases.map((purchase: Purchase) => {
    const layout = layouts.find(l => l.id === purchase.layoutId);
    const isExpired = new Date(purchase.expiryDate) < new Date();
    const daysLeft = Math.max(0, Math.ceil((new Date(purchase.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
    const name = purchase.layoutName || layout?.name || 'Unknown Layout';
    const thumbnail = layout?.thumbnail_url || purchase.thumbnail_url;
    const transactionId = purchase.orderId || `TXN-${purchase.purchaseDate.slice(0, 10).replace(/-/g, '')}-${purchase.layoutId.slice(0, 3).toUpperCase()}`;

    return {
      ...purchase,
      name,
      thumbnail,
      isExpired,
      daysLeft,
      transactionId
    };
  }).sort((a, b) => (a.isExpired === b.isExpired ? 0 : a.isExpired ? 1 : -1));

  const priceDetails = calculatePrice();

  const getPriceForDuration = (layout: LayoutItem, durationId: string) => {
    switch (durationId) {
      case '1mo': return layout.price_1mo || layout.base_price * 1;
      case '3mo': return layout.price_3mo || layout.base_price * 2.5;
      case '6mo': return layout.price_6mo || layout.base_price * 4.5;
      case '1yr': return layout.price_1yr || layout.base_price * 8;
      default: return layout.base_price;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans relative" >

      {/* --- PURCHASE MODAL --- */}
      {purchasingLayout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-green-500" /> Confirm Purchase
                </h3>
                <p className="text-gray-400 text-sm mt-1">You are purchasing <span className="text-white font-bold">{purchasingLayout.name}</span></p>
              </div>
              <button onClick={() => setPurchasingLayout(null)} className="text-gray-500 hover:text-white transition-colors">
                <LogOut className="w-5 h-5 rotate-45" /> {/* Close Icon */}
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Duration Selection */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Select Duration</label>
                <div className="grid grid-cols-2 gap-3">
                  {DURATION_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedDuration(opt.id)}
                      className={`relative px - 4 py - 3 rounded - lg border text - left transition - all ${selectedDuration === opt.id
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                        : 'bg-zinc-950 border-white/5 text-gray-400 hover:bg-zinc-800'
                        } `}
                    >
                      <div className="text-sm font-bold">{opt.label}</div>
                      <div className="text-xs opacity-70">
                        Total: ₹{Math.round(getPriceForDuration(purchasingLayout, opt.id))}
                      </div>
                      {selectedDuration === opt.id && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coupon Section */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Coupon Code</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Enter Code (e.g. WELCOME10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponStatus && (
                  <div className={`text - xs mt - 2 font - medium flex items - center gap - 1 ${couponStatus.valid ? 'text-green-400' : 'text-red-400'} `}>
                    {couponStatus.valid ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {couponStatus.message}
                  </div>
                )}
              </div>

              {/* Product Selection */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                  <Package className="w-3 h-3" />
                  Add Digital Products (Optional)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {products.filter(p => p.is_active).map(product => {
                    const isInCart = selectedProducts.some(p => p.id === product.id);
                    return (
                      <div key={product.id} className="bg-zinc-900 border border-white/5 rounded-lg p-3 flex items-center justify-between hover:border-blue-500/30 transition-colors">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.description}</div>
                          <div className="text-xs text-blue-400 mt-1">₹{product.price}</div>
                        </div>
                        <button
                          onClick={() => isInCart ? removeProductFromCart(product.id) : addProductToCart(product)}
                          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${isInCart
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                            }`}
                        >
                          {isInCart ? 'Remove' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                  {products.filter(p => p.is_active).length === 0 && (
                    <div className="text-center text-gray-500 text-xs py-4">No products available</div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-black/40 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>₹{priceDetails.total}</span>
                </div>
                {couponStatus?.valid && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>- ₹{priceDetails.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <span className="font-bold text-white">Total To Pay</span>
                  <span className="font-bold text-xl text-white">₹{priceDetails.final.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePurchase}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                {isProcessing ? 'Processing...' : `Pay ₹${priceDetails.final.toFixed(2)} `}
              </button>

            </div>
          </div>
        </div>
      )
      }


      {/* Header / Navbar */}
      < header className="bg-zinc-900 border-b border-white/5 h-16 px-8 flex justify-between items-center sticky top-0 z-50 shadow-md" >
        {/* Left: User Info */}
        < div className="flex items-center gap-4 w-1/4" >
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
            {user.name.charAt(0)}
          </div>
          <div className="hidden md:block">
            <div className="font-bold text-sm">{user.name}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">
              {myPurchases.filter(p => !p.isExpired).length} Active Layouts
            </div>
          </div>
        </div >

        {/* Center: Navigation */}
        < div className="flex items-center bg-black/50 rounded-lg p-1 border border-white/5" >
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-zinc-800 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            <Home className="w-4 h-4" /> My Dashboard
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'store' ? 'bg-blue-600/20 text-blue-400 shadow-sm border border-blue-500/20' : 'text-gray-400 hover:text-white'}`}
          >
            <ShoppingBag className="w-4 h-4" /> Layout Store
          </button>
        </div >

        {/* Right: Actions */}
        < div className="w-1/4 flex justify-end gap-4" >
          <button onClick={() => navigate('/support')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">
            <HelpCircle className="w-4 h-4" /> Support
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div >
      </header >

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* --- VIEW: OVERVIEW (MY DASHBOARD) --- */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in duration-500">
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                <Layout className="w-6 h-6 text-blue-500" /> My Purchases
              </h2>

              {myPurchases.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {myPurchases.map((item, idx) => (
                    <div key={idx} className={`bg-zinc-900 border rounded-xl overflow-hidden transition-all group relative ${item.isExpired ? 'border-red-900/30 opacity-75' : 'border-white/10 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)]'}`}>

                      {/* Status Banner */}
                      {item.isExpired ? (
                        <div className="bg-red-900/80 text-red-200 text-xs font-bold py-2 text-center uppercase tracking-widest flex items-center justify-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Subscription Expired
                        </div>
                      ) : (
                        <div className="bg-green-900/50 text-green-400 text-xs font-bold py-2 text-center uppercase tracking-widest flex items-center justify-center gap-2">
                          <Clock className="w-3 h-3" /> {item.daysLeft} Days Remaining
                        </div>
                      )}

                      <div className={`h - 40 w - full relative overflow - hidden bg - zinc - 800 ${item.isExpired ? 'grayscale' : ''} `}>
                        {item.thumbnail_url ? (
                          <img src={item.thumbnail_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0" style={{ background: item.thumbnail || 'linear-gradient(45deg, #222, #444)' }}></div>
                        )}
                        <div className="absolute inset-0 bg-black/40"></div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-1">{item.name || 'Unknown Layout'}</h3>

                        {/* Purchase Details */}
                        <div className="bg-black/40 rounded-lg p-3 mb-6 text-xs text-gray-400 space-y-1">
                          <div className="flex justify-between">
                            <span>Bought:</span>
                            <span className="text-gray-300">{new Date(item.purchaseDate).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Expires:</span>
                            <span className={item.isExpired ? 'text-red-400' : 'text-blue-300'}>{new Date(item.expiryDate).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-t border-white/10 pt-1 mt-1">
                            <span>Plan:</span>
                            <span className="text-white">{item.durationLabel}</span>
                          </div>
                          <div className="flex justify-between border-t border-white/10 pt-1 mt-1">
                            <span>Price Paid:</span>
                            <span className="text-green-400">₹{item.pricePaid}</span>
                          </div>
                          <div className="flex justify-between border-t border-white/10 pt-1 mt-1">
                            <span>Payment Method:</span>
                            <span className="text-gray-300 uppercase">{item.paymentMethod || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between border-t border-white/10 pt-1 mt-1">
                            <span>Order ID:</span>
                            <span className="font-mono text-[10px] text-gray-500">{item.transactionId}</span>
                          </div>
                        </div>

                        {item.isExpired ? (
                          <button
                            onClick={() => {
                              // Find original layout to re-buy
                              const original = layouts.find(l => l.id === item.layoutId);
                              if (original) setPurchasingLayout(original);
                            }}
                            className="w-full bg-red-600/20 text-red-400 border border-red-600/50 px-4 py-3 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                          >
                            Renew Subscription
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectLayout(item.layoutId)}
                            className="w-full bg-white text-black px-4 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                          >
                            Launch Editor <Layout className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-white/5 border-dashed">
                  <ShoppingBag className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-500">No active subscriptions</h3>
                  <p className="text-gray-600 mb-6">You haven't purchased any layouts yet.</p>
                  <button onClick={() => setActiveTab('store')} className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">Browse Themes</button>
                </div>
              )}
            </div>

            {/* My Downloads Section */}
            {user.productPurchases && user.productPurchases.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                  <FileText className="w-6 h-6 text-green-500" /> My Downloads
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {user.productPurchases.map((purchase) => (
                    <div key={purchase.id} className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden hover:border-green-500/50 transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                      {purchase.thumbnail_url && (
                        <div className="h-32 w-full relative overflow-hidden bg-zinc-800">
                          <img src={purchase.thumbnail_url} alt={purchase.product_name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="text-lg font-bold mb-2">{purchase.product_name}</h3>
                        {purchase.product_description && (
                          <p className="text-xs text-gray-400 mb-3 line-clamp-2">{purchase.product_description}</p>
                        )}
                        <div className="bg-black/40 rounded-lg p-3 mb-4 text-xs text-gray-400 space-y-1">
                          <div className="flex justify-between">
                            <span>Purchased:</span>
                            <span className="text-gray-300">{new Date(purchase.purchased_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Price Paid:</span>
                            <span className="text-green-400 font-bold">₹{purchase.price_paid}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="text-gray-300 uppercase">{purchase.file_type}</span>
                          </div>
                        </div>
                        <a
                          href={purchase.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-green-600/20 text-green-400 border border-green-600/50 px-4 py-3 rounded-lg font-bold hover:bg-green-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                          <Package className="w-4 h-4" /> Download File
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW: STORE (ALL LAYOUTS) --- */}
        {activeTab === 'store' && (
          <div className="animate-in fade-in duration-500">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Theme Store</h1>
              <p className="text-gray-400 max-w-2xl mx-auto">Purchase specific themes for the duration you need.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {layouts.map((layout) => {
                const activePurchase = user.purchases.find(p => p.layoutId === layout.id && getDaysRemaining(p.expiryDate) > 0);

                return (
                  <div key={layout.id} className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden relative transition-all hover:border-blue-500/30">

                    {activePurchase && (
                      <div className="absolute top-4 right-4 z-20 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> OWNED
                      </div>
                    )}

                    <div className="h-56 w-full relative group-hover:scale-105 transition-transform duration-500 bg-zinc-800">
                      {layout.thumbnail_url ? (
                        <img src={layout.thumbnail_url} alt={layout.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{ background: layout.thumbnail || 'linear-gradient(45deg, #222, #444)' }}></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    </div>

                    <div className="p-6 relative z-10">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-white">{layout.name}</h3>
                        <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded border border-green-500/30">
                          PREMIUM
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-6 h-10 line-clamp-2">{layout.description}</p>

                      {activePurchase ? (
                        <button
                          onClick={() => setActiveTab('overview')}
                          className="w-full bg-zinc-800 text-gray-300 border border-white/10 px-4 py-3 rounded-lg font-bold hover:text-white transition-colors text-sm"
                        >
                          Manage in Dashboard
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Tag className="w-3 h-3" /> Starting at <span className="text-white font-bold">₹{layout.price_1mo || layout.base_price}/mo</span>
                          </div>
                          <button
                            onClick={() => setPurchasingLayout(layout)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-green-900/40 text-sm flex items-center justify-center gap-2"
                          >
                            <ShoppingBag className="w-4 h-4" /> Buy Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div >
  );
};

export default Dashboard;
