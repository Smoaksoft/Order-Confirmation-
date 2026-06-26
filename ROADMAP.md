# Production Roadmap: OrderVoice AI

SaaS feature pipeline and platform scaling roadmap.

## Phase 1: MVP Real-time Simulations (Completed ✅)
- Full-stack Express + React/Vite layout
- Interactive dialer simulation with multilingual Gemini LLM conversational system prompt.
- Mock local DB persistence via `db.json` enabling order and log updates.

## Phase 2: Live VoIP Provider Hookup (Target: 3 Months 🚀)
- Full Twilio programmatic voice and Call Control XML (TwiML) integration.
- Exotel outbound trunk mapping supporting Indian local CLI calls.
- WebRTC browser softphone dialer for support representatives to handle escalated lines immediately within CRM.

## Phase 3: Conversational Intelligence Analysis (Target: 6 Months 🧠)
- Automated translation pipelines converting English summaries back to local business regions.
- Sentiment scoring mapping client voice tones (angry, happy, busy) directly into CRM logs.
- Fine-tuning translation classifiers for localized slang (Hinglish/Benglish terms).

## Phase 4: Enterprise Scalability & White-Label (Target: 12 Months 🏢)
- Multi-tenant tenant database sandboxing.
- Stripe billing checkout with automatic usage reporting.
- Custom caller ID verification and custom branded subdomain support.
