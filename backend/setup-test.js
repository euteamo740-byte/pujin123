const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'virtual_sim.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }
    setupTestAccount();
});

function setupTestAccount() {
    // Data akun test
    const testAccounts = [
        { username: 'testuser3', password: '1234', balance: 50000 },
    ];

    testAccounts.forEach(acc => {
        db.run(
            `INSERT OR REPLACE INTO users (username, password, balance, created_at) VALUES (?, ?, ?, datetime('now'))`,
            [acc.username, acc.password, acc.balance],
            function(err) {
                if (err) {
                    console.error('Error:', err);
                } else {
                    console.log(`✓ Akun dibuat: ${acc.username}`);
                    console.log(`  Password: ${acc.password}`);
                    console.log(`  Saldo: Rp${acc.balance.toLocaleString('id-ID')}`);
                }
            }
        );
    });

    setTimeout(() => {
        db.close();
        console.log('\n✓ Setup selesai!');
        process.exit(0);
    }, 1000);
}
