const APP_URL = process.env.APP_URL || 'http://127.0.0.1:5173';
const API_URL = process.env.API_URL || 'http://127.0.0.1:3001';
const CDP_URL = process.env.CDP_URL || 'http://127.0.0.1:9222';
const ROUNDS = Number(process.env.ROUNDS || 3);
const MAX_CLICKS_PER_ROUTE = Number(process.env.MAX_CLICKS_PER_ROUTE || 60);

const routes = [
  '/dashboard',
  '/morning-huddle',
  '/patients',
  '/notes',
  '/claim-scrubber',
  '/patient-retention',
  '/nurture-sequences',
  '/decision-support',
  '/treatment-plans',
  '/insurance',
  '/preauth',
  '/billing',
  '/payment-plans',
  '/fee-optimizer',
  '/recall',
  '/perio',
  '/smart-scheduling',
  '/communications',
  '/follow-ups',
  '/referrals',
  '/forms',
  '/inventory',
  '/procurement',
  '/reports',
  '/patient-scores',
  '/compliance',
  '/tools',
  '/settings',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function withTimeout(promise, label, ms = 8000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function health() {
  const response = await fetch(`${API_URL}/health`);
  const text = await response.text();
  if (!response.ok) throw new Error(`health ${response.status}: ${text.slice(0, 200)}`);
  return text;
}

async function cdpClient() {
  const version = await fetch(`${CDP_URL}/json/version`).then((r) => r.json());
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let id = 0;
  const pending = new Map();
  const listeners = [];

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result ?? {});
      return;
    }
    for (const listener of listeners) listener(message);
  });

  const send = (method, params = {}, sessionId) => {
    const callId = ++id;
    ws.send(JSON.stringify({ id: callId, method, params, sessionId }));
    return withTimeout(
      new Promise((resolve, reject) => pending.set(callId, { resolve, reject })),
      method
    ).catch((error) => {
      pending.delete(callId);
      throw error;
    });
  };

  return { send, onEvent: (fn) => listeners.push(fn), close: () => ws.close() };
}

function authExpression() {
  return `
    localStorage.setItem('dental_user', JSON.stringify({
      id: 'demo-complete',
      name: 'Complete Package Demo',
      email: 'demo@summitaisoftware.com',
      role: 'complete',
      office: 'Summit Demo Practice'
    }));
    localStorage.setItem('dental_demo_role', 'complete');
  `;
}

const collectButtonsExpression = `(() => {
  const skipText = /^(log out|logout|sign out)$/i;
  const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
  return buttons
    .map((button, index) => {
      const rect = button.getBoundingClientRect();
      const style = window.getComputedStyle(button);
      const text = (button.innerText || button.textContent || '').replace(/\\s+/g, ' ').trim();
      const label = button.getAttribute('aria-label') || button.getAttribute('title') || text || '(icon button)';
      return {
        index,
        label,
        text,
        disabled: Boolean(button.disabled || button.getAttribute('aria-disabled') === 'true'),
        visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none',
        skip: skipText.test(text) || skipText.test(label),
        signature: [location.pathname, index, label, Math.round(rect.left), Math.round(rect.top)].join('|')
      };
    })
    .filter((button) => button.visible && !button.disabled && !button.skip);
})()`;

function clickExpression(signature) {
  return `(() => {
    const targetSignature = ${JSON.stringify(signature)};
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    const candidates = buttons.map((button, index) => {
      const rect = button.getBoundingClientRect();
      const text = (button.innerText || button.textContent || '').replace(/\\s+/g, ' ').trim();
      const label = button.getAttribute('aria-label') || button.getAttribute('title') || text || '(icon button)';
      return { button, signature: [location.pathname, index, label, Math.round(rect.left), Math.round(rect.top)].join('|') };
    });
    const candidate = candidates.find((item) => item.signature === targetSignature);
    if (!candidate) return { clicked: false, reason: 'button disappeared' };
    candidate.button.scrollIntoView({ block: 'center', inline: 'center' });
    candidate.button.click();
    return { clicked: true };
  })()`;
}

async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true }, sessionId);
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
  }
  return result.result?.value;
}

async function navigate(cdp, sessionId, route) {
  console.log(`[route] ${route}`);
  await cdp.send('Page.navigate', { url: `${APP_URL}${route}` }, sessionId);
  await sleep(900);
  await evaluate(cdp, sessionId, authExpression());
  await sleep(350);
}

async function main() {
  await health();
  const cdp = await cdpClient();
  const target = await cdp.send('Target.createTarget', { url: `${APP_URL}/login` });
  const attached = await cdp.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;

  const runtimeErrors = [];
  const pageErrors = [];
  const serverErrors = [];

  cdp.onEvent((message) => {
    if (message.sessionId !== sessionId) return;
    if (message.method === 'Runtime.exceptionThrown') {
      runtimeErrors.push(message.params.exceptionDetails?.text || 'Runtime exception');
    }
    if (message.method === 'Log.entryAdded' && message.params.entry?.level === 'error') {
      pageErrors.push(message.params.entry.text);
    }
    if (message.method === 'Network.responseReceived') {
      const response = message.params.response;
      if (response.status >= 500) {
        serverErrors.push(`${response.status} ${response.url}`);
      }
    }
  });

  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Log.enable', {}, sessionId);
  await cdp.send('Network.enable', {}, sessionId);
  await cdp.send('Page.enable', {}, sessionId);

  const failures = [];
  const clicked = [];

  for (let round = 1; round <= ROUNDS; round += 1) {
    for (const route of routes) {
      await navigate(cdp, sessionId, route);
      const seen = new Set();

      for (let clickNumber = 1; clickNumber <= MAX_CLICKS_PER_ROUTE; clickNumber += 1) {
        const buttons = await evaluate(cdp, sessionId, collectButtonsExpression);
        const button = buttons.find((item) => !seen.has(item.signature));
        if (!button) break;
        seen.add(button.signature);

        const before = {
          runtime: runtimeErrors.length,
          page: pageErrors.length,
          server: serverErrors.length,
        };

        let clickedResult;
        try {
          clickedResult = await evaluate(cdp, sessionId, clickExpression(button.signature));
          await sleep(650);
          await health();
        } catch (error) {
          failures.push({ round, route, label: button.label, error: error.message });
          await navigate(cdp, sessionId, route);
          continue;
        }

        const afterErrors = [
          ...runtimeErrors.slice(before.runtime).map((error) => `runtime: ${error}`),
          ...serverErrors.slice(before.server).map((error) => `server: ${error}`),
        ];

        clicked.push({ round, route, label: button.label, clicked: clickedResult?.clicked !== false });

        if (afterErrors.length > 0) {
          failures.push({ round, route, label: button.label, error: afterErrors.join('; ') });
        }

        const path = await evaluate(cdp, sessionId, 'location.pathname');
        if (path === '/login' || path === '/access-denied') {
          await navigate(cdp, sessionId, route);
        }
      }
    }
  }

  await cdp.send('Target.closeTarget', { targetId: target.targetId });
  cdp.close();

  console.log(JSON.stringify({
    rounds: ROUNDS,
    routes: routes.length,
    clicked: clicked.length,
    uniqueClicked: new Set(clicked.map((item) => `${item.route}|${item.label}`)).size,
    failures,
    pageErrors: pageErrors.slice(0, 20),
  }, null, 2));

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
