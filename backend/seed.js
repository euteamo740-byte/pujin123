const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'virtual_sim.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }
    console.log('Database connected');
    seedData();
});

function seedData() {
    const numbers = [
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

    let count = 0;
    numbers.forEach(num => {
        db.run(
            `INSERT OR IGNORE INTO virtual_numbers (number, country, service, price, status) VALUES (?, ?, ?, ?, 'available')`,
            [num.number, num.country, num.service, num.price],
            function(err) {
                if (err) {
                    console.error('Error:', err);
                } else {
                    count++;
                    console.log(`✓ ${num.number} - ${num.service} (Rp${num.price})`);
                }
                
                if (count === numbers.length) {
                    console.log(`\n✓ ${count} nomor berhasil di-seed!`);
                    db.close();
                    process.exit(0);
                }
            }
        );
    });
}
