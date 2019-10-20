// @ts-check
// @ts-ignore
window.polymerSkipLoadingFontRoboto = true;

const neededElements = [];

function dismiss(){
  const handler = document.querySelector('#handler');
  handler.parentElement.removeChild(handler);
}

function reload(){
  location.reload();
}

function makeGenericHandler(error = null){
  const handler = document.createElement('div');
  handler.id = handler.className = 'handler';
  handler.innerHTML = `
  <div class="content">
    ${error !== null ? `
      <h4>Oops.</h4>
      ${error.message ? `<p>${error.message}</p>` : ''}
      <div class="actions">
        ${error.continue == true ? '<button class="continue" onclick="dismiss()">Pas grave, je continue.</button>' : ''}
        <button class="reload" onclick="reload()" raised toggles>Rafraîchir</button>
      </div>
    ` : `
    <div id="loader">
      <div id="dot"></div>
      <div class="step" id="s1"></div>
      <div class="step" id="s2"></div>
      <div class="step" id="s3"></div>
    </div>
    `}
  </div>
  `;
  return handler;
}

function _onDomLoaded(){
  let willRemove = false;
  let handler = null;

  document.body.classList.add('scrolling-disabled');

  if(location.hash.indexOf('redirect') !== -1){
    handler = document.querySelector('#handler');
    if(handler){
      willRemove = true;
    }
  } else {
    willRemove = false;
    document.body.appendChild(makeGenericHandler());
  }

  if(willRemove && handler){
    // Remove load handler immediatly on redirect
    handler.parentElement.removeChild(handler);
  }

  const loadingPromises = [
    // When elara is defined we directly run her bootstrap to load website while global loading.
    // We do this to ensure dynamic elements are loaded right on time, and to please lighthouse on main-thread work
    // if we do that while lit-component is ready dom mutations will lead to browser computing time, useless cause it's needed to first paint
    customElements.whenDefined('elara-app').then(() => {
      const elara = document.querySelector('elara-app');
      // @ts-ignore
      return elara.bootstrap;
    })
  ];

  for(const elementName of neededElements){
    loadingPromises.push(customElements.whenDefined(elementName));
  }

  return Promise.all(loadingPromises).then(() => {
    if(!handler){
      handler = document.querySelector('#handler');
    }
    
    window.requestAnimationFrame(() => {
      const spinner = document.querySelector('#spinner');
      const debug = false;
      
      if(debug) return;

      setTimeout(() => {
        if(spinner){
          spinner.parentElement.removeChild(spinner);
        }
        if(handler){
          handler.classList.add('hidden');
          handler.parentElement.removeChild(handler);
        }
  
        document.body.classList.remove('scrolling-disabled');
      }, 500);
    });
  });
}

/**
 *
 *
 * @param {ErrorEvent|CustomEvent<Error>} event
 * @returns
 */
function _onGenericError(event) {
  let willThrow = null;
  if(event instanceof ErrorEvent){
    willThrow = event.error;
  } else {
    willThrow = event.detail;
  }

  document.body.appendChild(makeGenericHandler(willThrow));
}

function _onUnload(){
  window.removeEventListener('error', _onGenericError);
}

(() => {
  document.addEventListener('DOMContentLoaded', _onDomLoaded, {passive: true});
  document.addEventListener('unload', _onUnload, {passive: true});
  window.addEventListener('error', _onGenericError, {passive: true});
})();