const repo = 'arpuxblog.prismic.io'

// 1) Pega o JSON do /api/v2 para descobrir a ref atual
async function getRef() {
    const res = await fetch(`https://${repo}/api/v2`)
    const json = await res.json()
    // pega a ref marcada como 'master'
    return json.refs.find(r => r.id === 'master').ref
}

// 2) Busca os posts usando at(document.type, "blog_post")
// async function fetchPosts(ref) {
//     const q = encodeURIComponent('[[:d = at(document.type,"blog_post")]]')
//     const url = `https://${repo}/api/v2/documents/search?ref=${ref}&q=${q}&pageSize=19&orderings=[my.blog_post.date%20desc]`
//     const res = await fetch(url)
//     const json = await res.json()
//     return json.results
// }
async function fetchPostsByUrl(url) {
  const res  = await fetch(url);
  const json = await res.json();
  return json;
}

// 3) Renderiza exatamente como no exemplo anterior
// function render(posts) {
//     const container = document.getElementById('blog-posts')
//     posts.forEach(doc => {
    
//     const slug = doc.uid
//     const title = doc.data.title[0].text || 'Título não encontrado.'
//     const description = doc.data.description[0].text.slice(0, 320) + '…'
//     const tag = doc.data.tag && doc.data.tag.length > 0 ? doc.data.tag[0].text : 'Sem tag'
//     const imgUrl = doc.data.cover_image?.url
//     const date  = new Date(doc.data.date).toLocaleDateString('pt-BR')

//     const item = document.createElement('div')
//     item.className = 'item mb-80'
//     item.innerHTML = `
//         <div class="info d-flex align-items-center">
//             <div class="d-flex align-items-center">
//                 <div>
//                     <div class="author-img fit-img">
//                         <img src="startup_agency/assets/imgs/blogs/blog1/a1.jpg" alt="">
//                     </div>
//                 </div>
//                 <div class="author-info ml-10">
//                     <span>Arthur B</span>
//                     <span class="sub-color">autor</span>
//                 </div>
//             </div>
//             <div class="date ml-auto">
//                 <span class="sub-color"><i
//                         class="fa-regular fa-clock mr-15 opacity-7"></i> Postado em
//                     ${date}</span>
//             </div>
//         </div>
//         <div class="img fit-img mt-30">
//             <img src=${imgUrl} alt="">
//         </div>
//         <div class="cont mt-30">
//             <span class="sub-color fz-14 text-u mb-15">
//                 <a href="#0"><i class="fa-solid fa-tag mr-10 opacity-7"></i> ${tag}</a>
//             </span>
//             <h3>
//                 <a href="blog/${slug}">${title}</a>
//             </h3>
//             <div class="text mt-25">
//                 <a href="blog/${slug}">
//                     <p>${description}</p>
//                 </a>
//             </div>
//         </div>
//     `
//     container.appendChild(item)
//     })
// }
function render(data) {
    const { results, page, total_pages, next_page, prev_page } = data;
    const container  = document.getElementById("blog-posts");
    const pagination = document.getElementById("blog-pagination");

    container.innerHTML  = "";
    pagination.innerHTML = "";

    results.forEach(doc => {
        const slug        = doc.uid;
        const title       = doc.data.title[0]?.text || "Título não encontrado.";
        const description = doc.data.description[0]?.text.slice(0, 320) + "…";
        const tag         = doc.data.tag?.[0]?.text || "Sem tag";
        const imgUrl      = doc.data.cover_image?.url;
        const date        = new Date(doc.data.date).toLocaleDateString("pt-BR");

        const item = document.createElement("div");
        item.className = "item mb-80";
        item.innerHTML = `
            <div class="info d-flex align-items-center">
                <div class="d-flex align-items-center">
                    <div>
                        <div class="author-img fit-img">
                            <img src="startup_agency/assets/imgs/blogs/blog1/a1.jpg" alt="">
                        </div>
                    </div>
                    <div class="author-info ml-10">
                        <span>Arthur B</span>
                        <span class="sub-color">autor</span>
                    </div>
                </div>
                <div class="date ml-auto">
                    <span class="sub-color"><i
                            class="fa-regular fa-clock mr-15 opacity-7"></i> Postado em
                        ${date}</span>
                </div>
            </div>
            <div class="img fit-img mt-30">
                <img src=${imgUrl} alt="${title}">
            </div>
            <div class="cont mt-30">
                <span class="sub-color fz-14 text-u mb-15">
                    <a href="#0"><i class="fa-solid fa-tag mr-10 opacity-7"></i> ${tag}</a>
                </span>
                <h3>
                    <a href="blog/${slug}">${title}</a>
                </h3>
                <div class="text mt-25">
                    <a href="blog/${slug}">
                        <p>${description}</p>
                    </a>
                </div>
            </div>
        `;
        container.appendChild(item);
    });

    // botão Anterior
    const prevDisabled = !prev_page ? "disabled" : "";
    pagination.innerHTML += `
        <li class="page-item ${prevDisabled}" style="padding: 10px 0 !important;">
            <a class="page-link text-small" href="#" data-url="${prev_page}">
                <i class="fa-solid fa-chevron-left icon-extra-small "></i>
            </a>
        </li>`;

    // botões numerados
    for (let i = 1; i <= total_pages; i++) {
        const active = i === page ? "active" : "";
        const url = `https://${repo}/api/v2/documents/search?ref=${currentRef}` +
                    `&q=${encodeURIComponent('[[:d = at(document.type,"blog_post")]]')}` +
                    `&orderings=[my.blog_post.date%20desc]` +
                    `&page=${i}&pageSize=10`;
        pagination.innerHTML += `
            <li class="page-item ${active}">
                <a class="page-link text-small" href="#" data-url="${url}">${String(i).padStart(2,'0')}</a>
            </li>`;
    }

    // botão Próximo
    const nextDisabled = !next_page ? "disabled" : "";
    pagination.innerHTML += `
        <li class="page-item ${nextDisabled}">
            <a class="page-link text-small" href="#" style="padding: 10px 0 !important;" data-url="${next_page}">
                <i class="fa-solid fa-chevron-right icon-extra-small "></i>
            </a>
        </li>`;

    pagination.querySelectorAll("a.page-link").forEach(link => {
        link.addEventListener("click", async e => {
            e.preventDefault();
            const url = link.dataset.url;
            if (!url) return;
            // reflete o novo currentRef caso venha embutido, ou use sempre a mesma ref
            const data = await fetchPostsByUrl(url);
            render(data);
        });
    });
}

let currentRef = null;

// jura carregar tudo
// document.addEventListener('DOMContentLoaded', async () => {
//     try {
//     const ref   = await getRef()
//     const posts = await fetchPosts(ref)
//     render(posts)
//     } catch (e) {
//     console.error('Erro ao carregar lista de posts:', e)
//     }
// })
document.addEventListener("DOMContentLoaded", async () => {
  currentRef = await getRef();
  const initialUrl = 
    `https://${repo}/api/v2/documents/search?ref=${currentRef}` +
    `&q=${encodeURIComponent('[[:d = at(document.type,"blog_post")]]')}` +
    `&orderings=[my.blog_post.date%20desc]` +
    `&page=1&pageSize=10`;
  const data = await fetchPostsByUrl(initialUrl);
  render(data);
});