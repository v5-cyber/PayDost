# BucksBuddy

Smart payment management for Indian contractors.

## Setup Instructions

### Environment Variables Needed
To enable production features like Error Monitoring (Sentry) and Analytics (PostHog), you need the following environment variables:

- `VITE_SENTRY_DSN`: Get this from [sentry.io](https://sentry.io) -> Create Project -> React -> DSN
- `VITE_POSTHOG_KEY`: Get this from [posthog.com](https://posthog.com) -> Project Settings -> API Key

Both Sentry and PostHog offer free tiers to start.

**If using Lovable:**
Add these keys to **Lovable → Secrets**.

*Note: In the vanilla JS build, these keys are mapped inside `public/index.html` within the `window.__env__` object. If deploying via Node, ensure they are injected into the HTML or replace the placeholder strings in `index.html`.*

## Production Features Included

1. **Error Monitoring (Sentry)**: Captures crashes, errors, and session replays automatically.
2. **Offline Support**: PWA Service Worker caching, offline network detection with UI banners, and local data queue for forms.
3. **Feature Analytics (PostHog)**: Tracks page views, feature usage (projects added, AI used, reminders sent).
4. **Auto-Save Forms**: Automatically saves drafts to `localStorage` every 2 seconds for all major forms.
