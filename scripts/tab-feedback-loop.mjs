const BASE_URL = process.env.APP_URL || 'http://127.0.0.1:5173';
const CDP_URL = process.env.CDP_URL || 'http://127.0.0.1:9222';

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
    return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }));
  };

  return { send, onEvent: (fn) => listeners.push(fn), close: () => ws.close() };
}

async function main() {
  const cdp = await cdpClient();
  const target = await cdp.send('Target.createTarget', { url: `${BASE_URL}/` });
  const attached = await cdp.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;

  const runtimeErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  cdp.onEvent((message) => {
    if (message.sessionId !== sessionId) return;
    if (message.method === 'Runtime.exceptionThrown') {
      runtimeErrors.push(message.params.exceptionDetails?.text || 'Runtime exception');
    }
    if (message.method === 'Log.entryAdded') {
      const entry = message.params.entry;
      if (entry.level === 'error') pageErrors.push(entry.text);
    }
    if (message.method === 'Network.loadingFailed') {
      failedRequests.push(message.params.errorText);
    }
    if (message.method === 'Network.responseReceived') {
      const response = message.params.response;
      if (response.status >= 500) {
        failedRequests.push(`${response.status} ${response.url}`);
      }
    }
  });

  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Log.enable', {}, sessionId);
  await cdp.send('Network.enable', {}, sessionId);
  await cdp.send('Page.enable', {}, sessionId);

  await cdp.send('Page.navigate', { url: `${BASE_URL}/login` }, sessionId);
  await sleep(700);
  await cdp.send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('dental_user', JSON.stringify({
        id: 'demo-complete',
        name: 'Complete Package Demo',
        email: 'demo@summitaisoftware.com',
        role: 'complete',
        office: 'Summit Demo Practice'
      }));
      localStorage.setItem('dental_demo_role', 'complete');
    `,
  }, sessionId);

  const results = [];
  for (const route of routes) {
    runtimeErrors.length = 0;
    pageErrors.length = 0;
    failedRequests.length = 0;

    await cdp.send('Page.navigate', { url: `${BASE_URL}${route}` }, sessionId);
    await sleep(1600);

    const evaluated = await cdp.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const root = document.querySelector('#root');
        const text = root?.innerText || '';
        const h1 = document.querySelector('h1')?.innerText || '';
        const cards = document.querySelectorAll('.card, table tbody tr, [class*="grid"] > div').length;
        const crashText = /Something went wrong|Failed to load|Failed to start/i.test(text);
        const emptyText = /No .*found|No .*yet|No data/i.test(text);
        return {
          path: location.pathname,
          title: h1,
          textLength: text.trim().length,
          cards,
          crashText,
          emptyText,
          body: text.slice(0, 240)
        };
      })()`,
    }, sessionId);

    const value = evaluated.result.value;
    const ok =
      value.path === route &&
      value.textLength > 80 &&
      !value.crashText &&
      runtimeErrors.length === 0;

    results.push({
      route,
      ok,
      title: value.title,
      textLength: value.textLength,
      cards: value.cards,
      emptyText: value.emptyText,
      runtimeErrors: [...runtimeErrors],
      pageErrors: [...pageErrors],
      failedRequests: [...failedRequests],
      body: value.body,
    });
  }

  await cdp.send('Target.closeTarget', { targetId: target.targetId });
  cdp.close();

  const failures = results.filter((result) => !result.ok);
  for (const result of results) {
    const status = result.ok ? 'PASS' : 'FAIL';
    console.log(`${status} ${result.route} | ${result.title || '(no h1)'} | text=${result.textLength} cards=${result.cards}`);
    if (!result.ok) {
      console.log(`  body=${JSON.stringify(result.body)}`);
      if (result.runtimeErrors.length) console.log(`  runtime=${JSON.stringify(result.runtimeErrors)}`);
      if (result.pageErrors.length) console.log(`  page=${JSON.stringify(result.pageErrors)}`);
      if (result.failedRequests.length) console.log(`  network=${JSON.stringify(result.failedRequests)}`);
    }
  }

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
