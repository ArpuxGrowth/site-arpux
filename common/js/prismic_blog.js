const repo = 'sarpuxblog.prismic.io'

// 1) Pega o JSON do /api/v2 para descobrir a ref atual
async function getRef() {
    const res = await fetch(`https://${repo}/api/v2`)
    const json = await res.json()
    // pega a ref marcada como 'master'
    return json.refs.find(r => r.id === 'master').ref
}

// 2) Busca os posts usando at(document.type, "blog_post")
async function fetchPosts(ref) {
    const q = encodeURIComponent('[[:d = at(document.type,"blog_post")]]')
    const url = `https://${repo}/api/v2/documents/search?ref=${ref}&q=${q}&pageSize=19&orderings=[my.blog_post.date%20desc]`
    const res = await fetch(url)
    const json = await res.json()
    return json.results
}

// 3) Renderiza exatamente como no exemplo anterior
function render(posts) {
    const container = document.getElementById('blog-posts')
    posts.forEach(doc => {
    const title = doc.data.title[0].text
    const date  = new Date(doc.data.date).toLocaleDateString('pt-BR')
    const excerpt = doc.data.description[0].text.slice(0, 320) + '…'
    const content = doc.data.content
    const imgUrl = doc.data.cover_image.url

    const item = document.createElement('div')
    item.className = 'item mb-80'
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
            <img src=${imgUrl} alt="">
        </div>
        <div class="cont mt-30">
            <span class="sub-color fz-14 text-u mb-15">
                <a href="#0"><i class="fa-solid fa-tag mr-10 opacity-7"></i> Vendas</a>
            </span>
            <h3>
                <a href="blog/secretaria-ou-pacientes.html">${title}</a>
            </h3>
            <div class="text mt-25">
                <a href="blog/secretaria-ou-pacientes.html">
                    <p>${excerpt}</p>
                </a>
            </div>
        </div>
    `
    container.appendChild(item)
    })
}

// jura carregar tudo
document.addEventListener('DOMContentLoaded', async () => {
    try {
    const ref   = await getRef()
    const posts = await fetchPosts(ref)
    render(posts)
    } catch (e) {
    console.error(e)
    }
})