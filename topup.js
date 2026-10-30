let selectedNominal = 0;
const BONUS_PERCENTAGE = 0.05; // 5% bonus

// Select Nominal
function selectNominal(amount) {
    selectedNominal = amount;

    // Hapus selected dari semua card
    document.querySelectorAll('.nominal-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Add selected ke card yang diklik
    event.currentTarget.classList.add('selected');

    // Show payment & summary section
    document.getElementById('paymentSection').style.display = 'block';
    document.getElementById('summarySection').style.display = 'block';

    // Update summary
    updateSummary();

    // Scroll ke payment section
    setTimeout(() => {
        document.getElementById('paymentSection').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function updateSummary() {
    const bonus = Math.floor(selectedNominal * BONUS_PERCENTAGE);
    const total = selectedNominal + bonus;

    document.getElementById('summaryAmount').textContent = selectedNominal.toLocaleString('id-ID');
    document.getElementById('summaryBonus').textContent = bonus.toLocaleString('id-ID');
    document.getElementById('summaryTotal').textContent = total.toLocaleString('id-ID');
}

// Toggle payment method details
function togglePayment(method) {
    if (method === 'dana') {
        document.getElementById('danaMethod').classList.add('active');
        document.getElementById('qrisMethod').classList.remove('active');
        document.querySelector('#danaMethod .payment-details').style.display = 'block';
        document.querySelector('#qrisMethod .payment-details').style.display = 'none';
    } else {
        document.getElementById('danaMethod').classList.remove('active');
        document.getElementById('qrisMethod').classList.add('active');
        document.querySelector('#danaMethod .payment-details').style.display = 'none';
        document.querySelector('#qrisMethod .payment-details').style.display = 'block';
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const btn = event.currentTarget;
        const originalText = btn.textContent;
        btn.textContent = '✓ Tersalin!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        alert('Gagal menyalin nomor');
    });
}

// Confirm payment
function confirmPayment() {
    if (!selectedNominal) {
        showMessage('Pilih nominal top up terlebih dahulu!', 'error');
        return;
    }

    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users')) || {};

    if (!users[currentUser]) {
        showMessage('User tidak ditemukan!', 'error');
        return;
    }

    // Calculate bonus
    const bonus = Math.floor(selectedNominal * BONUS_PERCENTAGE);
    const totalAdd = selectedNominal + bonus;

    // Update user balance
    const currentBalance = users[currentUser].balance || 0;
    users[currentUser].balance = currentBalance + totalAdd;

    // Add transaction history
    if (!users[currentUser].transactions) {
        users[currentUser].transactions = [];
    }

    users[currentUser].transactions.push({
        type: 'topup',
        amount: selectedNominal,
        bonus: bonus,
        total: totalAdd,
        date: new Date().toISOString(),
        paymentMethod: 'DANA',
        status: 'completed'
    });

    // Save to localStorage
    localStorage.setItem('users', JSON.stringify(users));

    // Show success message
    showMessage(
        `✓ Top Up Berhasil!\n\nNominal: Rp${selectedNominal.toLocaleString('id-ID')}\nBonus: Rp${bonus.toLocaleString('id-ID')}\nTotal: Rp${totalAdd.toLocaleString('id-ID')}\n\nSaldo kamu sekarang: Rp${users[currentUser].balance.toLocaleString('id-ID')}`,
        'success'
    );

    // Redirect ke dashboard setelah 2 detik
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 2000);
}

// Cancel top up
function cancelTopup() {
    if (confirm('Batalkan top up?')) {
        window.location.href = 'dashboard.html';
    }
}

// Go back
function goBack() {
    window.location.href = 'dashboard.html';
}

// Show message
function showMessage(text, type) {
    const messageDiv = document.getElementById('topupMessage');
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
    messageDiv.style.display = 'block';
    messageDiv.scrollIntoView({ behavior: 'smooth' });
}

// Init saldo untuk user baru (jika belum ada)
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users')) || {};

    if (currentUser && users[currentUser]) {
        if (!users[currentUser].balance) {
            users[currentUser].balance = 0;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
});
