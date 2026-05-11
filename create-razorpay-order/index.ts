// @ts-ignore - Local Node.js TS compiler doesn't support HTTPS imports, but Deno does.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno package
import Razorpay from "npm:razorpay"

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

    const razorpay = new Razorpay({
      key_id: key_id,
      key_secret: key_secret,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${project_id || Date.now()}`,
      notes: {
        project_name: description || 'PayVlt Invoice',
        client_name: client_name || 'N/A'
      }
    });

    return new Response(
      JSON.stringify({ order_id: order.id, key_id, amount }),
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
