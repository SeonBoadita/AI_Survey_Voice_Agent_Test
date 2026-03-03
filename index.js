require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');
const { GoogleGenerativeAI } = require('@google/generative-ai');

try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

function escapeXml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

try {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log("📦 Connected to MongoDB Atlas"))
        .catch(err => console.error("🚨 MongoDB Error:", err));
} catch (e) {}

const SurveySchema = new mongoose.Schema({
    phoneNumber: String,
    transcript: String,
    summary: String,
    location: String,
    timestamp: { type: Date, default: Date.now }
});
const Survey = mongoose.model('Survey', SurveySchema);

// --- GLOBAL VARIABLES ---
let callTranscript = "";
let isSaved = false; // This prevents saving duplicate entries

// 1. Initial Greeting
app.post('/voice', (req, res) => {
    callTranscript = ""; 
    isSaved = false; // Reset the flag for a new call
    const twiml = `
        <Response>
            <Gather input="speech" action="/respond" timeout="10" speechTimeout="3">
                <Say>Hello. I am the Agassaim AI assistant. How can I help you today?</Say>
            </Gather>
        </Response>`;
    res.type('text/xml').send(twiml);
});

// 2. The Interactive Loop
app.post('/respond', async (req, res) => {
    try {
        const userSpeech = req.body.SpeechResult;
        
        if (!userSpeech) {
            return res.type('text/xml').send(`
                <Response>
                    <Gather input="speech" action="/respond" timeout="10" speechTimeout="3">
                        <Say>I am still listening.</Say>
                    </Gather>
                </Response>`);
        }
        
        callTranscript += `Citizen: ${userSpeech}\n`;
        console.log(`🗣️ You said: "${userSpeech}"`);

        const speechLower = userSpeech.toLowerCase();
        if (speechLower.includes('bye') || speechLower.includes('goodbye') || speechLower.includes('that is all')) {
            console.log("👋 User said Goodbye. Triggering manual save...");
            return res.type('text/xml').send('<Response><Redirect method="POST">/finish</Redirect></Response>');
        }
        
        const prompt = `You are a conversational AI assistant for the local government. Have a natural, flowing conversation. Keep your responses short (1 to 2 sentences max). Here is the conversation history:\n${callTranscript}\nRespond naturally to the Citizen's last message.`;

        const result = await model.generateContent(prompt);
        const aiReply = result.response.text();
        
        callTranscript += `AI: ${aiReply}\n`;

        const twiml = `
            <Response>
                <Gather input="speech" action="/respond" timeout="10" speechTimeout="3">
                    <Say>${escapeXml(aiReply)}</Say>
                </Gather>
            </Response>`;
        
        res.type('text/xml').send(twiml);

    } catch (error) {
        console.error("🚨 QUOTA OR API ERROR:", error.message);
        const twiml = `
            <Response>
                <Gather input="speech" action="/respond" timeout="10" speechTimeout="3">
                    <Say>I'm having some network issues on my end, but I am still listening. What else would you like to add?</Say>
                </Gather>
            </Response>`;
        res.type('text/xml').send(twiml);
    }
});

// 3. Save to Database (When user specifically says "Goodbye")
app.post('/finish', async (req, res) => {
    try {
        if (!isSaved && callTranscript !== "") {
            const newSurvey = new Survey({
                phoneNumber: req.body.To || "Unknown", // Uses the citizen's number
                transcript: callTranscript,
                summary: "Citizen conversed. (AI Summary unavailable due to quota)",
                location: "Agassaim" 
            });
            await newSurvey.save();
            isSaved = true;
            console.log(`✅ Data Saved on Goodbye!`);
        }
        res.type('text/xml').send(`<Response><Say>Thank you. Your report has been saved. Goodbye.</Say><Hangup/></Response>`);
    } catch (error) {
        res.type('text/xml').send('<Response><Say>Goodbye.</Say><Hangup/></Response>');
    }
});

// 4. THE HANGUP CATCHER (When user abruptly hangs up the phone)
app.post('/status', async (req, res) => {
    const callStatus = req.body.CallStatus;
    
    // If the call drops, and we haven't saved the data yet, rescue it!
    if (callStatus === 'completed' && !isSaved && callTranscript !== "") {
        console.log("📞 Call dropped by user. Rescuing and saving data...");
        try {
            const newSurvey = new Survey({
                phoneNumber: req.body.To || "Unknown",
                transcript: callTranscript,
                summary: "Citizen hung up mid-call. Partial data rescued.",
                location: "Agassaim"
            });
            await newSurvey.save();
            isSaved = true;
            console.log(`✅ Rescued Data Saved to MongoDB!`);
        } catch (err) {
            console.error("🚨 Rescue Save Error:", err);
        }
    }
    // Tell Twilio we received the status update
    res.sendStatus(200); 
});

app.listen(3000, () => console.log(`🚀 AI Server live on port 3000`));