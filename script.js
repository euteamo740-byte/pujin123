// Tab Switching
function switchTab(tab) {
    // Hide all tabs
    document.getElementById('registerTab').classList.remove('active');
    document.getElementById('loginTab').classList.remove('active');
    
    // Remove active dari semua buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    if (tab === 'register') {
        document.getElementById('registerTab').classList.add('active');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
    } else {
        document.getElementById('loginTab').classList.add('active');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    }
}

// Register Form
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const messageDiv = document.getElementById('regMessage');

    // Validasi
    if (!username) {
        showMessage(messageDiv, 'Username tidak boleh kosong!', 'error');
        return;
    }

    if (username.length < 3) {
        showMessage(messageDiv, 'Username minimal 3 karakter!', 'error');
        return;
    }

    if (password.length < 4) {
        showMessage(messageDiv, 'Password minimal 4 karakter!', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage(messageDiv, 'Password dan konfirmasi tidak cocok!', 'error');
        return;
    }

    // Cek apakah username sudah terdaftar
    const users = JSON.parse(localStorage.getItem('users')) || {};

    if (users[username]) {
        showMessage(messageDiv, 'Username sudah terdaftar!', 'error');
        return;
    }

    // Simpan user baru
    users[username] = {
        password: password,
        balance: 0,
        createdAt: new Date().toISOString()
    };

    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', username);

    // Success
    showMessage(messageDiv, '✓ Akun berhasil dibuat! Silakan tunggu...', 'success');
    
    // Clear form
    document.getElementById('registerForm').reset();

    // Redirect ke dashboard setelah 1.5 detik
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
});

// Login Form
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('loginMessage');

    // Validasi
    if (!username) {
        showMessage(messageDiv, 'Username tidak boleh kosong!', 'error');
        return;
    }

    if (!password) {
        showMessage(messageDiv, 'Password tidak boleh kosong!', 'error');
        return;
    }

    // Cek user di localStorage
    const users = JSON.parse(localStorage.getItem('users')) || {};

    if (!users[username]) {
        showMessage(messageDiv, 'Username tidak ditemukan!', 'error');
        return;
    }

    if (users[username].password !== password) {
        showMessage(messageDiv, 'Password salah!', 'error');
        return;
    }

    // Login berhasil
    localStorage.setItem('currentUser', username);
    showMessage(messageDiv, '✓ Login berhasil! Silakan tunggu...', 'success');
    
    // Clear form
    document.getElementById('loginForm').reset();

    // Redirect ke dashboard setelah 1.5 detik
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
});

function showMessage(element, text, type) {
    element.textContent = text;
    element.className = 'message ' + type;
}

// Debug: Lihat users yang terdaftar
console.log('Registered users:', JSON.parse(localStorage.getItem('users')) || {});
