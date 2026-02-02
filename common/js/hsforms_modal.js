(() => {
  const HUBSPOT_SCRIPT_SRC = 'https://js.hsforms.net/forms/v2.js';
  let hubspotScriptLoading = false;
  let hubspotScriptLoaded = false;

  function loadHubspotScript() {
    return new Promise((resolve, reject) => {
      if (hubspotScriptLoaded && window.hbspt && window.hbspt.forms) return resolve(window.hbspt);
      if (hubspotScriptLoading) {
        
        const check = setInterval(() => {
          if (hubspotScriptLoaded && window.hbspt) {
            clearInterval(check);
            resolve(window.hbspt);
          }
        }, 200);
        
        setTimeout(() => { if (!hubspotScriptLoaded) reject(new Error('Timeout loading HubSpot script')); }, 10000);
        return;
      }

      hubspotScriptLoading = true;
      const s = document.createElement('script');
      s.src = HUBSPOT_SCRIPT_SRC;
      s.async = true;
      s.onload = () => {
        hubspotScriptLoaded = true;
        hubspotScriptLoading = false;
        resolve(window.hbspt);
      };
      s.onerror = (e) => {
        hubspotScriptLoading = false;
        reject(new Error('Failed to load HubSpot script'));
      };
      document.head.appendChild(s);
    });
  }

  function createModalMarkup(titleText) {
    const overlay = document.createElement('div');
    overlay.className = 'hs-modal-overlay';
    overlay.innerHTML = `
      <div class="hs-modal" role="dialog" aria-modal="true">
        <div class="hs-modal-body">
          <div class="hs-form-target" style="min-height:80px"></div>
        </div>
      </div>
    `;
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
    return overlay;
  }

  function closeModal(overlay) {
    if (!overlay) return;
    
    const formTarget = overlay.querySelector('.hs-form-target');
    if (formTarget) formTarget.innerHTML = '';
    overlay.remove();
  }

  function openHubspotModal(opts = {}) {
    const { portalId, formId, region = 'na1', title = '' } = opts;
    if (!portalId || !formId) {
      console.error('HubSpot modal: portalId and formId required');
      return;
    }

    
    const modal = createModalMarkup(title);
    document.body.appendChild(modal);
    
    modal.querySelector('.hs-modal').scrollTop = 0;

    const target = modal.querySelector('.hs-form-target');

    loadHubspotScript()
      .then((hbspt) => {
        
        try {
          const uniqueId = 'hs-form-' + Date.now();
          target.setAttribute('id', uniqueId);
          window.hbspt.forms.create({
            region: region,
            portalId: portalId,
            formId: formId,
            target: '#' + uniqueId
          });
        } catch (err) {
          console.error('Erro ao criar o formulário HubSpot:', err);
          target.innerHTML = '<p>Erro ao carregar formulário. Tente novamente.</p>';
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar script HubSpot:', err);
        target.innerHTML = '<p>Não foi possível carregar o formulário. Tente novamente mais tarde.</p>';
      });

    return modal;
  }

  function init() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.open-hubspot-form');
      if (!btn) return;
      e.preventDefault();
      const portalId = btn.getAttribute('data-portal-id');
      const formId = btn.getAttribute('data-form-id');
      const region = btn.getAttribute('data-region') || 'na1';
      const title = btn.getAttribute('data-title') || '';
      openHubspotModal({ portalId, formId, region, title });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();