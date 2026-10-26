import type { APIRoute } from "astro";
import { getDatabase } from "@netlify/database";

export const prerender = false;

function getPageFromRequest(url: URL) {
  const page = url.searchParams.get("page") ?? "/";
  return page.startsWith("/") ? page : `/${page}`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const page = getPageFromRequest(url);
    const inc = url.searchParams.get("inc") === "1";

    if (page.length > 200) {
      return json({ error: "page demasiado largo" }, 400);
    }

    const db = getDatabase();

    // Incrementar: crea la fila si no existe y suma 1 en una sola consulta
    if (inc) {
      const [row] = await db.sql<{ views: number }>`
        INSERT INTO page_views (page, views)
        VALUES (${page}, 1)
        ON CONFLICT (page) DO UPDATE SET views = page_views.views + 1
        RETURNING views
      `;
      return json({ page, views: row.views });
    }

    // Solo leer
    const [row] = await db.sql<{ views: number }>`
      SELECT views FROM page_views WHERE page = ${page}
    `;
    return json({ page, views: row?.views ?? 0 });
  } catch (e: any) {
    return json({ error: e?.message ?? "Error" }, 500);
  }
};
