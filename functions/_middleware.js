const PVUV_CRAWLERS = /chatgpt-user|oai-searchbot|gptbot|perplexity-user|perplexitybot|claude-user|claude-searchbot|claudebot|bingbot|googlebot|applebot|duckduckbot|duckassistbot|yandexbot|meta-externalagent|bytespider/i;
const PVUV_ASSET = /\.(?!(?:html?|txt|xml|md)$)[a-z0-9]{1,8}$/i;

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname.endsWith('.pages.dev')) {
    const target = 'https://sliding-puzzle-solver.com' + url.pathname + url.search;
    return Response.redirect(target, 301);
  }
  const response = await context.next();
  // pvuv.ai crawler sync — report AI crawler page fetches without blocking the response
  try {
    const ua = context.request.headers.get('user-agent') || '';
    const path = url.pathname;
    if (
      (context.request.method === 'GET' || context.request.method === 'HEAD') &&
      PVUV_CRAWLERS.test(ua) &&
      !path.startsWith('/api/') &&
      !path.startsWith('/_') &&
      !PVUV_ASSET.test(path) &&
      context.env.PVUV_INGEST_TOKEN
    ) {
      context.waitUntil(
        fetch(`https://api.pvuv.ai/v1/sites/${context.env.PVUV_SITE || 'Ynj7hCfK'}/crawler_hits`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${context.env.PVUV_INGEST_TOKEN}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            hits: [
              {
                ua,
                path,
                ip: context.request.headers.get('cf-connecting-ip') || undefined,
                status: response.status,
                ts: Date.now(),
              },
            ],
          }),
        }).catch(() => {})
      );
    }
  } catch {}
  return response;
}
