const API_URL = 'http://localhost:3001/api';

document.addEventListener('DOMContentLoaded', function() {
    checkAdmin();
    loadOverview();
    loadInjectNumbers();
});

function checkAdmin() {
    const currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser || currentUser !== 'admin') {
        window.location.href = 'index.html';
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    if (tab === 'overview') {
        document.getElementById('overview-tab').classList.add('active');
        loadOverview();
    } else if (tab === 'users') {
        document.getElementById('users-tab').classList.add('active');
        loadUsers();
    } else if (tab === 'transactions') {
        document.getElementById('transactions-tab').classList.add('active');
        loadTransactions();
    } else if (tab === 'numbers') {
        document.getElementById('numbers-tab').classList.add('active');
        loadNumbers();
    } else if (tab === 'otp-inject') {
        document.getElementById('otp-inject-tab').classList.add('active');
        loadInjectNumbers();
    }
    
    event.currentTarget.classList.add('active');
}

function loadOverview() {
    // Get all data
    fetch(`${API_URL}/numbers/available`)
        .then(res => res.json())
        .then(numbers => {
            // Count stats
            const available = numbers.filter(n => n.status === 'available').length;
            const owned = numbers.filter(n => n.status === 'owned').length;
            const total = numbers.length;

            document.getElementById('stat-available').textContent = available;
            document.getElementById('stat-owned').textContent = owned;
            document.getElementById('stat-numbers').textContent = owned;
            
            // Calculate revenue (price of all owned numbers)
            const revenue = numbers
                .filter(n => n.status === 'owned')
                .reduce((sum, n) => sum + (n.price || 0), 0);
            document.getElementById('stat-revenue').textContent = 'Rp' + revenue.toLocaleString('id-ID');

            // Recent transactions
            renderRecentTransactions(numbers.filter(n => n.status === 'owned').slice(0, 10));
        })
        .catch(err => console.error('Error:', err));

    // Count users
    const users = JSON.parse(localStorage.getItem('users')) || {};
    document.getElementById('stat-users').textContent = Object.keys(users).length - 1; // exclude admin
}

function renderRecentTransactions(owned) {
    const container = document.getElementById('recentTx');
    
    if (!owned || owned.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Tidak ada transaksi</p>';
        return;
    }

    container.innerHTML = owned.map(num => `
        <div style="padding: 12px; border: 1px solid #e0e0e0; border-radius: 6px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <p style="margin: 0; font-weight: 600;">${num.number}</p>
                    <small style="color: #999;">${num.service} - ${num.country}</small>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; color: #28a745; font-weight: 600;">Rp${num.price.toLocaleString('id-ID')}</p>
                    <small style="color: #999;">${new Date(num.purchased_at).toLocaleDateString('id-ID')}</small>
                </div>
            </div>
        </div>
    `).join('');
}

function loadUsers() {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const container = document.getElementById('usersList');
    const search = document.getElementById('userSearch').value.toLowerCase();

    const filteredUsers = Object.entries(users)
        .filter(([username]) => username !== 'admin' && username.toLowerCase().includes(search))
        .map(([username, data]) => ({
            username,
            balance: data.balance || 0,
            createdAt: data.createdAt
        }));

    if (filteredUsers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Tidak ada user</p>';
        return;
    }

    container.innerHTML = filteredUsers.map(user => `
        <div style="padding: 12px; border: 1px solid #e0e0e0; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <p style="margin: 0; font-weight: 600;">👤 ${user.username}</p>
                <small style="color: #999;">Join: ${new Date(user.createdAt).toLocaleDateString('id-ID')}</small>
            </div>
            <div style="text-align: right;">
                <p style="margin: 0; font-weight: 600;">Rp${user.balance.toLocaleString('id-ID')}</p>
                <small style="color: #666;">Balance</small>
            </div>
        </div>
    `).join('');
}

