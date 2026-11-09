/**
 * Supabase Edge Function: abacatepay-checkout
 *
 * Gera uma cobrança PIX na AbacatePay (https://api.abacatepay.com/v1/billing/create)
 * para o Plano Pro Mensal (R$ 19,90 = 1990 centavos) ou Anual (R$ 178,80 = 17880 centavos).
 */

import { corsFor } from '../_shared/cors.ts';
import { MAX_CHECKOUT_BODY_BYTES, parseCustomer } from '../_shared/request-validation.ts';
import { createClient } from '../_shared/supabase.ts';

const PLAN_CATALOG = {
  pro_monthly: {
    externalId: 'studytrack_pro_monthly',
    name: 'Extrato de Estudos Pro — Assinatura Mensal (31 dias)',
    priceCents: 1990,
  },
  pro_annual: {
    externalId: 'studytrack_pro_annual',
    name: 'Extrato de Estudos Pro — Assinatura Anual (366 dias)',
    priceCents: 17880,
  },
} as const;

Deno.serve(async (req: Request) => {
  const CORS_HEADERS = corsFor(req, 'POST, OPTIONS', 'authorization, x-client-info, apikey, content-type');
  const fail = (error: string, status: number) => Response.json({ error }, { status, headers: CORS_HEADERS });

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') return fail('Método não permitido.', 405);

  const abacateApiKey = Deno.env.get('ABACATEPAY_API_KEY');
  const appBaseUrl = Deno.env.get('APP_BASE_URL');

  if (!abacateApiKey || !appBaseUrl) {
    console.error('checkout: ABACATEPAY_API_KEY ou APP_BASE_URL ausente');
    return fail('Serviço indisponível.', 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return fail('Autenticação necessária.', 401);

  const supabaseUserClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
  } = await supabaseUserClient.auth.getUser();

  if (!user) return fail('Sessão inválida.', 401);

  let body: Record<string, unknown> | null;
  try {
    if (Number(req.headers.get('content-length') ?? 0) > MAX_CHECKOUT_BODY_BYTES) {
      return fail('Corpo grande demais.', 413);
    }
    const raw = await req.text();
    if (raw.length > MAX_CHECKOUT_BODY_BYTES) return fail('Corpo grande demais.', 413);
    body = JSON.parse(raw);
  } catch {
    return fail('Requisição inválida.', 400);
  }
  const planKey = body?.planId === 'pro_monthly' ? 'pro_monthly' : 'pro_annual';
  const plan = PLAN_CATALOG[planKey];
  const paymentMethod: 'pix' | 'card' = body?.paymentMethod === 'card' ? 'card' : 'pix';
  const installments =
    paymentMethod === 'card' && planKey === 'pro_annual'
      ? Math.min(12, Math.max(1, Number(body?.installments) || 12))
      : 1;

  const customer = parseCustomer(body?.customer);
  if ('error' in customer) return fail(customer.error, 400);

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Rate limit: um pedido PENDING nos últimos 60 s bloqueia novo checkout.
  const since = new Date(Date.now() - 60_000).toISOString();
  const { data: recent, error: recentError } = await supabaseAdmin
    .from('billing_orders')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'PENDING')
    .gte('created_at', since)
    .limit(1);
  if (recentError) {
    console.error('checkout: falha ao consultar pedidos recentes', recentError.message);
    return fail('Falha interna.', 500);
  }
  if (recent && recent.length > 0) return fail('Aguarde um minuto para gerar outro checkout.', 429);

  const abacateResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${abacateApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      frequency: paymentMethod === 'card' && planKey === 'pro_monthly' ? 'MONTHLY' : 'ONE_TIME',
      methods: paymentMethod === 'card' ? ['CARD'] : ['PIX'],
      products: [
        {
          externalId: plan.externalId,
          name: plan.name,
          quantity: 1,
          price: plan.priceCents,
        },
      ],
      returnUrl: appBaseUrl,
      completionUrl: `${appBaseUrl}?checkout=success&plan=${planKey}&method=${paymentMethod}`,
      customer: {
        email: customer.email || user.email,
        name: customer.name,
        taxId: customer.taxId,
        cellphone: customer.cellphone,
      },
      metadata: {
        userId: user.id,
        planId: planKey,
        paymentMethod,
        installments,
      },
    }),
  });

  if (!abacateResponse.ok) {
    console.error('checkout: AbacatePay respondeu', abacateResponse.status, await abacateResponse.text());
    return fail('Falha ao criar a cobrança.', 502);
  }

  const billingData = (await abacateResponse.json().catch(() => null))?.data;
  if (!billingData?.id || !billingData?.url) {
    console.error('checkout: resposta da AbacatePay sem id/url');
    return fail('Falha ao criar a cobrança.', 502);
  }

  // Sem pedido registrado o webhook não casa o pagamento: falha aqui, não devolve o checkout.
  const { error: insertError } = await supabaseAdmin.from('billing_orders').insert({
    user_id: user.id,
    provider_billing_id: billingData.id,
    plan_id: planKey,
    payment_method: paymentMethod,
    installments,
    amount_cents: plan.priceCents,
    status: 'PENDING',
    checkout_url: billingData.url,
  });
  if (insertError) {
    console.error('checkout: falha ao registrar pedido', billingData.id, insertError.message);
    return fail('Falha ao registrar o pedido.', 500);
  }

  return Response.json(
    {
      billingId: billingData.id,
      checkoutUrl: billingData.url,
      paymentMethod,
      installments,
    },
    { headers: CORS_HEADERS }
  );
});
