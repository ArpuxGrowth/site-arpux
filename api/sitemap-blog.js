const { client, postUrl, CACHE_CONTROL } = require("./_prismic");

/**
 * Sitemap dos posts do Prismic, em /sitemap-blog.xml (rewrite no vercel.json)
 * e listado no robots.txt. O sitemap.xml das páginas fixas continua como está;
 * os posts novos entram aqui sozinhos quando são publicados.
 */
module.exports = async function handler(req, res) {
  try {
    const posts = await client.getAllByType("blog_post", { fetch: ["blog_post.uid"] });
    const urls = posts.map(
      (post) =>
        `  <url>\n    <loc>${postUrl(post.uid)}</loc>\n    <lastmod>${new Date(post.last_publication_date).toISOString()}</lastmod>\n    <priority>0.64</priority>\n  </url>`,
    );
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", CACHE_CONTROL);
    return res
      .status(200)
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
  } catch (error) {
    console.error("blog sitemap failed", error);
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).send("");
  }
};
