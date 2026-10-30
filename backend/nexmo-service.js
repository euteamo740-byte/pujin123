// Nexmo Service - Handle SMS operations
const Vonage = require('@vonage/server-sdk');
const nexmoConfig = require('./nexmo-config');

// Initialize Vonage client
let vonage = null;

function initVonage() {
    if (!vonage && nexmoConfig.apiKey !== 'PASTE_YOUR_API_KEY_HERE') {
        vonage = new Vonage({
            apiKey: nexmoConfig.apiKey,
            apiSecret: nexmoConfig.apiSecret
        });
        console.log('✓ Vonage/Nexmo initialized');
    }
    return vonage;
}

// Send SMS OTP
async function sendOTP(toNumber, code) {
    try {
        const client = initVonage();
        
        if (!client) {
            console.warn('Nexmo not initialized - using mock');
            return { success: true, mock: true, code: code };
        }

        const message = `Your Pujin Store verification code is: ${code}. Do not share this code.`;

        return new Promise((resolve, reject) => {
            vonage.message.sendSms(
                'Pujin Store',
                toNumber,
                message,
                (err, responseData) => {
                    if (err) {
                        console.error('Error sending SMS:', err);
                        reject(err);
                    } else {
                        if (responseData.messages[0]['status'] === '0') {
                            console.log('✓ SMS sent successfully:', toNumber);
                            resolve({
                                success: true,
                                messageId: responseData.messages[0]['message-id'],
                                code: code
                            });
                        } else {
                            console.error('SMS failed:', responseData.messages[0]['error-text']);
                            reject(new Error(responseData.messages[0]['error-text']));
                        }
                    }
                }
            );
        });

    } catch (error) {
        console.error('Error in sendOTP:', error);
        throw error;
    }
}

// Get available numbers (mock untuk MVP)
async function getAvailableNumbers(countryCode = 'ID', serviceType = 'SMS') {
    try {
        // Nanti: integrate ke Nexmo API untuk real numbers
        // Sekarang: return dummy data
        
        console.log(`Fetching available ${serviceType} numbers for ${countryCode}...`);
        
        // Mock response
        return {
            success: true,
            numbers: [
                { number: '+6281234567890', country: 'ID', type: serviceType, available: true },
                { number: '+6281234567891', country: 'ID', type: serviceType, available: true },
                { number: '+6281234567892', country: 'ID', type: serviceType, available: true }
            ]
        };
    } catch (error) {
        console.error('Error getting numbers:', error);
        throw error;
    }
}

// Rent number untuk user
async function rentNumber(toNumber, days = 7) {
    try {
        // Nanti: actual rent via Nexmo API
        console.log(`Renting number ${toNumber} for ${days} days...`);
        
        return {
            success: true,
            number: toNumber,
            rentedUntil: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        };
    } catch (error) {
        console.error('Error renting number:', error);
        throw error;
    }
}

module.exports = {
    initVonage,
    sendOTP,
    getAvailableNumbers,
    rentNumber
};
