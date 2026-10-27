const fs = require("node:fs");
const path = require("node:path");
const { prismic, client, SITE_URL, postUrl, CACHE_CONTROL } = require("./_prismic");

/**
 * Posts do Prismic em /blog/{uid} (rewrite no vercel.json). O HTML sai pronto
 * do servidor: <head> com título, descrição e canonical, e o corpo com a mesma
 * marcação que common/js/prismic_post.js gera no navegador (que continua
 * rodando e substitui pelo mesmo conteúdo). Antes, todo post chegava ao Google
 * com o título "Carregando...", a mesma meta description fixa e o corpo vazio.
 * Mudou a marcação lá? Mude `renderBody` aqui também.
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
  return html.replace(pattern, () => replacement);
};

/** Mesmo HTML de renderContent() em prismic_post.js, com o texto escapado. */
const renderContent = (blocks = []) => {
  let html = "";
  let inList = false;
  for (const block of blocks) {
    if (block.type === "list-item") {
      if (!inList) {
        html += '<ul class="rest unorder-list mb-30">';
        inList = true;
      }
      html += `<li>${escapeHtml(block.text)}</li>`;
      continue;
    }
    if (inList) {
      html += "</ul>";
      inList = false;
    }
    if (block.type === "paragraph") {
      html += `<p class="text mb-20">${escapeHtml(block.text)}</p>`;
    } else if (block.type.startsWith("heading")) {
      const level = block.type.slice(-1);
      html += `<h${level} class="title mb-30">${escapeHtml(block.text)}</h${level}>`;
    } else if (block.type === "image") {
      html += `<img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt ?? "")}">`;
    }
  }
  return inList ? `${html}</ul>` : html;
};

/** Preenche os contêineres vazios do post.html como renderPost() faz no navegador. */
function renderBody(html, { data }, title, tag) {
  const cover = data.cover_image?.url ?? "";
  const dateText = prismic.asText(data.text_date) || "";
  const header = `<header id="article-header" class="post-header pt-20">
                    <div class="container-xl bg-img mt-80" style="background-image:url('${escapeHtml(cover)}');" data-overlay-dark="4">
                        <div class="row">
                            <div class="col-lg-10">
                                <div class="caption">
                                    <div class="tags fz-14"><a href="#0">${escapeHtml(tag)}</a></div>
                                    <h1 class="fz-55 mt-30">${escapeHtml(title)}</h1>
                                </div>
                                <div class="info d-flex mt-40 align-items-center">
                                    <div class="left-info sm-mb30">
                                        <div class="d-flex align-items-center">
                                            <div class="author-info">
                                                <div class="d-flex align-items-center">
                                                    <a href="#0" class="circle-60"><img src="../startup_agency/assets/imgs/blogs/post/a1.jpg" alt="" class="circle-img"></a>
                                                    <a href="#0" class="ml-20"><span class="opacity-7 mb-5">Autor</span><h6 class="fz-16">Arthur B</h6></a>
                                                </div>
                                            </div>
                                            <div class="date ml-50">
                                                <a href="#0"><span class="opacity-7 mb-5">Publicado</span><h6 class="fz-16">${escapeHtml(dateText)}</h6></a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>`;
  const images = [data.image_01?.url, data.image_02?.url].filter(Boolean);
  const imageRow = images.length
    ? `<div class="row">${images
        .map(
          (src, i) =>
            `<div class="col-sm-6"><div class="iner-img${i === 0 ? " sm-mb30" : ""}"><img src="${escapeHtml(src)}" alt=""></div></div>`,
        )
        .join("")}</div>`
    : "";

  html = replaceOnce(html, /<header id="article-header"[^>]*>[\s\S]*?<\/header>/, header);
  html = replaceOnce(html, /(<article id="content-1">)[\s\S]*?(<\/article>)/, `<article id="content-1">${renderContent(data.content_1)}</article>`);
  html = replaceOnce(html, /(<div id="content-image"[^>]*>)\s*<!--[\s\S]*?-->\s*(<\/div>)/, `<div id="content-image" class="mb-50 mt-50">${imageRow}</div>`);
  html = replaceOnce(html, /(<article id="content-2">)[\s\S]*?(<\/article>)/, `<article id="content-2">${renderContent(data.content_2)}</article>`);
  html = replaceOnce(html, /<div id="article-tag">\s*<\/div>/, `<div id="article-tag"><a href="#">${escapeHtml(tag)}</a></div>`);
  return html;
}

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
  return renderBody(html, doc, title, tag);
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
