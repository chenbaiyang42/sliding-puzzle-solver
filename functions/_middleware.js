// Redirect anyone landing on the default *.pages.dev subdomain to the canonical
// custom domain, so it can't be used as a public entry point.
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname.endsWith('.pages.dev')) {
    const target = 'https://sliding-puzzle-solver.com' + url.pathname + url.search;
    return Response.redirect(target, 301);
  }
  return context.next();
}
