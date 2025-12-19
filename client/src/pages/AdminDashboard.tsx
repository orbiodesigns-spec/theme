import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { AdminStats, AdminUser, AdminTransaction, SupportQuery, Product } from '../lib/types';
import { Users, DollarSign, Activity, Trash2, UserPlus, Search, LogOut, LayoutDashboard, Settings, FileText, Key, Shield, Tag, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'finance' | 'coupons' | 'themes' | 'products' | 'queries'>('dashboard');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
    const [coupons, setCoupons] = useState<any[]>([]); // New Coupons State
    const [selectedProduct, setSelectedProduct] = useState<any>(null); // For edit/create
    const [registrationEnabled, setRegistrationEnabled] = useState(true); // NEW STATE
    const [layouts, setLayouts] = useState<any[]>([]); // To select for coupons

    // Support Queries State
    const [supportQueries, setSupportQueries] = useState<SupportQuery[]>([]);

    // Products State
    const [products, setProducts] = useState<Product[]>([]);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [newProduct, setNewProduct] = useState({ name: '', description: '', price: 0, file_url: '', file_type: 'pdf', thumbnail_url: '', is_active: true });

    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Coupon Form
    const [showAddCoupon, setShowAddCoupon] = useState(false);
    const [newCoupon, setNewCoupon] = useState({ code: '', discount_type: 'PERCENT', discount_value: 0, description: '', layout_id: '' });

    // Theme Form
    const [showAddTheme, setShowAddTheme] = useState(false);
    const [newTheme, setNewTheme] = useState({ id: '', name: '', base_price: 20, thumbnail_url: '' });
    const [editingTheme, setEditingTheme] = useState<any | null>(null);

    // Modals & Selection
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showAccessModal, setShowAccessModal] = useState(false);
    const [userSubs, setUserSubs] = useState<any[]>([]); // For Access Modal

    // Form Stats
    const [newPassword, setNewPassword] = useState('');
    const [accessLayout, setAccessLayout] = useState('');
    const [grantDuration, setGrantDuration] = useState(1);

    // Form State for Add User
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', phone: '', age: 18 });

    useEffect(() => {
        const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token');
        if (!token) {
            navigate('/admin-login');
            return;
        }
        loadData();
    }, [navigate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, usersData, txData, couponsData, layoutsData, queriesData, productsData, settingsData] = await Promise.all([
                api.admin.getStats(),
                api.admin.getUsers(),
                api.admin.getTransactions(),
                api.admin.getCoupons(),
                api.admin.getLayouts(),
                api.admin.getSupportQueries(),
                api.admin.getProducts(),
                api.admin.getRegistrationSettings() // Fetch Settings
            ]);
            setStats(statsData);
            setUsers(usersData);
            setTransactions(txData);
            setCoupons(couponsData);
            setLayouts(layoutsData);
            setSupportQueries(queriesData);
            setProducts(productsData);
            if (settingsData) setRegistrationEnabled(settingsData.enabled);
        } catch (error) {
            console.error("Failed to load admin data", error);
            // If API failed (likely 401), clear tokens and redirect
            localStorage.removeItem('orbio_admin_token');
            sessionStorage.removeItem('orbio_admin_token');
            navigate('/admin-login');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.admin.createCoupon(newCoupon);
            setShowAddCoupon(false);
            setNewCoupon({ code: '', discount_type: 'PERCENT', discount_value: 0, description: '', layout_id: '' });
            loadData();
            alert("Coupon created!");
        } catch (err) { alert("Failed to create coupon"); }
    };

    const handleDeleteCoupon = async (code: string) => {
        if (confirm('Delete this coupon?')) {
            await api.admin.deleteCoupon(code);
            loadData();
        }
    };

    // --- ACTIONS ---
    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !newPassword) return;
        try {
            await api.admin.updatePassword(selectedUser.id, newPassword);
            alert("Password updated successfully!");
            setShowPasswordModal(false);
            setNewPassword('');
        } catch (err) {
            alert("Failed to update password");
        }
    };

    const openAccessModal = async (user: AdminUser) => {
        setSelectedUser(user);
        setAccessLayout('');
        setGrantDuration(1);
        setShowAccessModal(true);
        // Load Subs
        const subs = await api.admin.getUserSubscriptions(user.id);
        setUserSubs(subs);
    };

    const handleGrant = async () => {
        if (!selectedUser || !accessLayout) return;
        try {
            await api.admin.grantSubscription(selectedUser.id, accessLayout, grantDuration); // Dynamic Duration
            const subs = await api.admin.getUserSubscriptions(selectedUser.id);
            setUserSubs(subs); // Refresh list
            alert("Access granted!");
        } catch (err) {
            alert("Failed to grant access");
        }
    };

    const handleExtend = async (subId: number) => {
        if (!selectedUser) return;
        try {
            await api.admin.extendSubscription(selectedUser.id, subId, 1); // +1 Month
            const subs = await api.admin.getUserSubscriptions(selectedUser.id);
            setUserSubs(subs);
            alert("Extended by 1 month!");
        } catch (err) {
            alert("Failed to extend");
        }
    };




    // --- QUERY ACTIONS ---
    const handleStatusUpdate = async (id: number, status: 'PENDING' | 'SOLVED') => {
        try {
            await api.admin.updateSupportStatus(id, status);
            const queries = await api.admin.getSupportQueries();
            setSupportQueries(queries);
        } catch (err) { alert("Failed to update status"); }
    };

    const handleDeleteQuery = async (id: number) => {
        if (confirm("Delete this query?")) {
            await api.admin.deleteSupportQuery(id);
            const queries = await api.admin.getSupportQueries();
            setSupportQueries(queries);
        }
    };


    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            await api.admin.deleteUser(id);
            loadData();
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.admin.addUser(newUser);
            setShowAddModal(false);
            setNewUser({ name: '', email: '', password: '', phone: '', age: 18 });
            loadData();
            alert("User added successfully");
        } catch (error) {
            alert("Failed to add user");
        }
    };

    const handleAddTheme = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.admin.createLayout(newTheme);
            setShowAddTheme(false);
            setNewTheme({ id: '', name: '', base_price: 20, thumbnail_url: '' });
            loadData();
            alert("Theme created!");
        } catch (err) { alert("Failed to add theme"); }
    };

    const handleUpdateTheme = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTheme) return;
        try {
            await api.admin.updateLayout(editingTheme.id, {
                base_price: editingTheme.price_1mo ? parseFloat(editingTheme.price_1mo) : parseFloat(editingTheme.base_price),
                price_1mo: editingTheme.price_1mo ? parseFloat(editingTheme.price_1mo) : undefined,
                price_3mo: editingTheme.price_3mo ? parseFloat(editingTheme.price_3mo) : undefined,
                price_6mo: editingTheme.price_6mo ? parseFloat(editingTheme.price_6mo) : undefined,
                price_1yr: editingTheme.price_1yr ? parseFloat(editingTheme.price_1yr) : undefined,
                is_active: editingTheme.is_active,
                thumbnail_url: editingTheme.thumbnail_url || null
            });
            setEditingTheme(null);
            loadData();
            alert("Theme updated!");
        } catch (err) { alert("Failed to update theme"); }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.admin.createProduct(newProduct);
            setShowAddProduct(false);
            setNewProduct({ name: '', description: '', price: 0, file_url: '', file_type: 'pdf', thumbnail_url: '', is_active: true });
            loadData();
            alert("Product created!");
        } catch (err) { alert("Failed to add product"); }
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        try {
            await api.admin.updateProduct(editingProduct.id, editingProduct);
            setEditingProduct(null);
            loadData();
            alert("Product updated!");
        } catch (err) { alert("Failed to update product"); }
    };

    const handleDeleteProduct = async (id: number) => {
        if (confirm('Delete this product?')) {
            try {
                await api.admin.deleteProduct(id);
                loadData();
            } catch (err) { alert("Failed to delete product"); }
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.phone_number.includes(search)
    );

    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
                    <span className="font-bold text-lg tracking-tight">Admin Panel</span>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Users className="w-5 h-5" /> User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('finance')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'finance' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <DollarSign className="w-5 h-5" /> Finance
                    </button>
                    <button
                        onClick={() => setActiveTab('coupons')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'coupons' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Tag className="w-5 h-5" /> Coupons
                    </button>
                    <button
                        onClick={() => setActiveTab('themes')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'themes' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" /> Themes
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'products' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <FileText className="w-5 h-5" /> Products
                    </button>
                    <button
                        onClick={() => setActiveTab('queries')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'queries' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <MessageSquare className="w-5 h-5" /> Support Queries
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Settings className="w-5 h-5" /> Settings
                    </button>
                </nav>
                <div className="p-4 border-t border-gray-100">
                    <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                        <LogOut className="w-5 h-5" /> Exit Admin
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">
                        {activeTab === 'dashboard' ? 'Dashboard Overview' :
                            activeTab === 'users' ? 'User Management' :
                                activeTab === 'settings' ? 'Global Settings' :
                                    activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </h1>
                    <div className="text-sm text-gray-500">Welcome back, Admin</div>
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div className="bg-white border border-gray-200 p-6 rounded-xl flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">New User Registration</h3>
                                    <p className="text-gray-500 text-sm">Enable or disable new users from creating accounts.</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            await api.admin.updateRegistrationSettings(!registrationEnabled);
                                            setRegistrationEnabled(!registrationEnabled);
                                            alert(`Registration ${!registrationEnabled ? 'Enabled' : 'Disabled'}`);
                                        } catch (e) { alert("Failed to update"); }
                                    }}
                                    className={`w-14 h-7 rounded-full transition-colors relative ${registrationEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow ${registrationEnabled ? 'left-8' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'dashboard' && stats && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="p-4 bg-blue-100 text-blue-600 rounded-xl">
                                        <Users className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Total Subscribers</p>
                                        <h3 className="text-3xl font-bold">{stats.totalUsers}</h3>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="p-4 bg-green-100 text-green-600 rounded-xl">
                                        <DollarSign className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Total Sales</p>
                                        <h3 className="text-3xl font-bold">₹{stats.totalRevenue.toLocaleString()}</h3>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="p-4 bg-amber-100 text-amber-600 rounded-xl">
                                        <Activity className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Active Subscriptions</p>
                                        <h3 className="text-3xl font-bold">{stats.activeSubs}</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold mb-4">Recent Registrations</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-gray-500 text-sm">
                                                <th className="pb-3 font-medium">Name</th>
                                                <th className="pb-3 font-medium">Email</th>
                                                <th className="pb-3 font-medium">Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {stats.recentUsers.map((u: any) => (
                                                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                                    <td className="py-3 font-medium">{u.full_name}</td>
                                                    <td className="py-3 text-gray-600">{u.email}</td>
                                                    <td className="py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                                <div className="relative w-96">
                                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, or phone..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    <UserPlus className="w-4 h-4" /> Add User
                                </button>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">User Info</th>
                                            <th className="px-6 py-4 font-semibold">Security (Hash)</th>
                                            <th className="px-6 py-4 font-semibold">Activity</th>
                                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {filteredUsers.map(user => (
                                            <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{user.full_name}</div>
                                                    <div className="text-gray-500">{user.email}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{user.phone_number} • Age: {user.age}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-mono text-xs text-gray-400 truncate w-32 bg-gray-100 p-1 rounded" title={user.password_hash}>
                                                        {user.password_hash.substring(0, 10)}...
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2 mb-1">
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                                            {user.purchase_count} Orders
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                            Avg Val: ₹{user.purchase_count > 0 ? Math.round(user.total_spent / user.purchase_count) : 0}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                            {user.is_active ? 'Active' : 'Banned'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Total: ₹{user.total_spent || 0}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    <button
                                                        onClick={() => { setSelectedUser(user); setShowPasswordModal(true); }}
                                                        className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors"
                                                        title="Change Password">
                                                        <Key className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openAccessModal(user)}
                                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                        title="Manage Access">
                                                        <Shield className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm(`Are you sure you want to ${user.is_active ? 'BAN' : 'ACTIVATE'} this user?`)) {
                                                                await api.admin.updateUserStatus(user.id, !user.is_active);
                                                                loadData();
                                                            }
                                                        }}
                                                        className={`p-2 rounded-lg transition-colors ${user.is_active ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                                                        title={user.is_active ? "Ban User" : "Activate User"}
                                                    >
                                                        <Shield className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredUsers.length === 0 && (
                                    <div className="p-8 text-center text-gray-500">No users found match your search.</div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'finance' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold mb-4">Transaction History</h2>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Order ID</th>
                                            <th className="px-6 py-4 font-semibold">User</th>
                                            <th className="px-6 py-4 font-semibold">Amount</th>
                                            <th className="px-6 py-4 font-semibold">Date</th>
                                            <th className="px-6 py-4 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {transactions.map(tx => (
                                            <tr key={tx.order_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-mono text-gray-500 text-xs">{tx.order_id}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{tx.user_name || 'Unknown'}</div>
                                                    <div className="text-gray-500 text-xs">{tx.user_email}</div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-900">₹{tx.amount}</td>
                                                <td className="px-6 py-4 text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${tx.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {transactions.length === 0 && <div className="p-8 text-center text-gray-500">No transactions found.</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'coupons' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                                <h2 className="text-xl font-bold">Coupon Management</h2>
                                <button
                                    onClick={() => setShowAddCoupon(true)}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                                    <Tag className="w-4 h-4" /> Add Coupon
                                </button>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Code</th>
                                            <th className="px-6 py-4 font-semibold">Discount</th>
                                            <th className="px-6 py-4 font-semibold">Description</th>
                                            <th className="px-6 py-4 font-semibold">Layout</th>
                                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {coupons.map(coupon => (
                                            <tr key={coupon.code} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-blue-600 font-bold">{coupon.code}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-green-600">
                                                        {coupon.discount_type === 'PERCENT' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{coupon.description || 'No description'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                                        {coupon.layout_name || 'All Layouts'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteCoupon(coupon.code)}
                                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {coupons.length === 0 && (
                                    <div className="p-8 text-center text-gray-500">No coupons created yet.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'themes' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                                <h2 className="text-xl font-bold">Theme Management</h2>
                                <button
                                    onClick={() => setShowAddTheme(true)}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                                    <LayoutDashboard className="w-4 h-4" /> Add Theme
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {layouts.map(layout => (
                                    <div key={layout.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                                        <div className="h-40 bg-gray-100 relative">
                                            {layout.thumbnail_url ?
                                                <img src={layout.thumbnail_url} alt={layout.name} className="w-full h-full object-cover" /> :
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">No Preview</div>
                                            }
                                            <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold bg-white/90 backdrop-blur">
                                                {layout.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </div>
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <h3 className="font-bold text-lg mb-1">{layout.name}</h3>
                                            <p className="text-sm text-gray-500 font-mono mb-4">ID: {layout.id}</p>
                                            <div className="space-y-1 mb-4 text-sm text-gray-600">
                                                <div className="flex justify-between"><span>1 Month:</span> <span className="font-bold">₹{layout.price_1mo || layout.base_price * 1}</span></div>
                                                <div className="flex justify-between"><span>3 Months:</span> <span className="font-bold">₹{layout.price_3mo || layout.base_price * 2.5}</span></div>
                                                <div className="flex justify-between"><span>6 Months:</span> <span className="font-bold">₹{layout.price_6mo || layout.base_price * 4.5}</span></div>
                                                <div className="flex justify-between"><span>1 Year:</span> <span className="font-bold">₹{layout.price_1yr || layout.base_price * 8}</span></div>
                                            </div>
                                            <div className="mt-auto flex justify-between items-center">
                                                <span className="text-xl font-bold text-blue-600">₹{layout.base_price}</span>
                                                <button
                                                    onClick={() => setEditingTheme(layout)}
                                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition">
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'queries' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold mb-4">Support Queries</h2>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Status</th>
                                            <th className="px-6 py-4 font-semibold">Subject</th>
                                            <th className="px-6 py-4 font-semibold">User Details</th>
                                            <th className="px-6 py-4 font-semibold">Message</th>
                                            <th className="px-6 py-4 font-semibold">Date</th>
                                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {supportQueries.map(q => (
                                            <tr key={q.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleStatusUpdate(q.id, q.status === 'PENDING' ? 'SOLVED' : 'PENDING')}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold border ${q.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-green-100 text-green-700 border-green-200'} hover:opacity-80 transition-opacity`}
                                                    >
                                                        {q.status}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{q.subject}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-800">{q.name}</div>
                                                    <div className="text-xs text-gray-500">{q.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs text-gray-600 truncate" title={q.message}>
                                                        {q.message}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 text-xs">
                                                    {new Date(q.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteQuery(q.id)}
                                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                        title="Delete Query"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {supportQueries.length === 0 && (
                                    <div className="p-8 text-center text-gray-500">No support queries found.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                                <h2 className="text-xl font-bold">Product Management</h2>
                                <button
                                    onClick={() => setShowAddProduct(true)}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                                    <FileText className="w-4 h-4" /> Add Product
                                </button>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Product</th>
                                            <th className="px-6 py-4 font-semibold">Price</th>
                                            <th className="px-6 py-4 font-semibold">File Link</th>
                                            <th className="px-6 py-4 font-semibold">Type</th>
                                            <th className="px-6 py-4 font-semibold">Status</th>
                                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {products.map(product => (
                                            <tr key={product.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{product.name}</div>
                                                    <div className="text-xs text-gray-500">{product.description || 'No description'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-green-600">₹{product.price}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <a href={product.file_url} target="_blank" rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline text-xs truncate max-w-xs block">
                                                        {product.file_url.substring(0, 40)}...
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium uppercase">
                                                        {product.file_type || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {product.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditingProduct(product)}
                                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                        title="Edit Product">
                                                        <Settings className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product.id)}
                                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                        title="Delete Product">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {products.length === 0 && (
                                    <div className="p-8 text-center text-gray-500">No products created yet.</div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* PASSWORD MODAL */}
            {showPasswordModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">Change Password for {selectedUser.full_name}</h3>
                        <form onSubmit={handlePasswordUpdate}>
                            <input
                                type="text"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full border p-3 rounded-xl mb-4"
                                required
                            />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ACCESS MODAL */}
            {showAccessModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">Manage Access: {selectedUser.full_name}</h3>

                        <div className="mb-6">
                            <h4 className="font-semibold text-sm text-gray-500 mb-2 uppercase">Grant New Access (Free)</h4>
                            <div className="flex flex-col gap-3">
                                <select
                                    value={accessLayout}
                                    onChange={e => setAccessLayout(e.target.value)}
                                    className="border p-2 rounded-lg w-full"
                                >
                                    <option value="">Select Layout</option>
                                    {layouts.map(l => (
                                        <option key={l.id} value={l.id}>{l.name} ({l.is_active ? 'Active' : 'Inactive'})</option>
                                    ))}
                                </select>

                                <div className="flex gap-2">
                                    <select
                                        value={grantDuration}
                                        onChange={e => setGrantDuration(parseInt(e.target.value))}
                                        className="border p-2 rounded-lg flex-1"
                                    >
                                        <option value={1}>1 Month</option>
                                        <option value={3}>3 Months</option>
                                        <option value={6}>6 Months</option>
                                        <option value={12}>1 Year</option>
                                    </select>
                                    <button
                                        onClick={handleGrant}
                                        disabled={!accessLayout}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                                    >
                                        Grant Access
                                    </button>
                                </div>
                            </div>
                        </div>

                        <h4 className="font-semibold text-sm text-gray-500 mb-2 uppercase">Active Subscriptions</h4>
                        <div className="space-y-3">
                            {userSubs.length === 0 ? <p className="text-gray-400 text-sm">No active subscriptions.</p> : userSubs.map(sub => (
                                <div key={sub.id} className="border p-3 rounded-xl flex justify-between items-center bg-gray-50">
                                    <div>
                                        <div className="font-bold text-gray-800">{sub.layout_id}</div>
                                        <div className="text-xs text-gray-500">Expires: {new Date(sub.expiry_date).toLocaleDateString()}</div>
                                    </div>
                                    <button onClick={() => handleExtend(sub.id)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200">
                                        +1 Month
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setShowAccessModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Close</button>
                        </div>
                    </div>
                </div>
            )}


            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New User manually</h2>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <input required className="w-full border p-2 rounded-lg" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input required type="email" className="w-full border p-2 rounded-lg" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Password</label>
                                <input required type="password" className="w-full border p-2 rounded-lg" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone</label>
                                    <input required className="w-full border p-2 rounded-lg" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Age</label>
                                    <input required type="number" className="w-full border p-2 rounded-lg" value={newUser.age} onChange={e => setNewUser({ ...newUser, age: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Coupon Modal */}
            {showAddCoupon && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New Coupon</h2>
                        <form onSubmit={handleAddCoupon} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Coupon Code</label>
                                <input required className="w-full border p-2 rounded-lg uppercase" value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} placeholder="e.g. WELCOME10" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Discount Type</label>
                                <select className="w-full border p-2 rounded-lg" value={newCoupon.discount_type} onChange={e => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}>
                                    <option value="PERCENT">Percentage</option>
                                    <option value="FIXED">Fixed Amount</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Discount Value</label>
                                <input required type="number" min="0" step="0.01" className="w-full border p-2 rounded-lg" value={newCoupon.discount_value} onChange={e => setNewCoupon({ ...newCoupon, discount_value: parseFloat(e.target.value) })} placeholder={newCoupon.discount_type === 'PERCENT' ? '10' : '100'} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <input className="w-full border p-2 rounded-lg" value={newCoupon.description} onChange={e => setNewCoupon({ ...newCoupon, description: e.target.value })} placeholder="Optional description" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Applicable Layout (Optional)</label>
                                <select className="w-full border p-2 rounded-lg" value={newCoupon.layout_id} onChange={e => setNewCoupon({ ...newCoupon, layout_id: e.target.value })}>
                                    <option value="">All Layouts</option>
                                    {layouts.map(l => (<option key={l.id} value={l.id}>{l.name}</option>))}
                                </select>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowAddCoupon(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Coupon</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Theme Modal */}
            {showAddTheme && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Add New Theme</h2>
                        <form onSubmit={handleAddTheme} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Theme ID (Slug)</label>
                                <input required className="w-full border p-2 rounded-lg" value={newTheme.id} onChange={e => setNewTheme({ ...newTheme, id: e.target.value })} placeholder="e.g. cyber-punk" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Display Name</label>
                                <input required className="w-full border p-2 rounded-lg" value={newTheme.name} onChange={e => setNewTheme({ ...newTheme, name: e.target.value })} placeholder="e.g. Cyber Punk" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">1 Month Price</label>
                                    <input required type="number" className="w-full border p-2 rounded-lg" value={newTheme.price_1mo || ''} onChange={e => setNewTheme({ ...newTheme, price_1mo: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">3 Months Price</label>
                                    <input required type="number" className="w-full border p-2 rounded-lg" value={newTheme.price_3mo || ''} onChange={e => setNewTheme({ ...newTheme, price_3mo: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">6 Months Price</label>
                                    <input required type="number" className="w-full border p-2 rounded-lg" value={newTheme.price_6mo || ''} onChange={e => setNewTheme({ ...newTheme, price_6mo: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">1 Year Price</label>
                                    <input required type="number" className="w-full border p-2 rounded-lg" value={newTheme.price_1yr || ''} onChange={e => setNewTheme({ ...newTheme, price_1yr: parseFloat(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Values for Base Price (Internal)</label>
                                <input type="number" className="w-full border p-2 rounded-lg bg-gray-100" value={newTheme.base_price} readOnly />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Thumbnail URL</label>
                                <input className="w-full border p-2 rounded-lg" value={newTheme.thumbnail_url} onChange={e => setNewTheme({ ...newTheme, thumbnail_url: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowAddTheme(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Theme Modal */}
            {editingTheme && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Edit Theme: {editingTheme.name}</h2>
                        <form onSubmit={handleUpdateTheme} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">1 Month Price</label>
                                    <input required type="number" className="w-full border p-2 rounded-lg" value={editingTheme.price_1mo ?? editingTheme.base_price * 1} onChange={e => setEditingTheme({ ...editingTheme, price_1mo: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">3 Months Price</label>
                                    <input required type="number" className="w-full border p-2 rounded-lg" value={editingTheme.price_3mo ?? editingTheme.base_price * 2.5} onChange={e => setEditingTheme({ ...editingTheme, price_3mo: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">6 Months Price</label>
                                    <input required type="number" className="w-full border p-2 rounded-lg" value={editingTheme.price_6mo ?? editingTheme.base_price * 4.5} onChange={e => setEditingTheme({ ...editingTheme, price_6mo: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">1 Year Price</label>
                                    <input required type="number" className="w-full border p-2 rounded-lg" value={editingTheme.price_1yr ?? editingTheme.base_price * 8} onChange={e => setEditingTheme({ ...editingTheme, price_1yr: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Thumbnail URL</label>
                                <input type="text" className="w-full border p-2 rounded-lg" value={editingTheme.thumbnail_url || ''} onChange={e => setEditingTheme({ ...editingTheme, thumbnail_url: e.target.value })} placeholder="https://example.com/image.jpg" />
                                <p className="text-xs text-gray-500 mt-1">Enter a URL for the theme preview image</p>
                                {editingTheme.thumbnail_url && (
                                    <div className="mt-3 border rounded-lg overflow-hidden">
                                        <img src={editingTheme.thumbnail_url} alt="Thumbnail Preview" className="w-full h-32 object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="isActive" checked={!!editingTheme.is_active} onChange={e => setEditingTheme({ ...editingTheme, is_active: e.target.checked })} className="w-5 h-5 rounded" />
                                <label htmlFor="isActive" className="text-sm font-medium">Active (Visible to users)</label>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setEditingTheme(null)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Product Modal */}
            {showAddProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Add New Product</h2>
                        <form onSubmit={handleAddProduct} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Product Name *</label>
                                <input required className="w-full border p-2 rounded-lg" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="e.g. Premium Graphics Pack" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea className="w-full border p-2 rounded-lg" rows={3} value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Brief description of the product" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                                <input required type="number" min="0" step="0.01" className="w-full border p-2 rounded-lg" value={newProduct.price || ''} onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })} placeholder="200" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">File URL (External Link) *</label>
                                <input required type="url" className="w-full border p-2 rounded-lg" value={newProduct.file_url} onChange={e => setNewProduct({ ...newProduct, file_url: e.target.value })} placeholder="https://drive.google.com/file/d/..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">File Type</label>
                                <select className="w-full border p-2 rounded-lg" value={newProduct.file_type} onChange={e => setNewProduct({ ...newProduct, file_type: e.target.value })}>
                                    <option value="pdf">PDF</option>
                                    <option value="mp4">MP4 (Video)</option>
                                    <option value="zip">ZIP</option>
                                    <option value="png">PNG (Image)</option>
                                    <option value="jpg">JPG (Image)</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Thumbnail URL (Optional)</label>
                                <input type="url" className="w-full border p-2 rounded-lg" value={newProduct.thumbnail_url} onChange={e => setNewProduct({ ...newProduct, thumbnail_url: e.target.value })} placeholder="https://example.com/thumb.jpg" />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="is_active" checked={newProduct.is_active} onChange={e => setNewProduct({ ...newProduct, is_active: e.target.checked })} className="w-4 h-4" />
                                <label htmlFor="is_active" className="text-sm font-medium">Active (visible to users)</label>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowAddProduct(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Edit Product</h2>
                        <form onSubmit={handleUpdateProduct} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Product Name *</label>
                                <input required className="w-full border p-2 rounded-lg" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea className="w-full border p-2 rounded-lg" rows={3} value={editingProduct.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                                <input required type="number" min="0" step="0.01" className="w-full border p-2 rounded-lg" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">File URL (External Link) *</label>
                                <input required type="url" className="w-full border p-2 rounded-lg" value={editingProduct.file_url} onChange={e => setEditingProduct({ ...editingProduct, file_url: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">File Type</label>
                                <select className="w-full border p-2 rounded-lg" value={editingProduct.file_type} onChange={e => setEditingProduct({ ...editingProduct, file_type: e.target.value })}>
                                    <option value="pdf">PDF</option>
                                    <option value="mp4">MP4 (Video)</option>
                                    <option value="zip">ZIP</option>
                                    <option value="png">PNG (Image)</option>
                                    <option value="jpg">JPG (Image)</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Thumbnail URL (Optional)</label>
                                <input type="url" className="w-full border p-2 rounded-lg" value={editingProduct.thumbnail_url || ''} onChange={e => setEditingProduct({ ...editingProduct, thumbnail_url: e.target.value })} />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="edit_is_active" checked={!!editingProduct.is_active} onChange={e => setEditingProduct({ ...editingProduct, is_active: e.target.checked })} className="w-4 h-4" />
                                <label htmlFor="edit_is_active" className="text-sm font-medium">Active (visible to users)</label>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