function loadTransactions() {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const allTransactions = [];

    Object.entries(users).forEach(([username, data]) => {
        if (data.transactions) {
            data.transactions.forEach(tx => {
                allTransactions.push({
                    username,
                    ...tx
                });
            });
        }
    });

    const container = document.getElementById('transactionsList');
    
    if (allTransactions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Tidak ada transaksi</p>';
        return;
    }

    // Sort by newest first
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = allTransactions.map(tx => `
        <div style="padding: 12px; border: 1px solid #e0e0e0; border-radius: 6px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <p style="margin: 0; font-weight: 600;">👤 ${tx.username}</p>
                <span style="background: ${tx.type === 'topup' ? '#d4edda' : '#fff3cd'}; color: ${tx.type === 'topup' ? '#155724' : '#856404'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                    ${tx.type === 'topup' ? 'TOP UP' : 'BUY'}
                </span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <small style="color: #666;">${new Date(tx.date || tx.created_at).toLocaleString('id-ID')}</small>
                <span style="color: #28a745; font-weight: 600;">+Rp${(tx.total || tx.amount).toLocaleString('id-ID')}</span>
            </div>
        </div>
    `).join('');
}

function loadNumbers() {
    fetch(`${API_URL}/numbers/available`)
        .then(res => res.json())
        .then(numbers => {
            const available = numbers.filter(n => n.status === 'available');
            const owned = numbers.filter(n => n.status === 'owned');
            
            document.getElementById('stat-available').textContent = available.length;
            document.getElementById('stat-owned').textContent = owned.length;
            document.getElementById('stat-total').textContent = numbers.length;

            const container = document.getElementById('numbersList');
            
            let html = `
                <div style="margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #333;">📱 Available (${available.length})</h4>
                    ${available.slice(0, 20).map(n => `
                        <div style="padding: 10px; background: #f9f9f9; border-radius: 6px; margin-bottom: 6px; font-size: 13px;">
                            <span style="font-weight: 600;">${n.number}</span> - ${n.service} 
                            <span style="color: #28a745; float: right;">Rp${n.price.toLocaleString('id-ID')}</span>
                        </div>
                    `).join('')}
                    ${available.length > 20 ? `<p style="color: #999; font-size: 12px;">... dan ${available.length - 20} lagi</p>` : ''}
                </div>

                <div>
                    <h4 style="margin: 0 0 10px 0; color: #333;">✓ Owned (${owned.length})</h4>
                    ${owned.slice(0, 20).map(n => `
                        <div style="padding: 10px; background: #e3f2fd; border-radius: 6px; margin-bottom: 6px; font-size: 13px;">
                            <span style="font-weight: 600;">${n.number}</span> - ${n.service}
                            <span style="color: #666; font-size: 12px;"> (${n.owner})</span>
                            <span style="color: #28a745; float: right;">Rp${n.price.toLocaleString('id-ID')}</span>
                        </div>
                    `).join('')}
                    ${owned.length > 20 ? `<p style="color: #999; font-size: 12px;">... dan ${owned.length - 20} lagi</p>` : ''}
                </div>
            `;

            container.innerHTML = html;
        })
        .catch(err => console.error('Error:', err));
}

function loadInjectNumbers() {
    fetch(`${API_URL}/numbers/available`)
        .then(res => res.json())
        .then(numbers => {
            const owned = numbers.filter(n => n.status === 'owned');
            const select = document.getElementById('injectNumber');
            
            select.innerHTML = '<option value="">-- Pilih nomor --</option>';
            owned.forEach(num => {
                const opt = document.createElement('option');
                opt.value = num.number;
                opt.textContent = `${num.number} (${num.service} - ${num.owner})`;
                select.appendChild(opt);
            });
        })
        .catch(err => console.error('Error:', err));
}

function injectOTP() {
    const number = document.getElementById('injectNumber').value;
    const code = document.getElementById('injectCode').value;
    const message = document.getElementById('injectMessage').value;

    if (!number) {
        alert('Pilih nomor terlebih dahulu!');
        return;
    }

    if (!code || code.length < 3) {
        alert('Masuk kode OTP minimal 3 digit!');
        return;
    }

    fetch(`${API_URL}/numbers/${number}/simulate-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sender: 'WhatsApp',
            message: message || `Your WhatsApp verification code is: ${code}`,
            code: code
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(`✓ OTP ${code} berhasil di-inject ke ${number}!`);
            document.getElementById('injectCode').value = '';
            document.getElementById('injectMessage').value = '';
            loadInjectNumbers();
        } else {
            alert(`Error: ${data.error}`);
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Gagal inject OTP');
    });
}

function logout() {
    if (confirm('Logout dari admin panel?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}
