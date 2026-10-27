/*
  PostHog do site da Arpux (projeto "Arpux", id 692657, organização Arpux).
  O token é a chave pública de captura do projeto, feita para ficar no
  navegador; o site é estático, então não há variável de ambiente.

  Eventos (as ações e o funil no PostHog dependem destes nomes):
  - contact_cta_clicked        clique em "Entre em contato" (abre o formulário HubSpot)
  - lead_form_submitted        envio do formulário HubSpot (conversão principal)
  - contact_page_link_clicked  clique em link para contato.html
  - social_link_clicked        clique em Instagram ou LinkedIn
  Pageviews, cliques (autocapture), gravações e mapas de calor vêm do SDK.
*/
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

(function () {
  // Previews da Vercel e testes locais não poluem os dados do site.
  var PRODUCTION_HOSTS = ['arpux.com.br', 'www.arpux.com.br'];
  if (PRODUCTION_HOSTS.indexOf(window.location.hostname) === -1) return;

  window.posthog.init('phc_AMQFQdSFf5qkjUXwNiynCBbEzw4svZshmBzszHdKaiwd', {
    api_host: 'https://us.i.posthog.com',
    defaults: '2026-08-30',
    person_profiles: 'identified_only',
  });

  function track(event, properties) {
    var props = properties || {};
    props.page_path = window.location.pathname;
    window.posthog.capture(event, props);
  }

  /** Onde fica o elemento: header, footer ou o id/classe da seção, para comparar CTAs. */
  function locationOf(el) {
    if (el.closest('nav, header')) return 'header';
    if (el.closest('footer')) return 'footer';
    var section = el.closest('section');
    if (!section) return 'page';
    return section.id || (section.className || '').split(' ')[0] || 'section';
  }

  function textOf(el) {
    return (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  // O último CTA clicado vai junto com o envio do formulário, para saber qual botão converte.
  var lastCta = null;

  document.addEventListener(
    'click',
    function (e) {
      var cta = e.target.closest('.open-hubspot-form');
      if (cta) {
        lastCta = { cta_text: textOf(cta), cta_location: locationOf(cta) };
        track('contact_cta_clicked', { cta_text: lastCta.cta_text, cta_location: lastCta.cta_location });
        return;
      }

      var link = e.target.closest('a[href]');
      if (!link) return;
      var href = link.getAttribute('href') || '';

      if (/contato\.html$/.test(href)) {
        track('contact_page_link_clicked', { link_text: textOf(link), cta_location: locationOf(link) });
      } else if (/instagram\.com|linkedin\.com/.test(href)) {
        track('social_link_clicked', {
          network: href.indexOf('linkedin') !== -1 ? 'linkedin' : 'instagram',
          cta_location: locationOf(link),
        });
      }
    },
    true
  );

  // Disparado por hsforms_modal.js no onFormSubmitted do HubSpot.
  document.addEventListener('arpux:lead-submitted', function (e) {
    var detail = e.detail || {};
    track('lead_form_submitted', {
      form_id: detail.formId,
      cta_text: lastCta && lastCta.cta_text,
      cta_location: lastCta && lastCta.cta_location,
    });
  });
})();
