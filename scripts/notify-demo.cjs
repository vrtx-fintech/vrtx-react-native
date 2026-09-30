// One announcement for the selected platforms, including partial failures.
const env = process.env;
async function notify() {
  if (!env.WEBHOOK) {
    console.log(
      '::warning::SLACK_WEBHOOK_URL is not set; skipping announcement.',
    );
    return;
  }
  const links = [
    ['Android preview', env.ANDROID_PREVIEW],
    ['APK', env.APK_URL],
    ['iOS preview', env.IOS_PREVIEW],
    ['iOS simulator', env.SIMULATOR_URL],
    ['IPA', env.IPA_URL],
  ]
    .filter(([, url]) => url)
    .map(([label, url]) => `<${url}|${label}>`)
    .join(' · ');
  const status = `Android: ${env.ANDROID_RESULT} · iOS: ${env.IOS_RESULT} · TestFlight upload: ${env.TESTFLIGHT || 'skipped'}`;
  const payload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `React Native demo ${env.VERSION} (sandbox)`,
        },
      },
      { type: 'section', text: { type: 'mrkdwn', text: status } },
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: (env.NOTES || 'Manual release').slice(0, 2900),
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: links || 'See the workflow run for details.',
          },
        ],
      },
    ],
  };
  try {
    const response = await fetch(env.WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok || (await response.text()).trim() !== 'ok') {
      console.log('::warning::Slack did not accept the release announcement.');
    }
  } catch {
    console.log('::warning::Slack release announcement failed.');
  }
}
notify();
