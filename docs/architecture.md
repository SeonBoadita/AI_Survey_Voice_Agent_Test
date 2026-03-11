# VaaniAI — System Architecture

## High-Level Architecture

```
Citizen Dials In (or receives outbound call)
              │
              ▼
    ┌─────────────────┐
    │  Telephony Layer │  Twilio / Exotel / Knowlarity / SIP
    └────────┬─────────┘
             │ Audio Stream
             ▼
    ┌─────────────────┐
    │   ASR Module    │  Sarvam AI + Bhashini + OpenAI Whisper
    │  (asr/sarvam.py)│  Language auto-detection + transcription
    └────────┬─────────┘
             │ Text + Language Code
             ▼
    ┌─────────────────┐
    │   NLU Module    │  LangChain + GPT-4o / Llama 3 via Groq
    │  (nlu/agent.py) │  Intent classification + entity extraction
    └────────┬─────────┘
             │
      ┌──────┴───────┐
      │              │
      ▼              ▼
┌──────────┐  ┌────────────┐
│  Memory  │  │ Escalation │
│  Module  │  │  Handler   │
│(pgvector)│  │(emotion AI)│
└──────────┘  └────────────┘
      │              │
      └──────┬───────┘
             │ Enriched Context
             ▼
    ┌─────────────────┐
    │   TTS Module    │  Sarvam TTS + ElevenLabs
    │(tts/synthesizer)│  Indian-accent audio output
    └────────┬─────────┘
             │ Audio
             ▼
    ┌─────────────────┐
    │  Telephony Layer │  Plays response to citizen
    └────────┬─────────┘
             │
             ▼
    ┌─────────────────┐
    │  Analytics      │  PostgreSQL + Grafana + Metabase
    │  Pipeline       │  Real-time ward-level dashboards
    └─────────────────┘
```

## Data Flow

1. **Call Initiated** → Twilio/Exotel routes audio to VaaniAI backend
2. **ASR** → Audio converted to text, language auto-detected
3. **NLU** → Intent classified, entities extracted (ward, issue type)
4. **Memory Lookup** → Citizen history retrieved from pgvector by phone number
5. **LLM Response** → GPT-4o/Llama 3 generates contextual reply
6. **Emotion Check** → If distress detected → escalate to human agent
7. **TTS** → Response synthesized in citizen's language
8. **Data Saved** → Transcript + summary + metadata stored
9. **Analytics** → Metrics pushed to Grafana dashboard

## Escalation Flow

```
Citizen Call
    │
    ├── Calm / Normal → Continue AI conversation
    │
    └── Distressed (detected via tone + keywords)
              │
              ▼
        Package full context:
        - Conversation transcript
        - Detected intent + entities  
        - Citizen history
              │
              ▼
        Transfer to human agent
        (agent sees full context, no repeat needed)
```

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│              AWS / Azure                 │
│                                         │
│  ┌──────────┐    ┌──────────────────┐   │
│  │  FastAPI  │    │   PostgreSQL +   │   │
│  │  Backend  │◄──►│   pgvector DB    │   │
│  │ (Docker)  │    │  (Supabase)      │   │
│  └──────────┘    └──────────────────┘   │
│       │                   │             │
│       ▼                   ▼             │
│  ┌──────────┐    ┌──────────────────┐   │
│  │  Twilio  │    │  Grafana /       │   │
│  │  Webhook │    │  Metabase        │   │
│  └──────────┘    └──────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
         │
         ▼
    Vercel (Next.js Analytics Dashboard)
```
