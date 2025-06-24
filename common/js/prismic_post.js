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
    const coverImg = data.cover_image?.url;
    console.log("Imagem de capa:", coverImg);
    const image_1 = data.image_01?.url;
    const image_2 = data.image_02?.url;
    const content_1 = data.content_1;
    console.log("Imagem 1:", image_1);
    const content_2 = data.content_2;

    // define o 'title' da página
    document.title = title + ' | Blog Arpux';

    const header = document.getElementById('article-header')

    header.innerHTML = `
        <div class="container-xl bg-img mt-80" style="background-image:url('${coverImg}');" data-overlay-dark="4">
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

function renderContent(contentArray) {
  let html = '';
  let inList = false;

  for (const block of contentArray) {
    switch (block.type) {
      case 'list-item':
        // se ainda não abrimos a lista, abra agora
        if (!inList) {
          html += '<ul class="rest unorder-list mb-30">';
          inList = true;
        }
        html += `<li>${block.text}</li>`;
        break;

      default:
        // se estivermos dentro de uma lista, feche antes de sair dela
        if (inList) {
          html += '</ul>';
          inList = false;
        }

        // renderiza demais tipos
        if (block.type === 'paragraph') {
          html += `<p class="text mb-20">${block.text}</p>`;
        } else if (block.type.startsWith('heading')) {
          // pega o número do heading dinamicamente
          const level = block.type.slice(-1);
          html += `<h${level} class="title mb-30">${block.text}</h${level}>`;
        } else if (block.type === 'image') {
          html += `<img src="${block.url}" alt="${block.alt}">`;
        }
        break;
    }
  }

  // se terminou ainda dentro de <ul>, feche
  if (inList) {
    html += '</ul>';
  }

  return html;
}

    const articleContent_1 = document.getElementById('content-1')
    articleContent_1.innerHTML = renderContent(content_1);

    const articleImg = document.getElementById('content-image')
    articleImg.innerHTML = `
        <div class="row">
            <div class="col-sm-6">
                <div class="iner-img sm-mb30">
                    <img src=${image_1} alt="">
                </div>
            </div>
            <div class="col-sm-6">
                <div class="iner-img">
                    <img src=${image_2} alt="">
                </div>
            </div>
        </div>
    `

    const articleContent_2 = document.getElementById('content-2')
    articleContent_2.innerHTML = renderContent(content_2);

    const articleTag = document.getElementById('article-tag');
    articleTag.innerHTML = `
        <a href="#">${tag}</a>
    `

}

document.addEventListener('DOMContentLoaded', async () => {
  // tira eventual slash extra no fim e depois extrai o slug
  const pathname = window.location.pathname.replace(/\/$/, '');
  const parts = pathname.split('/');
  //   ['/blog','meu-slug']
  const uid = parts[parts.length - 1] || '';

  if (!uid) {
    const target = document.getElementById('content-1');
    if (target) target.textContent = 'Post não encontrado.';
    return;
  }

  try {
    // 2. busca a ref + o post
    const ref = await getRef();
    const doc = await fetchPostByUID(ref, uid);
    if (!doc) throw new Error('Documento não retornado');
    // 3. renderiza
    renderPost(doc);
  } catch (e) {
    console.error('Erro ao carregar post:', e);
    const target = document.getElementById('content-1');
    if (target) target.textContent = 'Erro ao carregar post.';
  }
});