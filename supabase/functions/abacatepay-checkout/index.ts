/**
 * Supabase Edge Function: abacatepay-checkout
 *
 * Gera uma cobrança PIX na AbacatePay (https://api.abacatepay.com/v1/billing/create)
 * para o Plano Pro Mensal (R$ 19,90 = 1990 centavos) ou Anual (R$ 178,80 = 17880 centavos).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PLAN_CATALOG = {
  pro_monthly: {
    externalId: 'studytrack_pro_monthly',
    name: 'StudyTrack Pro — Assinatura Mensal (31 dias)',
    priceCents: 1990,
  },
  pro_annual: {
    externalId: 'studytrack_pro_annual',
    name: 'StudyTrack Pro — Assinatura Anual (366 dias)',
    priceCents: 17880,
  },
} as const;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Método não permitido.' }, { status: 405, headers: CORS_HEADERS });
  }

  const abacateApiKey = Deno.env.get('ABACATEPAY_API_KEY');
  const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://vitoriapac.github.io/Extrato/';

  if (!abacateApiKey) {
    return Response.json(
      { error: 'Chave ABACATEPAY_API_KEY não configurada no servidor.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return Response.json({ error: 'Autenticação necessária.' }, { status: 401, headers: CORS_HEADERS });
  }

  const supabaseUserClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
  } = await supabaseUserClient.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Sessão inválida.' }, { status: 401, headers: CORS_HEADERS });
  }

  const body = await req.json();
  const planKey = body?.planId === 'pro_monthly' ? 'pro_monthly' : 'pro_annual';
  const plan = PLAN_CATALOG[planKey];

  const abacateResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${abacateApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      frequency: 'ONE_TIME',
      methods: ['PIX'],
      products: [
        {
          externalId: plan.externalId,
          name: plan.name,
          quantity: 1,
          price: plan.priceCents,
        },
      ],
      returnUrl: appBaseUrl,
      completionUrl: `${appBaseUrl}?checkout=success&plan=${planKey}`,
      customer: {
        email: body?.customer?.email || user.email,
        name: body?.customer?.name || undefined,
        taxId: body?.customer?.taxId || undefined,
        cellphone: body?.customer?.cellphone || undefined,
      },
      metadata: {
        userId: user.id,
        planId: planKey,
      },
    }),
  });

  if (!abacateResponse.ok) {
    const errorText = await abacateResponse.text();
    return Response.json(
      { error: `Falha na AbacatePay: ${errorText}` },
      { status: 502, headers: CORS_HEADERS }
    );
  }

  const result = await abacateResponse.json();
  const billingData = result?.data;

  // Registra pedido usando Service Role
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  if (billingData?.id) {
    await supabaseAdmin.from('billing_orders').insert({
      user_id: user.id,
      provider_billing_id: billingData.id,
      plan_id: planKey,
      amount_cents: plan.priceCents,
      status: 'PENDING',
      checkout_url: billingData.url || null,
    });
  }

  return Response.json(
    {
      billingId: billingData?.id,
      checkoutUrl: billingData?.url,
    },
    { headers: CORS_HEADERS }
  );
});
