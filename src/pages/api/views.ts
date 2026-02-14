import type { APIRoute } from "astro";
import { supabase } from "../../lib/superbase";

function getPageFromRequest(url: URL) {
  const page = url.searchParams.get("page") ?? "/";
  return page.startsWith("/") ? page : `/${page}`;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const page = getPageFromRequest(url);
    const inc = url.searchParams.get("inc") === "1";

    // OJO: aquí es LET (no const) porque a veces lo vamos a "rellenar"
    let { data: existing, error: selErr } = await supabase
      .from("page_views")
      .select("id, views")
      .eq("page", page)
      .maybeSingle();

    if (selErr) throw selErr;

    // Si no existe, crearla
    if (!existing) {
      const { data: inserted, error: insErr } = await supabase
        .from("page_views")
        .insert({ page, views: 0 })
        .select("id, views")
        .single();

      if (insErr) throw insErr;

      // guardamos la fila en existing para poder seguir (si inc=1)
      existing = inserted;

      // si no incrementa, regresamos 0
      if (!inc) {
        return new Response(JSON.stringify({ page, views: existing.views ?? 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Si inc=1, incrementar
    if (inc) {
      const newViews = (existing.views ?? 0) + 1;

      const { data: updated, error: updErr } = await supabase
        .from("page_views")
        .update({ views: newViews })
        .eq("id", existing.id)
        .select("views")
        .single();

      if (updErr) throw updErr;

      return new Response(JSON.stringify({ page, views: updated.views ?? newViews }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Solo leer
    return new Response(JSON.stringify({ page, views: existing.views ?? 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
