const fs = require("node:fs");
const path = require("node:path");
const { prismic, client, SITE_URL, postUrl, CACHE_CONTROL } = require("./_prismic");

/**
 * Posts do Prismic em /blog/{uid} (rewrite no vercel.json). O corpo continua
 * sendo montado no navegador por common/js/prismic_post.js; aqui o <head> sai
 * pronto do servidor. Antes, todo post chegava ao Google com o título
 * "Carregando..." e a mesma meta description fixa do template.
 */

const template = fs.readFileSync(path.join(process.cwd(), "blog/post.html"), "utf8");

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Primeiro trecho do texto, cortado em palavra inteira, para a meta description. */
const summary = (field, max = 155) => {
  const text = (prismic.asText(field) ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(" ", max - 1))}…`;
};

const replaceOnce = (html, pattern, replacement) => {
  if (!pattern.test(html)) throw new Error(`post.html mudou: ${pattern} não encontrado`);
  return html.replace(pattern, replacement);
};

function render(doc) {
  const { data } = doc;
  const title = prismic.asText(data.title) || "Blog Arpux";
  const description = summary(data.content_1) || summary(data.content_2);
  const url = postUrl(doc.uid);
  const image = data.cover_image?.url ?? null;
  const published = prismic.asDate(data.date) ?? new Date(doc.first_publication_date);
  const tag = prismic.asText(data.tag);

  const head = [
    `<title>${escapeHtml(title)} | Blog Arpux</title>`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="Arpux">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    image ? `<meta property="og:image" content="${escapeHtml(image)}">` : "",
    `<meta property="article:published_time" content="${published.toISOString()}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      headline: title,
      description,
      image: image ? [image] : undefined,
      datePublished: published.toISOString(),
      dateModified: new Date(doc.last_publication_date).toISOString(),
      inLanguage: "pt-BR",
      articleSection: tag || undefined,
      author: { "@type": "Organization", name: "Arpux", url: SITE_URL },
      publisher: { "@type": "Organization", name: "Arpux", url: SITE_URL },
    }).replace(/</g, "\\u003c")}</script>`,
  ]
    .filter(Boolean)
    .join("\n    ");

  let html = replaceOnce(template, /<title>[^<]*<\/title>/, head);
  html = replaceOnce(
    html,
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escapeHtml(description)}">`,
  );
  // As palavras-chave fixas eram de um único post; o Google ignora a tag, então sai.
  html = html.replace(/\s*<meta name="keywords" content="[^"]*">/, "");
  return html;
}

const notFound = () =>
  template
    .replace(/<title>[^<]*<\/title>/, '<title>Post não encontrado | Blog Arpux</title>\n    <meta name="robots" content="noindex, follow">');

module.exports = async function handler(req, res) {
  const uid = String(req.query.uid ?? "").replace(/\/$/, "");
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  try {
    const doc = uid ? await client.getByUID("blog_post", uid).catch((error) => {
      if (error instanceof prismic.NotFoundError) return null;
      throw error;
    }) : null;

    if (!doc) {
      res.setHeader("Cache-Control", "public, s-maxage=60");
      return res.status(404).send(notFound());
    }
    res.setHeader("Cache-Control", CACHE_CONTROL);
    return res.status(200).send(render(doc));
  } catch (error) {
    console.error("post render failed", { uid, error });
    // Sem o Prismic, devolve o template como antes: o navegador ainda tenta montar o post.
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(template);
  }
};
