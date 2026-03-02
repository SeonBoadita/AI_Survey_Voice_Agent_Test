require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function initiateCall() {
    try {
        const call = await client.calls.create({
            // ⚠️ CHANGE THIS to your currently running Ngrok URL
            url: 'https://approvable-casen-sweetless.ngrok-free.dev/voice',

            // ⚠️ CHANGE THIS to your Moto G86 number
            to: '+919322761351',

            from: process.env.TWILIO_PHONE_NUMBER
        });

        console.log(`✅ Success! Calling your phone now. Call ID: ${call.sid}`);
    } catch (error) {
        console.error(`❌ Call failed: ${error.message}`);
    }
}

initiateCall();