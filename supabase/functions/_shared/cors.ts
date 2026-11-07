/** CORS por lista de origens (ALLOWED_ORIGINS, separadas por vírgula). Puro, testável sob Node. */

export function parseAllowedOrigins(csv: string | null | undefined): string[] {
  return (csv ?? '').split(',').map(o => o.trim().replace(/\/+$/, '')).filter(Boolean);
}

/** Sem origem na lista, não devolve Allow-Origin (o navegador bloqueia). Sempre `Vary: Origin`. */
export function buildCorsHeaders(
  origin: string | null,
  allowed: string[],
  methods: string,
  headers: string
): Record<string, string> {
  const out: Record<string, string> = {
    Vary: 'Origin',
    'Access-Control-Allow-Headers': headers,
    'Access-Control-Allow-Methods': methods,
  };
  if (origin && allowed.includes(origin)) out['Access-Control-Allow-Origin'] = origin;
  return out;
}

export function corsFor(req: Request, methods: string, headers: string): Record<string, string> {
  const env = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno?.env;
  return buildCorsHeaders(
    req.headers.get('Origin'),
    parseAllowedOrigins(env?.get('ALLOWED_ORIGINS')),
    methods,
    headers
  );
}
