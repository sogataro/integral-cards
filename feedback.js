// Feedback sender shared by the apps (template; copied into each app once the common spec is approved).
// FEEDBACK_URL is the GAS web-app URL (public on purpose in the app: it can only append a row and post to Discord).
// This template does not hold the real value: replace the placeholder with FEEDBACK_URL from the workspace .env.
// If .env has no FEEDBACK_URL, ask the user (the receiver may not exist yet: webapp-feedback/references/gas-setup.md).
const FEEDBACK_URL = 'https://script.google.com/macros/s/AKfycbyOOUg7dOlEo4oe8VSBIXKV87BKzOiKtt11QPjcBeQHALJWgz6_M7J0g4fQjy-ekcHP5w/exec';

/**
 * Send one feedback message. Returns {ok: true} or {ok: false, error}.
 * Sent as text/plain so the browser makes a "simple" request (GAS cannot answer a CORS preflight).
 */
async function sendFeedback({ app, version, lang, message, contact = '', website = '' }) {
  try {
    const res = await fetch(FEEDBACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ app, version, lang, message, contact, website }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'network' };
  }
}
