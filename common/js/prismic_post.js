const repo = 'arpuxblog.prismic.io';

async function getRef() {
    const res  = await fetch(`https://${repo}/api/v2`);
    const json = await res.json();
    return json.refs.find(r => r.id === 'master').ref;
}

async function fetchPostByUID(ref, uid) {
    // busca só o documento que tenha aquele UID
    const q = encodeURIComponent('[[:d = at(document.type,"blog_post")][:d = at(my.blog_post.uid,"' + uid + '")]]');
    const url = `https://${repo}/api/v2/documents/search?ref=${ref}&q=${q}`;
    const res = await fetch(url);
    const json = await res.json();
    return json.results[0];  // recebe apenas um
}

function renderPost(doc) {
    const data = doc.data;
    console.log("Dados do doc:", doc);
    
    const title = data.title[0]?.text || 'Título não encontrado.';
    const tag = data.tag[0].text
    const date = new Date(data.date).toLocaleDateString('pt-BR');
    const dateText = data.text_date[0].text;
    const coverImg = data.cover_img?.url;
    const content = data.content;

    // define o title da página
    document.title = title + ' | Blog Arpux';

    const header = document.getElementById('article-header')

    header.innerHTML = `
        <div class="container-xl bg-img mt-80" data-background="${coverImg}" data-overlay-dark="4">
            <div class="row">
                <div class="col-lg-10">
                    <div class="caption">
                        <div class="tags fz-14">
                            <a href="#0">${tag}</a>
                        </div>
                        <h1 class="fz-55 mt-30">${title}
                        </h1>
                    </div>
                    <div class="info d-flex mt-40 align-items-center">
                        <div class="left-info sm-mb30">
                            <div class="d-flex align-items-center">
                                <div class="author-info">
                                    <div class="d-flex align-items-center">
                                        <a href="#0" class="circle-60">
                                            <img src="../startup_agency/assets/imgs/blogs/post/a1.jpg" alt=""
                                                class="circle-img">
                                        </a>
                                        <a href="#0" class="ml-20">
                                            <span class="opacity-7 mb-5">Autor</span>
                                            <h6 class="fz-16">Arthur B</h6>
                                        </a>
                                    </div>
                                </div>
                                <div class="date ml-50">
                                    <a href="#0">
                                        <span class="opacity-7 mb-5">Publicado</span>
                                        <h6 class="fz-16">${dateText}</h6>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `

    const article = document.getElementById('article')

    article.innerHTML = `
        
    `

}

document.addEventListener('DOMContentLoaded', async () => {
    // 1) pega o uid da query-string
    const params = new URLSearchParams(window.location.search);
    const uid    = params.get('uid');
    if (!uid) {
    return document.getElementById('post-content').textContent = 'Post não encontrado.';
    }

    try {
    // 2) busca a ref + o post
    const ref = await getRef();
    const doc = await fetchPostByUID(ref, uid);
    if (!doc) throw new Error('Documento não retornado');
    // 3) renderiza
    renderPost(doc);
    } catch (e) {
    console.error('Erro ao carregar post:', e);
    document.getElementById('post-content').textContent = 'Erro ao carregar post.';
    }
});