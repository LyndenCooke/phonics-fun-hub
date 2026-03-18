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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const { product_id } = await req.json();
    if (!product_id) {
      return new Response(JSON.stringify({ error: "product_id required" }), { status: 400, headers: corsHeaders });
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return new Response(JSON.stringify({ error: "Product not found" }), { status: 404, headers: corsHeaders });
    }

    // Free sample: directly grant books
    if (product.product_type === "free_sample") {
      const { data: freeBooks } = await supabaseAdmin
        .from("books")
        .select("id")
        .eq("is_free_sample", true);

      if (freeBooks) {
        for (const book of freeBooks) {
          await supabaseAdmin.from("user_books").upsert(
            { user_id: userId, book_id: book.id, source: "free_sample" },
            { onConflict: "user_id,book_id" }
          );
        }
      }

      return new Response(JSON.stringify({ success: true, free: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Paid products: create Stripe checkout
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), { status: 500, headers: corsHeaders });
    }

    if (!product.stripe_price_id) {
      return new Response(JSON.stringify({ error: "Product has no Stripe price configured" }), { status: 400, headers: corsHeaders });
    }

    const { data: profile } = await supabaseAdmin.from("profiles").select("email").eq("id", userId).single();

    const mode = product.product_type === "subscription" ? "subscription" : "payment";

    const body = new URLSearchParams({
      mode,
      "line_items[0][price]": product.stripe_price_id,
      "line_items[0][quantity]": "1",
      success_url: `${req.headers.get("origin") || "https://myphonicsbooks.com"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin") || "https://myphonicsbooks.com"}/shop`,
      client_reference_id: userId,
      "metadata[product_id]": product.id,
      "metadata[product_type]": product.product_type,
      currency: "gbp",
    });

    if (profile?.email) {
      body.set("customer_email", profile.email);
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      return new Response(JSON.stringify({ error: session.error?.message || "Stripe error" }), { status: 400, headers: corsHeaders });
    }

    // Create pending purchase
    await supabaseAdmin.from("purchases").insert({
      user_id: userId,
      product_id: product.id,
      stripe_session_id: session.id,
      amount_paid: product.price_pence,
      currency: "gbp",
      status: "pending",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
