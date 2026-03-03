require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function initiateCall() {
    try {
        const call = await client.calls.create({
            // ⚠️ KEEP YOUR CURRENT NGROK URL HERE
            url: 'https://APPROVABLE-CASEN-SWEETLESS.ngrok-free.dev/voice', 
            to: '+919322761351', // Your phone number
            from: process.env.TWILIO_PHONE_NUMBER,
            
            // --- NEW: THE HANGUP DETECTOR ---
            statusCallback: 'https://APPROVABLE-CASEN-SWEETLESS.ngrok-free.dev/status',
            statusCallbackEvent: ['completed']
        });

        console.log(`✅ Success! Calling your phone now. Call ID: ${call.sid}`);
    } catch (error) {
        console.error(`❌ Call failed: ${error.message}`);
    }
}

initiateCall();