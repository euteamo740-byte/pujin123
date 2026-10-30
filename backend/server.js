const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const twilio = require('twilio');
const twilioConfig = require('./twilio-config');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For Twilio webhook

// Database setup
const dbPath = path.join(__dirname, 'virtual_sim.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Database connected');
        initDatabase();
    }
});

// Initialize database
function initDatabase() {
    // Tabel nomor virtual
    db.run(`
        CREATE TABLE IF NOT EXISTS virtual_numbers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number TEXT UNIQUE NOT NULL,
            country TEXT,
            service TEXT,
            price INTEGER,
            status TEXT DEFAULT 'available',
            owner TEXT,
            purchased_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creating virtual_numbers table:', err);
    });

    // Tabel user
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            balance INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creating users table:', err);
    });

    // Tabel OTP/SMS
    db.run(`
        CREATE TABLE IF NOT EXISTS sms_inbox (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number TEXT NOT NULL,
            sender TEXT,
            message TEXT,
            code TEXT,
            received_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(number) REFERENCES virtual_numbers(number)
        )
    `, (err) => {
        if (err) console.error('Error creating sms_inbox table:', err);
    });

    // Tabel transaction
    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            number TEXT NOT NULL,
            amount INTEGER,
            status TEXT DEFAULT 'completed',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creating transactions table:', err);
    });

    // Don't seed automatically - data sudah ada
    console.log('Database tables initialized');
}

// Seed dummy data
function seedDummyData() {
    const dummyNumbers = [
        { number: '+6281234567890', country: 'Indonesia', service: 'WhatsApp', price: 2200 },
        { number: '+6281234567891', country: 'Indonesia', service: 'WhatsApp', price: 2200 },
        { number: '+6281234567892', country: 'Indonesia', service: 'WhatsApp', price: 2200 },
        { number: '+6281234567893', country: 'Indonesia', service: 'WhatsApp', price: 2200 },
        { number: '+6281234567894', country: 'Indonesia', service: 'WhatsApp', price: 2200 },
        { number: '+6281234567895', country: 'Indonesia', service: 'Telegram', price: 1300 },
        { number: '+6281234567896', country: 'Indonesia', service: 'Telegram', price: 1300 },
        { number: '+6281234567897', country: 'Indonesia', service: 'Shopee', price: 650 },
        { number: '+6281234567898', country: 'Indonesia', service: 'Shopee', price: 650 },
        { number: '+6281234567899', country: 'Indonesia', service: 'WhatsApp', price: 2200 },
    ];

    dummyNumbers.forEach(num => {
        db.run(
            `INSERT OR IGNORE INTO virtual_numbers (number, country, service, price) VALUES (?, ?, ?, ?)`,
            [num.number, num.country, num.service, num.price],
            (err) => {
                if (err) console.error('Error inserting:', err);
            }
        );
    });
}

// Routes

// 1. Get available numbers (untuk dashboard)
app.get('/api/numbers/available', (req, res) => {
    db.all(
        `SELECT * FROM virtual_numbers WHERE status = 'available' LIMIT 20`,
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// 2. Get numbers by service
app.get('/api/numbers/by-service/:service', (req, res) => {
    const { service } = req.params;
    db.all(
        `SELECT * FROM virtual_numbers WHERE service = ? AND status = 'available'`,
        [service],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// 3. Get user's numbers
app.get('/api/user/:username/numbers', (req, res) => {
    const { username } = req.params;
    db.all(
        `SELECT * FROM virtual_numbers WHERE owner = ?`,
        [username],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// 4. Buy number
app.post('/api/numbers/buy', (req, res) => {
    const { username, number } = req.body;

    if (!username || !number) {
        res.status(400).json({ error: 'Username dan number diperlukan' });
        return;
    }

    // Check apakah number available
    db.get(
        `SELECT * FROM virtual_numbers WHERE number = ? AND status = 'available'`,
        [number],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (!row) {
                res.status(404).json({ error: 'Nomor tidak tersedia' });
                return;
            }

            // Update status & owner
            db.run(
                `UPDATE virtual_numbers SET status = 'owned', owner = ?, purchased_at = datetime('now') WHERE number = ?`,
                [username, number],
                function(err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }

                    // Add transaction record
                    db.run(
                        `INSERT INTO transactions (username, number, amount) VALUES (?, ?, ?)`,
                        [username, number, row.price],
                        (err) => {
                            if (err) {
                                res.status(500).json({ error: err.message });
                                return;
                            }

                            res.json({ 
                                success: true, 
                                message: 'Nomor berhasil dibeli!',
                                number: row
                            });
                        }
                    );
                }
            );
        }
    );
});

// 5. Get SMS/OTP inbox untuk nomor
app.get('/api/numbers/:number/inbox', (req, res) => {
    const { number } = req.params;
    db.all(
        `SELECT * FROM sms_inbox WHERE number = ? ORDER BY received_at DESC`,
        [number],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// 6. Simulate OTP/SMS receive (untuk testing)
app.post('/api/numbers/:number/simulate-otp', (req, res) => {
    const { number } = req.params;
    const { sender, message, code } = req.body;

    db.run(
        `INSERT INTO sms_inbox (number, sender, message, code) VALUES (?, ?, ?, ?)`,
        [number, sender || 'WhatsApp', message || 'Your verification code is: ' + code, code],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ 
                success: true, 
                message: 'OTP berhasil dikirim!',
                code: code
            });
        }
    );
});

// 6b. Twilio webhook - receive SMS from Twilio
app.post('/api/webhooks/twilio/sms', (req, res, next) => {
    const twilioClient = twilio(twilioConfig.accountSid, twilioConfig.authToken);
    
    // Validate webhook (from Twilio)
    const twilioSignature = req.headers['x-twilio-signature'];
    const url = req.protocol + '://' + req.get('host') + req.originalUrl;
    const params = req.body;

    if (!twilioClient.validateRequest(twilioConfig.authToken, twilioSignature, url, params)) {
        console.error('Invalid Twilio webhook');
        return res.status(403).send('Invalid request');
    }

    const fromNumber = params.From; // Sender
    const toNumber = params.To; // Our virtual number
    const messageBody = params.Body;
    const code = extractOTP(messageBody);

    // Save to database
    db.run(
        `INSERT INTO sms_inbox (number, sender, message, code) VALUES (?, ?, ?, ?)`,
        [toNumber, fromNumber, messageBody, code],
        function(err) {
            if (err) {
                console.error('Error saving SMS:', err);
            } else {
                console.log(`✓ SMS received: ${toNumber} from ${fromNumber}: ${messageBody}`);
            }
        }
    );

    // Return TwiML response
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('');
    res.type('text/xml');
    res.send(twiml.toString());
});

// 9. Search available Twilio numbers
app.get('/api/twilio/numbers/available', async (req, res) => {
    try {
        const twilioService = require('./twilio-service');
        const numbers = await twilioService.searchAvailableNumbers('ID', 'SMS');
        res.json(numbers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 10. Buy Twilio number via web
app.post('/api/twilio/numbers/buy', async (req, res) => {
    const { username, phoneNumber } = req.body;
    
    if (!username || !phoneNumber) {
        res.status(400).json({ error: 'Username dan nomor diperlukan' });
        return;
    }

    try {
        const twilioService = require('./twilio-service');
        
        // Buy number from Twilio
        const result = await twilioService.buyVirtualNumberFromTwilio(phoneNumber);
        
        // Save to database
        db.run(
            `INSERT INTO virtual_numbers (number, country, service, price, status, owner, purchased_at) VALUES (?, ?, ?, ?, 'owned', ?, datetime('now'))`,
            [result.number, 'Indonesia', 'WhatsApp', 2200, username],
            function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                // Add transaction
                db.run(
                    `INSERT INTO transactions (username, number, amount) VALUES (?, ?, ?)`,
                    [username, result.number, 2200],
                    (err) => {
                        if (err) {
                            console.error('Error inserting transaction:', err);
                        }
                    }
                );

                res.json({
                    success: true,
                    message: 'Nomor berhasil dibeli!',
                    number: result.number
                });
            }
        );

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper: Extract OTP code
function extractOTP(messageBody) {
    const match = messageBody.match(/\b(\d{4,8})\b/);
    return match ? match[1] : null;
}

// 7. Get user balance
app.get('/api/user/:username/balance', (req, res) => {
    const { username } = req.params;
    db.get(
        `SELECT balance FROM users WHERE username = ?`,
        [username],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (!row) {
                res.json({ balance: 0 });
            } else {
                res.json({ balance: row.balance || 0 });
            }
        }
    );
});

// 8. Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Backend server running', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n✓ Backend server running on http://localhost:${PORT}`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET  /api/numbers/available`);
    console.log(`  GET  /api/numbers/by-service/:service`);
    console.log(`  GET  /api/user/:username/numbers`);
    console.log(`  POST /api/numbers/buy`);
    console.log(`  GET  /api/numbers/:number/inbox`);
    console.log(`  POST /api/numbers/:number/simulate-otp`);
    console.log(`  POST /api/webhooks/twilio/sms`);
    console.log(`  GET  /api/user/:username/balance`);
    console.log(`  GET  /api/health`);
    console.log(`\nTwilio Integration:`);
    console.log(`  Webhook: /api/webhooks/twilio/sms`);
    console.log(`  Status: Ready (configure credentials in twilio-config.js)\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) console.error(err);
        console.log('\nDatabase closed');
        process.exit(0);
    });
});
