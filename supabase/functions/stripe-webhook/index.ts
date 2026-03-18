import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_WEBHOOK_SECRET || !STRIPE_SECRET_KEY) {
      return new Response("Stripe not configured", { status: 500 });
    }

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new Response("No signature", { status: 400 });
    }

    // Verify webhook signature using Stripe's raw approach
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(STRIPE_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const parts = sig.split(",").reduce((acc: Record<string, string>, part) => {
      const [k, v] = part.split("=");
      acc[k] = v;
      return acc;
    }, {});

    const timestamp = parts["t"];
    const expectedSig = parts["v1"];

    const payload = `${timestamp}.${body}`;
    const signatureBytes = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(payload));
    const computedSig = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (computedSig !== expectedSig) {
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(body);
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const productId = session.metadata?.product_id;

      // Update purchase
      await supabaseAdmin
        .from("purchases")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent,
          stripe_customer_id: session.customer,
        })
        .eq("stripe_session_id", session.id);

      // Get product and unlock books
      if (productId) {
        const { data: product } = await supabaseAdmin
          .from("products")
          .select("levels_included")
          .eq("id", productId)
          .single();

        if (product) {
          const { data: books } = await supabaseAdmin
            .from("books")
            .select("id")
            .in("level", product.levels_included);

          if (books) {
            const { data: purchase } = await supabaseAdmin
              .from("purchases")
              .select("id")
              .eq("stripe_session_id", session.id)
              .single();

            for (const book of books) {
              await supabaseAdmin.from("user_books").upsert(
                {
                  user_id: userId,
                  book_id: book.id,
                  source: "purchase",
                  purchase_id: purchase?.id,
                },
                { onConflict: "user_id,book_id" }
              );
            }
          }
        }
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      await supabaseAdmin
        .from("purchases")
        .update({ status: "failed" })
        .eq("stripe_payment_intent_id", paymentIntent.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
