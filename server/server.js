require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./config/db');

const jwt = require('jsonwebtoken');
const verifyToken = require('./middleware/authMiddleware');

const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());

// Rate Limiting
app.set('trust proxy', 1);
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true
}));

// --- DB INITIALIZATION (Migration Logic) ---
async function initDb() {
    console.log("Checking Database Schema...");
    try {
        // 1. Settings Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS settings (
                key_name VARCHAR(50) PRIMARY KEY,
                value VARCHAR(255) NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 2. Default Registration Setting
        await db.query(`
            INSERT IGNORE INTO settings (key_name, value) VALUES ('registration_enabled', 'true')
        `);

        // 3. Add 'is_active' to users table if missing
        try {
            await db.query(`ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE`);
            console.log("✓ Added 'is_active' column.");
        } catch (err) {
            if (err.code !== 'ER_DUP_FIELDNAME') console.error("Column check error:", err);
        }

        console.log("✓ Database Schema Verified.");
    } catch (err) {
        console.error("DB Init Failed:", err);
    }
}

// Call on startup
initDb();

// --- ROUTES ---

// 21. GET LAYOUTS (Public)
app.get('/api/layouts', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, name, description, base_price, price_1mo, price_3mo, price_6mo, price_1yr, thumbnail_url FROM layouts WHERE is_active = TRUE");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUBLIC: Submit Support Query
app.post('/api/support', async (req, res) => {
    const { name, email, subject, message } = req.body;
    try {
        await db.query(
            "INSERT INTO support_queries (name, email, subject, message) VALUES (?, ?, ?, ?)",
            [name, email, subject, message]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. REGISTER
app.post('/api/auth/register', async (req, res) => {
    // 1. Check Registration Setting
    try {
        const [rows] = await db.query("SELECT value FROM settings WHERE key_name = 'registration_enabled'");
        if (rows.length > 0 && rows[0].value === 'false') {
            return res.status(403).json({ error: 'New user registration is currently disabled.' });
        }
    } catch (err) {
        console.error("Settings check failed:", err);
    }

    const { name, email, password, phone, age } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    // Gmail Check
    if (!email.toLowerCase().endsWith('@gmail.com')) {
        return res.status(400).json({ error: 'Registration Restricted: Only @gmail.com accounts are allowed.' });
    }

    // Password Length Check
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    try {
        // Check Duplicate
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, password_hash, phone_number, age) VALUES (?, ?, ?, ?, ?)',
            [name, email, hash, phone, age]
        );

        const newUser = { id: result.insertId.toString(), name, email, phone, age, purchases: [] };

        // Generate Token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ ...newUser, token });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        // Check if Active
        if (user.is_active === 0 || user.is_active === false) {
            return res.status(403).json({ error: 'Account Deactivated. Please contact support.' });
        }

        // Get Subscription Purchases
        const [subs] = await db.query(
            `SELECT s.layout_id, s.start_date, s.expiry_date, s.price_paid, s.public_token, s.saved_theme_config, s.order_id, s.payment_method,
                    l.name as layout_name, l.thumbnail_url 
             FROM subscriptions s 
             JOIN layouts l ON s.layout_id = l.id 
             WHERE s.user_id = ?`,
            [user.id]
        );

        // Get Product Purchases
        const [productPurchases] = await db.query(
            `SELECT pp.id, pp.product_id, pp.price_paid, pp.order_id, pp.purchased_at,
                    p.name as product_name, p.description as product_description, p.file_url, p.file_type, p.thumbnail_url
             FROM product_purchases pp
             JOIN products p ON pp.product_id = p.id
             WHERE pp.user_id = ?
             ORDER BY pp.purchased_at DESC`,
            [user.id]
        );

        // Format Subscription Purchases
        const formattedPurchases = subs.map(s => ({
            layoutId: s.layout_id,
            purchaseDate: s.start_date,
            expiryDate: s.expiry_date,
            durationLabel: 'Custom', // Simplified for now
            pricePaid: s.price_paid,
            publicToken: s.public_token,
            savedThemeConfig: s.saved_theme_config,
            thumbnail_url: s.thumbnail_url,
            layoutName: s.layout_name,
            orderId: s.order_id,
            paymentMethod: s.payment_method
        }));

        // Format Product Purchases
        const formattedProductPurchases = productPurchases.map(pp => ({
            id: pp.id,
            product_id: pp.product_id,
            product_name: pp.product_name,
            product_description: pp.product_description,
            price_paid: pp.price_paid,
            order_id: pp.order_id,
            purchased_at: pp.purchased_at,
            file_url: pp.file_url,
            file_type: pp.file_type,
            thumbnail_url: pp.thumbnail_url
        }));

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            id: user.id.toString(),
            name: user.full_name,
            email: user.email,
            phone: user.phone_number,
            age: user.age,
            purchases: formattedPurchases,
            productPurchases: formattedProductPurchases,
            token
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. PURCHASE
app.post('/api/purchases', verifyToken, async (req, res) => {
    // userId from token is safer than body, but for now strict match check or just use token
    const { userId, layoutId, durationLabel, months, price } = req.body;

    if (req.user.id !== userId && req.user.id !== parseInt(userId)) {
        return res.status(403).json({ error: 'User ID mismatch' });
    }

    // Simple Public Token Generation
    const publicToken = require('crypto').randomUUID();

    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);

    try {
        await db.query(
            `INSERT INTO subscriptions (user_id, layout_id, start_date, expiry_date, price_paid, public_token) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, layoutId, now, expiry, price, publicToken]
        );

        // Return updated user object (simplified)
        // In a real app we might just return the new purchase, but our frontend expects the full user
        // so let's just re-fetch the user details logic or let frontend handle it.
        // For now, let's return the simplified purchase object
        res.json({
            layoutId,
            purchaseDate: now.toISOString(),
            expiryDate: expiry.toISOString(),
            durationLabel,
            pricePaid: price,
            publicToken
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. SAVE THEME CONFIG
app.post('/api/purchases/config', verifyToken, async (req, res) => {
    const { layoutId, config, userId } = req.body; // userId needed for safety
    try {
        await db.query(
            'UPDATE subscriptions SET saved_theme_config = ? WHERE user_id = ? AND layout_id = ?',
            [JSON.stringify(config), userId, layoutId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. PUBLIC OBS VIEW (With Session Lock)
app.get('/api/public/:token', async (req, res) => {
    const { token } = req.params;
    const { sessionId } = req.query; // Client must send a unique ID (UUID)

    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

    try {
        const [rows] = await db.query(
            `SELECT * FROM subscriptions WHERE public_token = ?`,
            [token]
        );

        if (rows.length === 0) return res.status(404).json({ error: 'Invalid Token' });

        const sub = rows[0];
        const now = new Date();
        const isExpired = new Date(sub.expiry_date) < now;

        // --- LOCKING LOGIC ---
        // Lock Duration: 30 Seconds. If heartbeat older than 30s, lock is considered free.
        const LOCK_TIMEOUT_MS = 30000;
        const lastHeartbeat = new Date(sub.last_heartbeat || 0);
        const timeSinceHeartbeat = now - lastHeartbeat;
        const isLockFree = !sub.active_session_id || timeSinceHeartbeat > LOCK_TIMEOUT_MS;

        // If locked by someone else effectively
        if (!isLockFree && sub.active_session_id !== sessionId) {
            return res.status(409).json({
                error: 'Session Active on another device',
                message: 'This overlay is currently open on another computer. Please close it there to view it here.'
            });
        }

        // If free or owned by us, update lock (Heartbeat)
        if (isLockFree || sub.active_session_id === sessionId) {
            await db.query(
                `UPDATE subscriptions SET active_session_id = ?, last_heartbeat = NOW() WHERE id = ?`,
                [sessionId, sub.id]
            );
        }

        res.json({
            layoutId: sub.layout_id,
            config: sub.saved_theme_config,
            isExpired
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6b. HEARTBEAT (Keep Session Alive)
app.post('/api/public/heartbeat', async (req, res) => {
    const { token, sessionId } = req.body;
    try {
        // Only update if we still own the lock
        const [result] = await db.query(
            `UPDATE subscriptions SET last_heartbeat = NOW() 
             WHERE public_token = ? AND active_session_id = ?`,
            [token, sessionId]
        );

        if (result.affectedRows === 0) {
            // This means either token invalid OR we lost the lock
            return res.status(409).json({ error: 'Lock lost or stolen' });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PAYMENT ROUTES (Cashfree) ---
// --- PAYMENT ROUTES (Razorpay) ---
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// 6.5 CHECK COUPON
app.post('/api/payment/check-coupon', verifyToken, async (req, res) => {
    const { code, layoutId } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM coupons WHERE code = ?', [code]);
        if (rows.length === 0) return res.status(200).json({ valid: false, message: 'Invalid code' });

        const coupon = rows[0];
        // Check Product Restriction
        if (coupon.layout_id && coupon.layout_id !== layoutId) {
            return res.status(200).json({ valid: false, message: "Coupon not valid for this product" });
        }

        // Check Expiry
        if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
            return res.status(400).json({ valid: false, message: 'Coupon expired' });
        }
        // Check Limit
        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
            return res.status(400).json({ valid: false, message: 'Coupon usage limit reached' });
        }

        res.json({ valid: true, type: coupon.discount_type, value: coupon.discount_value });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. CREATE PAYMENT ORDER (With Server-Side Pricing)
app.post('/api/payment/create-order', verifyToken, async (req, res) => {
    const { layoutId, months, couponCode, customerPhone, productIds } = req.body; // productIds: array of product IDs
    const userId = req.user.id;
    const userEmail = req.user.email;

    try {
        let amount = 0;

        // 1. Calculate Subscription Price (if layoutId provided)
        if (layoutId) {
            const [lRows] = await db.query('SELECT price_1mo, price_3mo, price_6mo, price_1yr, base_price FROM layouts WHERE id = ?', [layoutId]);
            if (lRows.length === 0) return res.status(404).json({ error: 'Layout not found' });

            const layout = lRows[0];

            // 2. Select correct price based on duration
            switch (months) {
                case 1: amount = parseFloat(layout.price_1mo || layout.base_price * 1); break;
                case 3: amount = parseFloat(layout.price_3mo || layout.base_price * 2.5); break;
                case 6: amount = parseFloat(layout.price_6mo || layout.base_price * 4.5); break;
                case 12: amount = parseFloat(layout.price_1yr || layout.base_price * 8); break;
                default: amount = parseFloat(layout.base_price);
            }
        }

        // 2. Add Product Prices (if productIds provided)
        if (productIds && productIds.length > 0) {
            const [products] = await db.query('SELECT id, price FROM products WHERE id IN (?) AND is_active = TRUE', [productIds]);
            if (products.length !== productIds.length) {
                return res.status(400).json({ error: 'Some products are invalid or inactive' });
            }

            const productTotal = products.reduce((sum, p) => sum + parseFloat(p.price), 0);
            amount += productTotal;
        }

        // 3. Apply Coupon to Total
        if (couponCode) {
            const [cRows] = await db.query('SELECT * FROM coupons WHERE code = ?', [couponCode]);
            if (cRows.length > 0) {
                const coupon = cRows[0];
                // Validate again silently
                const isValid = (!coupon.expiry_date || new Date(coupon.expiry_date) > new Date()) &&
                    (!coupon.usage_limit || coupon.usage_count < coupon.usage_limit);

                if (isValid) {
                    if (coupon.discount_type === 'PERCENT') {
                        amount = amount - (amount * (coupon.discount_value / 100));
                    } else {
                        amount = amount - coupon.discount_value;
                    }
                    if (amount < 1) amount = 1; // Floor price
                }
            }
        }

        // Round to 2 decimals
        amount = Math.round(amount * 100) / 100;

        const receiptId = `ORDER_${Date.now()}_${userId}`;

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects paise
            currency: "INR",
            receipt: receiptId,
            notes: {
                userId: userId.toString(),
                phone: customerPhone || "",
                email: userEmail
            }
        };

        const order = await razorpay.orders.create(options);

        // API Response:
        // { id: "order_...", entity: "order", amount: 100, ... }

        // Log pending transaction
        // Storing Razorpay Order ID in 'payment_session_id' column for mapping
        await db.query(
            `INSERT INTO transactions (order_id, user_id, layout_id, amount, status, payment_session_id, metadata) 
             VALUES (?, ?, ?, ?, 'PENDING', ?, ?)`,
            [receiptId, userId, layoutId || null, amount, order.id, JSON.stringify({ productIds: productIds || [], months: months || 0 })]
        );

        res.json({
            orderId: order.id, // Razorpay Order ID
            amount: amount,
            currency: "INR",
            keyId: process.env.RAZORPAY_KEY_ID,
            contact: customerPhone,
            email: userEmail
        });

    } catch (err) {
        console.error("Razorpay Error:", err);
        res.status(500).json({ error: err.message, details: err });
    }
});

// 8. VERIFY PAYMENT (Called by Frontend after success)
app.post('/api/payment/verify', verifyToken, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    try {
        // 1. Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = require('crypto')
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ status: 'FAILED', message: 'Invalid Signature' });
        }

        // 2. Fetch Payment Details to get Method (Optional but good for records)
        let paymentMethod = 'Razorpay';
        try {
            const paymentConfig = await razorpay.payments.fetch(razorpay_payment_id);
            paymentMethod = paymentConfig.method || 'Razorpay';
        } catch (e) {
            console.warn("Could not fetch payment details:", e.message);
        }

        // 3. Find Transaction (using connection to 'payment_session_id' which stores razorpay_order_id)
        const [rows] = await db.query('SELECT * FROM transactions WHERE payment_session_id = ?', [razorpay_order_id]);
        const transaction = rows[0];

        if (transaction) {
            const orderId = transaction.order_id; // Internal Order ID

            // IDEMPOTENCY CHECK
            const [updateResult] = await db.query(
                `UPDATE transactions SET status = 'SUCCESS' WHERE order_id = ? AND status = 'PENDING'`,
                [orderId]
            );

            if (updateResult.affectedRows > 0) {
                const now = new Date();

                // Parse metadata
                const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : {};
                const productIds = metadata.productIds || [];
                const months = metadata.months || 1;

                // 1. Activate Subscription (if layout_id exists)
                if (transaction.layout_id) {
                    const expiry = new Date();
                    expiry.setMonth(expiry.getMonth() + months);
                    const publicToken = require('crypto').randomUUID();

                    await db.query(
                        `INSERT INTO subscriptions (user_id, layout_id, start_date, expiry_date, price_paid, public_token, order_id, payment_method) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [transaction.user_id, transaction.layout_id, now, expiry, transaction.amount, publicToken, orderId, paymentMethod]
                    );
                }

                // 2. Save Product Purchases
                if (productIds.length > 0) {
                    const [products] = await db.query('SELECT id, price FROM products WHERE id IN (?)', [productIds]);

                    for (const product of products) {
                        await db.query(
                            `INSERT INTO product_purchases (user_id, product_id, price_paid, order_id, purchased_at)
                             VALUES (?, ?, ?, ?, ?)`,
                            [transaction.user_id, product.id, product.price, orderId, now]
                        );
                    }
                }
            }

            // FETCH UPDATED USER FOR FRONTEND
            const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [transaction.user_id]);
            const user = userRows[0];

            // Fetch subscription purchases
            const [subs] = await db.query(
                `SELECT s.layout_id, s.start_date, s.expiry_date, s.price_paid, s.public_token, s.saved_theme_config, s.order_id, s.payment_method,
                        l.name as layout_name, l.thumbnail_url 
                 FROM subscriptions s 
                 JOIN layouts l ON s.layout_id = l.id 
                 WHERE s.user_id = ?`,
                [user.id]
            );

            // Fetch product purchases
            const [productPurchases] = await db.query(
                `SELECT pp.id, pp.product_id, pp.price_paid, pp.order_id, pp.purchased_at,
                        p.name as product_name, p.description as product_description, p.file_url, p.file_type, p.thumbnail_url
                 FROM product_purchases pp
                 JOIN products p ON pp.product_id = p.id
                 WHERE pp.user_id = ?
                 ORDER BY pp.purchased_at DESC`,
                [user.id]
            );

            const formattedPurchases = subs.map(s => ({
                layoutId: s.layout_id,
                purchaseDate: s.start_date,
                expiryDate: s.expiry_date,
                durationLabel: 'Custom',
                pricePaid: s.price_paid,
                publicToken: s.public_token,
                savedThemeConfig: s.saved_theme_config,
                thumbnail_url: s.thumbnail_url,
                layoutName: s.layout_name,
                orderId: s.order_id,
                paymentMethod: s.payment_method
            }));

            const formattedProductPurchases = productPurchases.map(pp => ({
                id: pp.id,
                product_id: pp.product_id,
                product_name: pp.product_name,
                product_description: pp.product_description,
                price_paid: pp.price_paid,
                order_id: pp.order_id,
                purchased_at: pp.purchased_at,
                file_url: pp.file_url,
                file_type: pp.file_type,
                thumbnail_url: pp.thumbnail_url
            }));

            const finalUser = {
                id: user.id.toString(),
                name: user.full_name,
                email: user.email,
                phone: user.phone_number,
                age: user.age,
                purchases: formattedPurchases,
                productPurchases: formattedProductPurchases
            };

            return res.json({ status: 'SUCCESS', message: 'Payment Verified', user: finalUser });
        }

        res.status(404).json({ status: 'FAILED', message: 'Transaction not found or mismatch' });

    } catch (err) {
        console.error("Razorpay Verify Error:", err);
        res.status(500).json({ error: "Verification failed: " + err.message });
    }
});


// --- ADMIN ROUTES ---

// 9. ADMIN STATS
// 9. ADMIN STATS
app.get('/api/admin/stats', verifyToken, async (req, res) => {
    try {
        const [userRows] = await db.query('SELECT COUNT(*) as count FROM users');
        const [subRows] = await db.query('SELECT COUNT(*) as count FROM subscriptions WHERE expiry_date > NOW()');
        const [revRows] = await db.query('SELECT SUM(price_paid) as total FROM subscriptions');
        const [recentUsers] = await db.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 5');

        res.json({
            totalUsers: userRows[0].count,
            activeSubs: subRows[0].count,
            totalRevenue: revRows[0].total || 0,
            recentUsers
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 10. ADMIN USERS LIST
// 10. ADMIN USERS LIST
app.get('/api/admin/users', verifyToken, async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT 
                u.id, u.full_name, u.email, u.phone_number, u.age, u.password_hash, u.created_at, u.is_active,
                (SELECT COUNT(*) FROM subscriptions s WHERE s.user_id = u.id) as purchase_count,
                (SELECT SUM(price_paid) FROM subscriptions s WHERE s.user_id = u.id) as total_spent
            FROM users u
            ORDER BY u.created_at DESC
        `);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11. ADMIN DELETE USER
// 11. ADMIN DELETE USER
app.delete('/api/admin/users/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM subscriptions WHERE user_id = ?', [id]);
        await db.query('DELETE FROM transactions WHERE user_id = ?', [id]);
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 12. ADMIN ADD USER
// 12. ADMIN ADD USER
app.post('/api/admin/users', verifyToken, async (req, res) => {
    const { name, email, password, phone, age } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, password_hash, phone_number, age) VALUES (?, ?, ?, ?, ?)',
            [name, email, hash, phone, age]
        );
        res.json({ id: result.insertId, message: 'User created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 13. ADMIN TRANSACTIONS
// 13. ADMIN TRANSACTIONS
app.get('/api/admin/transactions', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT t.order_id, t.amount, t.status, t.created_at, u.full_name as user_name, u.email as user_email 
            FROM transactions t
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 14. ADMIN LOGIN
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        const admin = rows[0];

        const match = await bcrypt.compare(password, admin.password_hash);

        if (match) {
            const token = jwt.sign({ role: 'admin', id: admin.id }, process.env.JWT_SECRET, { expiresIn: '12h' });
            res.json({ token });
        } else {
            res.status(401).json({ error: 'Invalid admin credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 15. ADMIN: UPDATE PASSWORD
// 15. ADMIN: UPDATE PASSWORD
app.put('/api/admin/users/:id/password', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    try {
        const hash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 16. ADMIN: GET USER SUBSCRIPTIONS
// 16. ADMIN: GET USER SUBSCRIPTIONS
app.get('/api/admin/users/:id/subscriptions', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [subs] = await db.query('SELECT * FROM subscriptions WHERE user_id = ?', [id]);
        res.json(subs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 17. ADMIN: GRANT SUBSCRIPTION (FREE)
// 17. ADMIN: GRANT SUBSCRIPTION (FREE)
app.post('/api/admin/users/:id/subscription', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { layoutId, months } = req.body; // months defaults to 1 if not sent
    try {
        const startDate = new Date();
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + (months || 1));

        await db.query(
            `INSERT INTO subscriptions (user_id, layout_id, start_date, expiry_date, price_paid, public_token) 
             VALUES (?, ?, ?, ?, ?, UUID())`,
            [id, layoutId, startDate, expiryDate, 0]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 18. ADMIN: EXTEND SUBSCRIPTION
app.put('/api/admin/users/:id/subscription', async (req, res) => {
    const { id } = req.params;
    const { subId, months } = req.body;
    try {
        await db.query(
            `UPDATE subscriptions SET expiry_date = DATE_ADD(expiry_date, INTERVAL ? MONTH) WHERE id = ? AND user_id = ?`,
            [months || 1, subId, id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 19. ADMIN: GET COUPONS
app.get('/api/admin/coupons', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, l.name as layout_name 
            FROM coupons c 
            LEFT JOIN layouts l ON c.layout_id = l.id 
            ORDER BY c.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 20. ADMIN: CREATE COUPON
app.post('/api/admin/coupons', verifyToken, async (req, res) => {
    const { code, discount_type, discount_value, description, layout_id } = req.body;
    try {
        await db.query(
            `INSERT INTO coupons (code, discount_type, discount_value, description, layout_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [code, discount_type, discount_value, description, layout_id || null]
        );
        res.json({ success: true, message: 'Coupon created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 21. ADMIN: DELETE COUPON
app.delete('/api/admin/coupons/:code', verifyToken, async (req, res) => {
    const { code } = req.params;
    try {
        await db.query('DELETE FROM coupons WHERE code = ?', [code]);
        res.json({ success: true, message: 'Coupon deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 22. SETTINGS ROUTES (Admin)
app.get('/api/settings/registration', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT value FROM settings WHERE key_name = 'registration_enabled'");
        const enabled = rows.length > 0 ? rows[0].value === 'true' : true;
        res.json({ enabled });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/settings/registration', verifyToken, async (req, res) => {
    const { enabled } = req.body;
    try {
        await db.query(`
            INSERT INTO settings (key_name, value) VALUES ('registration_enabled', ?)
            ON DUPLICATE KEY UPDATE value = ?
        `, [enabled.toString(), enabled.toString()]);
        res.json({ success: true, enabled });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 23. ADMIN UPDATE USER STATUS (Ban/Unban)
app.put('/api/admin/users/:id/status', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    try {
        await db.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive, id]);
        res.json({ success: true, isActive });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 22a. ADMIN: GET ALL LAYOUTS
app.get('/api/admin/layouts', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM layouts ORDER BY id");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 22. ADMIN: UPDATE LAYOUT
app.put('/api/admin/layouts/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { base_price, price_1mo, price_3mo, price_6mo, price_1yr, is_active, thumbnail_url } = req.body;

    // Build dynamic query
    let fields = [];
    let values = [];

    if (base_price !== undefined) {
        fields.push("base_price = ?");
        values.push(base_price);
    }
    // New Price Columns
    if (price_1mo !== undefined) { fields.push("price_1mo = ?"); values.push(price_1mo); }
    if (price_3mo !== undefined) { fields.push("price_3mo = ?"); values.push(price_3mo); }
    if (price_6mo !== undefined) { fields.push("price_6mo = ?"); values.push(price_6mo); }
    if (price_1yr !== undefined) { fields.push("price_1yr = ?"); values.push(price_1yr); }

    if (is_active !== undefined) {
        fields.push("is_active = ?");
        values.push(is_active ? 1 : 0); // Force to integer 1/0
    }

    if (thumbnail_url !== undefined) {
        fields.push("thumbnail_url = ?");
        values.push(thumbnail_url);
    }

    if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(id);

    try {
        const sql = `UPDATE layouts SET ${fields.join(', ')} WHERE id = ?`;
        await db.query(sql, values);
        res.json({ success: true, message: 'Layout updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 23. ADMIN: CREATE LAYOUT
app.post('/api/admin/layouts', verifyToken, async (req, res) => {
    const { id, name, base_price, price_1mo, price_3mo, price_6mo, price_1yr, thumbnail_url } = req.body;

    if (!id || !name || base_price === undefined) {
        return res.status(400).json({ error: "Missing required fields (id, name, base_price)" });
    }

    // Default other prices if not provided (fallback logic)
    const p1 = price_1mo || base_price * 1;
    const p3 = price_3mo || base_price * 2.5;
    const p6 = price_6mo || base_price * 4.5;
    const p12 = price_1yr || base_price * 8;

    try {
        await db.query(
            `INSERT INTO layouts (id, name, base_price, price_1mo, price_3mo, price_6mo, price_1yr, thumbnail_url, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [id, name, base_price, p1, p3, p6, p12, thumbnail_url || null]
        );
        res.json({ success: true, message: 'Layout created' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Layout ID already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});


// 19. ADMIN: MANAGE SUPPORT QUERIES
// Get all queries
app.get('/api/admin/support', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM support_queries ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Status
app.put('/api/admin/support/:id/status', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.query("UPDATE support_queries SET status = ? WHERE id = ?", [status, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Support Query
app.delete('/api/admin/support/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM support_queries WHERE id = ?", [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ==========================================
// PRODUCT ENDPOINTS
// ==========================================

// PUBLIC: Get All Active Products
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM products WHERE is_active = TRUE ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUBLIC: Get Single Product
app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query("SELECT * FROM products WHERE id = ? AND is_active = TRUE", [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN: Get All Products (including inactive)
app.get('/api/admin/products', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM products ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN: Create Product
app.post('/api/admin/products', verifyToken, async (req, res) => {
    const { name, description, price, file_url, file_type, thumbnail_url, is_active } = req.body;

    if (!name || !file_url || price === undefined) {
        return res.status(400).json({ error: 'Missing required fields (name, file_url, price)' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO products (name, description, price, file_url, file_type, thumbnail_url, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, description || null, price, file_url, file_type || null, thumbnail_url || null, is_active !== false]
        );
        res.json({ success: true, id: result.insertId, message: 'Product created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN: Update Product
app.put('/api/admin/products/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { name, description, price, file_url, file_type, thumbnail_url, is_active } = req.body;

    let fields = [];
    let values = [];

    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (description !== undefined) { fields.push("description = ?"); values.push(description); }
    if (price !== undefined) { fields.push("price = ?"); values.push(price); }
    if (file_url !== undefined) { fields.push("file_url = ?"); values.push(file_url); }
    if (file_type !== undefined) { fields.push("file_type = ?"); values.push(file_type); }
    if (thumbnail_url !== undefined) { fields.push("thumbnail_url = ?"); values.push(thumbnail_url); }
    if (is_active !== undefined) { fields.push("is_active = ?"); values.push(is_active ? 1 : 0); }

    if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(id);

    try {
        const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
        await db.query(sql, values);
        res.json({ success: true, message: 'Product updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN: Delete Product
app.delete('/api/admin/products/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
