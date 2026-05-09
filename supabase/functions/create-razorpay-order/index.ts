// @ts-ignore - Local Node.js TS compiler doesn't support HTTPS imports, but Deno does.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Declare Deno to satisfy the local Node.js TypeScript compiler.
// Supabase Edge Functions run in a Deno environment where 'Deno' is globally available.
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, project_id, client_name, description } = await req.json()

    const key_id = Deno.env.get('RAZORPAY_KEY_ID')
    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!key_id || !key_secret) {
      throw new Error("Razorpay keys not configured in Supabase secrets")
    }

    const auth = btoa(`${key_id}:${key_secret}`)

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency: "INR",
        receipt: `receipt_${project_id || Date.now()}`,
        notes: {
          client_name: client_name || 'N/A',
          description: description || 'PayVlt Invoice'
        }
      })
    })

    const orderData = await res.json()

    if (!res.ok) {
      throw new Error(orderData.error?.description || "Failed to create Razorpay order")
    }

    return new Response(
      JSON.stringify({ order_id: orderData.id, key_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
