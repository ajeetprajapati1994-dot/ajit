# AJIT AI Ultimate — v2 SaaS starter

A polished, responsive multi-tool AI workspace with 15 focused workflows:
AI Assistant, AI Writer, Code Assistant, Business Planner, Marketing Studio, SEO Assistant, Email Writer, Social Media, Summarizer, Translator, Study Tutor, Career Coach, Startup Planner, Product Copy, and Customer Support Replies.

## Important: honest launch status
This is a deployable starter/MVP, not a finished competitor to every AI product. The 15 workflows are prompt-specialized interfaces powered by one configurable chat-completions API. Image/video/audio generation, file uploads, user accounts, persistent chat history, team workspaces, admin panel, usage metering, payment webhooks, and paid-user entitlement enforcement are not implemented in this version.

Without an AI API key, the app runs in clearly labelled preview mode; it does not pretend to return genuine AI-generated answers. AI API usage may cost money. Stripe checkout requires your own Stripe account and a monthly USD $9 recurring Price ID. This starter does not yet activate/deactivate paid access after payment; do not launch paid subscriptions until webhook, database, authentication, and entitlement checks are added and tested.

## Run locally
1. Install Node.js 20+.
2. Extract the ZIP and open a terminal in this folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Add your AI provider key to `OPENAI_API_KEY`.
6. Run `npm start`.
7. Visit `http://localhost:3000`.

## Deploy on Render
1. Create a GitHub repository named `ajit-ai`.
2. Upload the contents of this folder (including `public/`).
3. In Render choose New → Web Service and connect the repository.
4. Build command: `npm install`; Start command: `npm start`.
5. Set environment variables: `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4o-mini`), `OPENAI_BASE_URL` (default OpenAI), `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `APP_URL`.
6. Deploy, then test `/api/status`, chat and Stripe test checkout.

## Protection added in this build
- `ACCESS_CODE`: if set, users must enter this code to use AI (stops strangers from using your API key).
- `RATE_LIMIT_PER_HOUR` (default 20 per IP) and `DAILY_LIMIT` (default 300 total requests/day) cap your AI cost. Counters are in memory and reset on restart.
- `ENABLE_BILLING` defaults to false, so the $9 button shows "coming soon" until you build login + webhooks.

## Configure $9/month
Create a USD $9 recurring monthly price in your Stripe account. Use Stripe test keys first. For a real commercial launch, add Stripe webhooks, a database, secure authentication, and subscription entitlement checks before granting paid access.

## Security and production checklist
- Never commit `.env` or expose API keys in browser JavaScript.
- Add login, email verification, password reset, database-backed chat history, usage limits, rate limiting, abuse protection, monitoring, privacy policy, terms, refund/cancellation information, and webhook signature verification.
- Review AI provider terms, data retention, taxes, and payment availability for your business.
- Test mobile layouts, error states, checkout, cancellation and subscription lifecycle before charging customers.
