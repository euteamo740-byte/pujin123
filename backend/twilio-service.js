// Twilio Service - Handle virtual numbers & SMS
const twilioConfig = require('./twilio-config');
const twilio = require('twilio');

// Initialize Twilio client
let client = null;

function initTwilio() {
    if (!client) {
        client = twilio(twilioConfig.accountSid, twilioConfig.authToken);
        console.log('✓ Twilio client initialized');
    }
    return client;
}

// Buy/rent a virtual number
async function buyVirtualNumber(countryCode = 'ID', serviceType = 'SMS') {
    try {
        const twilioClient = initTwilio();
        
        // Search for available Indonesian numbers
        const numbers = await twilioClient.availablePhoneNumbers('ID')
            .local
            .list({ serviceType: serviceType, limit: 1 });

        if (numbers.length === 0) {
            throw new Error('No available numbers in Indonesia');
        }

        // Purchase the number
        const purchased = await twilioClient.incomingPhoneNumbers.create({
            phoneNumber: numbers[0].phoneNumber,
            smsUrl: twilioConfig.webhookUrl
        });

        console.log(`✓ Number purchased: ${purchased.phoneNumber}`);
        
        return {
            success: true,
            number: purchased.phoneNumber,
            sid: purchased.sid,
            country: 'Indonesia',
            service: serviceType
        };

    } catch (error) {
        console.error('Error buying number:', error);
        throw error;
    }
}

// Buy specific number from Twilio
async function buyVirtualNumberFromTwilio(phoneNumber) {
    try {
        const twilioClient = initTwilio();
        
        // Purchase the specific number
        const purchased = await twilioClient.incomingPhoneNumbers.create({
            phoneNumber: phoneNumber,
            smsUrl: twilioConfig.webhookUrl
        });

        console.log(`✓ Number purchased from web: ${purchased.phoneNumber}`);
        
        return {
            success: true,
            number: purchased.phoneNumber,
            sid: purchased.sid,
            country: 'Indonesia',
            service: 'WhatsApp'
        };

    } catch (error) {
        console.error('Error buying number:', error);
        throw error;
    }
}

// Search available numbers
async function searchAvailableNumbers(countryCode = 'ID', serviceType = 'SMS') {
    try {
        const twilioClient = initTwilio();
        
        const numbers = await twilioClient.availablePhoneNumbers(countryCode)
            .local
            .list({ serviceType: serviceType, limit: 10 });

        return numbers.map(num => ({
            number: num.phoneNumber,
            country: countryCode,
            service: serviceType,
            price: 2200,
            available: true,
            twilioSid: num.sid
        }));

    } catch (error) {
        console.error('Error searching numbers:', error);
        throw error;
    }
}

// Send OTP to user's phone
async function sendOTP(toNumber, code, message = null) {
    try {
        const twilioClient = initTwilio();
        
        const msg = message || `Your Pujin Store verification code is: ${code}`;

        const result = await twilioClient.messages.create({
            body: msg,
            from: twilioConfig.twilioNumber,
            to: toNumber
        });

        console.log(`✓ OTP sent to ${toNumber}: ${code}`);
        
        return {
            success: true,
            messageId: result.sid,
            to: toNumber,
            code: code
        };

    } catch (error) {
        console.error('Error sending OTP:', error);
        throw error;
    }
}

// Get incoming SMS messages for a number
async function getMessages(toNumber, limit = 20) {
    try {
        const twilioClient = initTwilio();
        
        const messages = await twilioClient.messages.list({
            to: toNumber,
            limit: limit
        });

        return messages.map(msg => ({
            id: msg.sid,
            from: msg.from,
            to: msg.to,
            body: msg.body,
            date: msg.dateSent || msg.dateCreated,
            code: extractCode(msg.body)
        }));

    } catch (error) {
        console.error('Error getting messages:', error);
        throw error;
    }
}

// Helper: Extract OTP code from message
function extractCode(messageBody) {
    // Common OTP patterns: "123456", "code: 123456", "verification code: 123456"
    const match = messageBody.match(/\b(\d{4,8})\b/);
    return match ? match[1] : null;
}

// Release/delete a number
async function releaseNumber(phoneNumber) {
    try {
        const twilioClient = initTwilio();
        
        // Find the incoming phone number
        const numbers = await twilioClient.incomingPhoneNumbers.list({ phoneNumber: phoneNumber });
        
        if (numbers.length === 0) {
            throw new Error('Number not found');
        }

        // Delete it
        await twilioClient.incomingPhoneNumbers(numbers[0].sid).remove();
        
        console.log(`✓ Number released: ${phoneNumber}`);
        return { success: true };

    } catch (error) {
        console.error('Error releasing number:', error);
        throw error;
    }
}

// Check balance (mock - Twilio ga expose balance directly)
async function checkBalance() {
    // Twilio ga ada direct balance API, perlu check via dashboard
    return {
        success: true,
        message: 'Check balance di Twilio Dashboard'
    };
}

module.exports = {
    initTwilio,
    buyVirtualNumber,
    sendOTP,
    getMessages,
    releaseNumber,
    checkBalance,
    extractCode
};
