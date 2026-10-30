// Nomor DANA penjual
const DANA_SELLER = '082171659342';
const API_URL = 'http://localhost:3001/api';

// Init saat page load
document.addEventListener('DOMContentLoaded', function() {
    checkLogin();
    fetchAvailableNumbers();
    renderServicePopuler();
    renderAnnouncements();
    displayBalance();
    updateCounts();
});

function checkLogin() {
    const currentUser = localStorage.getItem('currentUser');
    const userDisplay = document.getElementById('userDisplay');

    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    userDisplay.textContent = `👤 ${currentUser}`;
    document.getElementById('profile-username').textContent = currentUser;
}

function displayBalance() {
    const currentUser = localStorage.getItem('currentUser');
    
    fetch(`${API_URL}/user/${currentUser}/balance`)
        .then(res => res.json())
        .then(data => {
            const balance = data.balance || 0;
            document.getElementById('balance').textContent = balance.toLocaleString('id-ID');
            document.getElementById('profile-balance').textContent = 'Rp' + balance.toLocaleString('id-ID');
            
            const users = JSON.parse(localStorage.getItem('users')) || {};
            users[currentUser] = users[currentUser] || {};
            users[currentUser].balance = balance;
            localStorage.setItem('users', JSON.stringify(users));
        })
        .catch(err => {
            console.error('Error fetching balance:', err);
            const users = JSON.parse(localStorage.getItem('users')) || {};
            const balance = users[currentUser]?.balance || 0;
            document.getElementById('balance').textContent = balance.toLocaleString('id-ID');
        });
}

function goToTopup() {
    window.location.href = 'topup.html';
}

function fetchAvailableNumbers() {
    // Try Twilio first, fallback to local DB
    fetch(`${API_URL}/twilio/numbers/available`)
        .then(res => res.json())
        .then(data => {
            if (data && data.length > 0) {
                renderTrendingNumbers(data);
            } else {
                // Fallback to local DB
                fetch(`${API_URL}/numbers/available`)
                    .then(res => res.json())
                    .then(data => renderTrendingNumbers(data));
            }
        })
        .catch(err => {
            console.error('Error fetching Twilio numbers:', err);
            // Fallback to local DB
            fetch(`${API_URL}/numbers/available`)
                .then(res => res.json())
                .then(data => renderTrendingNumbers(data));
        });
}

function renderTrendingNumbers(numbers) {
    const container = document.getElementById('trendingNumbers');
    container.innerHTML = '';

    if (!numbers || numbers.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">Nomor tidak tersedia saat ini</p>';
        return;
    }

    numbers.forEach(num => {
        const card = document.createElement('div');
        card.className = 'number-card';
        card.innerHTML = `
            <div class="number-card-country">${num.country}</div>
            <div class="number-card-service">${num.service}</div>
            <div class="number-card-number">${num.number}</div>
            <div class="number-card-price">Rp${num.price.toLocaleString('id-ID')}</div>
            <button class="btn-add-cart" onclick="buyNumber('${num.number}', ${num.price})">
                Beli Nomor
            </button>
        `;
        container.appendChild(card);
    });
}

function renderServicePopuler() {
    const services = [
        { name: 'WhatsApp', icon: 'https://img.icons8.com/color/96/000000/whatsapp.png', service: 'WhatsApp' },
        { name: 'Telegram', icon: 'https://img.icons8.com/color/96/000000/telegram.png', service: 'Telegram' },
        { name: 'Instagram', icon: 'https://img.icons8.com/color/96/000000/instagram-new.png', service: 'Instagram' },
        { name: 'TikTok', icon: 'https://img.icons8.com/color/96/000000/tiktok.png', service: 'TikTok' },
        { name: 'Shopee', icon: 'https://img.icons8.com/color/96/000000/shopee.png', service: 'Shopee' },
        { name: 'Tokopedia', icon: 'https://img.icons8.com/color/96/000000/tokopedia.png', service: 'Tokopedia' }
    ];

    const container = document.getElementById('servicePopuler');
    container.innerHTML = '';

    services.forEach(svc => {
        const tile = document.createElement('div');
        tile.className = 'service-tile';
        tile.onclick = () => filterByService(svc.service);
        tile.innerHTML = `
            <img src="${svc.icon}" alt="${svc.name}" class="service-logo" style="width: 50px; height: 50px; object-fit: contain; margin-bottom: 8px;">
            <p>${svc.name}</p>
        `;
        container.appendChild(tile);
    });
}

function filterByService(service) {
    fetch(`${API_URL}/numbers/by-service/${service}`)
        .then(res => res.json())
        .then(data => {
            const modal = document.createElement('div');
            modal.className = 'service-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                width: 90%;
            `;

            let html = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">Nomor ${service} Indonesia</h2>
                    <button onclick="this.closest('.service-modal').remove()" style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">✕</button>
                </div>
            `;

            if (!data || data.length === 0) {
                html += '<p style="text-align: center; color: #999;">Nomor tidak tersedia</p>';
            } else {
                data.forEach(num => {
                    html += `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 10px;">
                            <div>
                                <p style="margin: 0; font-weight: 600;">${num.number}</p>
                                <small style="color: #999;">Rp${num.price.toLocaleString('id-ID')}</small>
                            </div>
                            <button onclick="buyNumber('${num.number}', ${num.price}); this.closest('.service-modal').remove();" style="background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">Beli</button>
                        </div>
                    `;
                });
            }

            content.innerHTML = html;
            modal.appendChild(content);
            modal.onclick = (e) => {
                if (e.target === modal) modal.remove();
            };
            document.body.appendChild(modal);
        })
        .catch(err => {
            console.error('Error:', err);
            alert('Gagal memuat nomor');
        });
}

