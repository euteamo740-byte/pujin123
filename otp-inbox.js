const API_URL = 'http://localhost:3001/api';

document.addEventListener('DOMContentLoaded', function() {
    checkLogin();
    loadUserNumbers();
});

function checkLogin() {
    const currentUser = localStorage.getItem('currentUser');
    const userDisplay = document.getElementById('userDisplay');

    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    userDisplay.textContent = `👤 ${currentUser}`;
}

function loadUserNumbers() {
    const currentUser = localStorage.getItem('currentUser');
    
    fetch(`${API_URL}/user/${currentUser}/numbers`)
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('numberSelect');
            select.innerHTML = '<option value="">-- Pilih nomor yang dibeli --</option>';

            const owned = data.filter(n => n.owner === currentUser) || [];
            
            if (owned.length === 0) {
                document.getElementById('otpList').innerHTML = '<p style="text-align: center; color: #999;">Belum ada nomor yang dibeli. Beli nomor dulu untuk melihat OTP!</p>';
                return;
            }

            owned.forEach(num => {
                const option = document.createElement('option');
                option.value = num.number;
                option.textContent = `${num.number} - ${num.service} (Rp${num.price.toLocaleString('id-ID')})`;
                select.appendChild(option);
            });

            // Show admin section untuk testing
            document.getElementById('adminSection').style.display = 'block';
        })
        .catch(err => {
            console.error('Error loading numbers:', err);
        });
}

function loadOTPForNumber() {
    const number = document.getElementById('numberSelect').value;
    const otpList = document.getElementById('otpList');

    if (!number) {
        otpList.innerHTML = '<p style="text-align: center; color: #999;">Pilih nomor untuk melihat OTP</p>';
        return;
    }

    // Show loading
    otpList.innerHTML = '<p style="text-align: center; color: #999;">Memuat...</p>';

    fetch(`${API_URL}/numbers/${number}/inbox`)
        .then(res => res.json())
        .then(data => {
            renderOTPList(data);
        })
        .catch(err => {
            console.error('Error loading OTP:', err);
            otpList.innerHTML = '<p style="text-align: center; color: #e74c3c;">Gagal memuat OTP</p>';
        });
}

function renderOTPList(smsList) {
    const otpList = document.getElementById('otpList');

    if (!smsList || smsList.length === 0) {
        otpList.innerHTML = '<p style="text-align: center; color: #999;">Belum ada SMS/OTP masuk untuk nomor ini</p>';
        return;
    }

    otpList.innerHTML = '';
    
    // Sort by newest first
    smsList.sort((a, b) => new Date(b.received_at) - new Date(a.received_at));

    smsList.forEach((sms, index) => {
        const time = new Date(sms.received_at).toLocaleString('id-ID');
        const item = document.createElement('div');
        item.className = 'otp-item';
        
        const codeDisplay = sms.code ? `
            <div class="otp-code">${sms.code}</div>
            <button class="btn-copy-otp" onclick="copyOTP('${sms.code}')">📋 Copy Kode</button>
        ` : '';

        item.innerHTML = `
            <div class="otp-header">
                <span class="otp-sender">📨 ${sms.sender || 'SMS'}</span>
                <span class="otp-time">${time}</span>
            </div>
            ${codeDisplay}
            <div class="otp-message">${sms.message}</div>
        `;
        otpList.appendChild(item);
    });
}

function copyOTP(code) {
    navigator.clipboard.writeText(code).then(() => {
        alert(`✓ Kode ${code} berhasil disalin!`);
    }).catch(err => {
        alert('Gagal menyalin kode');
    });
}

function simulateOTP() {
    const number = document.getElementById('numberSelect').value;
    const code = document.getElementById('simulateCode').value;

    if (!number) {
        alert('Pilih nomor terlebih dahulu!');
        return;
    }

    if (!code || code.length < 3) {
        alert('Masuk kode OTP minimal 3 digit!');
        return;
    }

    // Simulate OTP via backend
    fetch(`${API_URL}/numbers/${number}/simulate-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sender: 'WhatsApp',
            message: `Your WhatsApp verification code is: ${code}`,
            code: code
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(`✓ OTP ${code} berhasil di-inject!`);
            document.getElementById('simulateCode').value = '';
            loadOTPForNumber(); // Refresh list
        } else {
            alert(`Error: ${data.error}`);
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Gagal inject OTP');
    });
}

function goToTopup() {
    window.location.href = 'topup.html';
}

function logout() {
    if (confirm('Yakin ingin logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Auto refresh OTP setiap 5 detik
setInterval(() => {
    const number = document.getElementById('numberSelect').value;
    if (number) {
        fetch(`${API_URL}/numbers/${number}/inbox`)
            .then(res => res.json())
            .then(data => {
                renderOTPList(data);
            })
            .catch(err => console.error('Error auto-refresh:', err));
    }
}, 5000);
