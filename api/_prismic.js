const prismic = require("@prismicio/client");

/**
 * Posts do blog no Prismic (repositório arpuxblog), os mesmos que
 * common/js/prismic_post.js e prismic_blog.js leem no navegador.
 */
const SITE_URL = "https://arpux.com.br";
const client = prismic.createClient("arpuxblog");

const postUrl = (uid) => `${SITE_URL}/blog/${uid}`;

/** CDN guarda 5 minutos; depois serve o antigo enquanto busca o novo. */
const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=86400";

module.exports = { prismic, client, SITE_URL, postUrl, CACHE_CONTROL };