function renderAnnouncements() {
    const announcementData = [
        { title: 'Metode Pembayaran', content: 'Kami menerima transfer DANA dan QRIS' },
        { title: 'Status Stok', content: 'Nomor Indonesia tersedia dalam jumlah banyak. Update stok real-time' },
        { title: 'Program Reseller', content: 'Dapatkan diskon khusus hingga 40% untuk pembelian dalam jumlah besar' },
        { title: 'Garansi', content: 'Semua nomor dijamin aktif atau uang kembali 100%' },
    ];

    const container = document.getElementById('announcements');
    container.innerHTML = '';

    announcementData.forEach((ann, index) => {
        const item = document.createElement('div');
        item.className = 'announcement-item';
        item.innerHTML = `
            <div class="announcement-title" onclick="toggleAnnouncement(this)">
                ► ${ann.title}
            </div>
            <div class="announcement-content">${ann.content}</div>
        `;
        container.appendChild(item);
    });
}

function toggleAnnouncement(element) {
    const parent = element.parentElement;
    parent.classList.toggle('active');

    const arrow = element.textContent.startsWith('►') ? '▼' : '►';
    element.textContent = element.textContent.replace(/[►▼]/, arrow);
}

function buyNumber(number, price) {
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const userBalance = users[currentUser]?.balance || 0;

    if (userBalance < price) {
        alert(`Saldo tidak cukup!\n\nSaldo kamu: Rp${userBalance.toLocaleString('id-ID')}\nHarga nomor: Rp${price.toLocaleString('id-ID')}\n\nSilakan top up terlebih dahulu.`);
        return;
    }

    if (!confirm(`Beli nomor ${number} seharga Rp${price.toLocaleString('id-ID')}?`)) {
        return;
    }

    // Determine if this is a Twilio number or local DB number
    const isTwilioNumber = number.startsWith('+62');
    
    const buyEndpoint = isTwilioNumber ? `${API_URL}/twilio/numbers/buy` : `${API_URL}/numbers/buy`;
    const requestBody = isTwilioNumber ? 
        { username: currentUser, phoneNumber: number } :
        { username: currentUser, number: number };

    fetch(buyEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            users[currentUser].balance = userBalance - price;
            localStorage.setItem('users', JSON.stringify(users));
            displayBalance();

            alert(`Nomor berhasil dibeli!\n\nNomor: ${number}\nHarga: Rp${price.toLocaleString('id-ID')}\nSaldo tersisa: Rp${users[currentUser].balance.toLocaleString('id-ID')}`);

            fetchAvailableNumbers();
            updateCounts();
        } else {
            alert(`Gagal membeli nomor: ${data.error || 'Unknown error'}`);
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Terjadi kesalahan. Silakan coba lagi.');
    });
}

function updateCounts() {
    const currentUser = localStorage.getItem('currentUser');
    
    fetch(`${API_URL}/user/${currentUser}/numbers`)
        .then(res => res.json())
        .then(data => {
            const owned = data.filter(n => n.owner === currentUser) || [];
            document.getElementById('count-success').textContent = owned.length;
            renderUserNumbers(owned);
        })
        .catch(err => console.error('Error:', err));

    document.getElementById('count-pending').textContent = '0';
    document.getElementById('count-failed').textContent = '0';
}

function renderUserNumbers(numbers) {
    const container = document.getElementById('user-numbers');
    
    if (!numbers || numbers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Belum ada nomor yang dibeli</p>';
        return;
    }

    container.innerHTML = '';
    numbers.forEach(num => {
        const card = document.createElement('div');
        card.className = 'number-card';
        card.style.margin = '10px 0';
        card.innerHTML = `
            <div class="number-card-country">${num.country}</div>
            <div class="number-card-service">${num.service}</div>
            <div class="number-card-number">${num.number}</div>
            <div class="number-card-price">Rp${num.price.toLocaleString('id-ID')}</div>
            <small style="color: #999;">Dibeli: ${new Date(num.purchased_at).toLocaleDateString('id-ID')}</small>
        `;
        container.appendChild(card);
    });
}

function switchTab(tab) {
    document.querySelectorAll('.tab-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (tab === 'dashboard') {
        document.getElementById('dashboard-tab').classList.add('active');
    } else if (tab === 'orders') {
        document.getElementById('orders-tab').classList.add('active');
        updateCounts();
    } else if (tab === 'activity') {
        document.getElementById('activity-tab').classList.add('active');
    } else if (tab === 'profile') {
        document.getElementById('profile-tab').classList.add('active');
    } else if (tab === 'settings') {
        document.getElementById('settings-tab').classList.add('active');
    }
    
    event.currentTarget.classList.add('active');
}

function logout() {
    if (confirm('Yakin ingin logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

function selectService(service) {
    alert(`Layanan ${service} dipilih. Fitur ini akan dikembangkan lebih lanjut.`);
}
