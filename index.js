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

let callTranscript = "";

// 1. Initial Greeting
app.post('/voice', (req, res) => {
    callTranscript = ""; 
    const twiml = `
        <Response>
            <Gather input="speech" action="/respond" timeout="10" speechTimeout="3">
                <Say>Hello. I am the Agassaim AI assistant. How can I help you today?</Say>
            </Gather>
        </Response>`;
    res.type('text/xml').send(twiml);
});

// 2. The Infinite Conversational Loop
app.post('/respond', async (req, res) => {
    try {
        const userSpeech = req.body.SpeechResult;
        
        // If silence, keep microphone open
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

        // --- THE HANG UP TRIGGER ---
        // If the user says bye, break the loop and go save the data
        const speechLower = userSpeech.toLowerCase();
        if (speechLower.includes('bye') || speechLower.includes('goodbye') || speechLower.includes('that is all')) {
            console.log("👋 User initiated hangup. Saving data...");
            return res.redirect(307, '/finish');
        }
        
        // --- DYNAMIC AI GENERATION WITH CONTEXT ---
        // We pass the WHOLE transcript so the AI remembers the conversation
        const prompt = `You are a conversational AI assistant for the local government. Have a natural, flowing conversation. Keep your responses short (1 to 2 sentences max) so it sounds like a real phone call. 
        
Here is the conversation history:
${callTranscript}

Respond naturally to the Citizen's last message.`;

        const result = await model.generateContent(prompt);
        const aiReply = result.response.text();
        
        callTranscript += `AI: ${aiReply}\n`;

        // --- THE LOOP ---
        // Notice there is NO <Redirect> or <Hangup>. It just opens the mic again.
        const twiml = `
            <Response>
                <Gather input="speech" action="/respond" timeout="10" speechTimeout="3">
                    <Say>${escapeXml(aiReply)}</Say>
                </Gather>
            </Response>`;
        
        res.type('text/xml').send(twiml);

    } catch (error) {
        console.error("🚨 QUOTA OR API ERROR:", error.message);
        // If quota fails, keep the loop alive with a hardcoded fallback
        const twiml = `
            <Response>
                <Gather input="speech" action="/respond" timeout="10" speechTimeout="3">
                    <Say>I'm having some network issues on my end, but I am still listening. What else would you like to add?</Say>
                </Gather>
            </Response>`;
        res.type('text/xml').send(twiml);
    }
});

// 3. Save to Database (Only triggers when user says "Goodbye")
app.post('/finish', async (req, res) => {
    try {
        let summaryText = "Summary failed.";
        try {
            const result = await model.generateContent(`Summarize this in 10 words: ${callTranscript}`);
            summaryText = result.response.text();
        } catch (e) {
            summaryText = "Citizen conversed. (AI Summary unavailable due to quota)";
        }

        const newSurvey = new Survey({
            phoneNumber: req.body.From || "Unknown",
            transcript: callTranscript,
            summary: summaryText,
            location: "Agassaim" 
        });

        await newSurvey.save();
        console.log(`✅ Data Saved!`);

        res.type('text/xml').send(`<Response><Say>Thank you. Your report has been saved. Goodbye.</Say><Hangup/></Response>`);
    } catch (error) {
        res.type('text/xml').send('<Response><Say>Goodbye.</Say><Hangup/></Response>');
    }
});

app.listen(3000, () => console.log(`🚀 AI Server live on port 3000`));