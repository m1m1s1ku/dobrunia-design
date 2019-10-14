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
      <div id="spinner" class="spinner large"></div>
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

  const loadingPromises = [];

  const elara = document.querySelector('elara-app');
  // @ts-ignore
  loadingPromises.push(elara.bootstrap);

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

      if(spinner){
        spinner.parentElement.removeChild(spinner);
      }
      if(handler){
        handler.classList.add('hidden');
        handler.parentElement.removeChild(handler);
      }

      document.body.classList.remove('scrolling-disabled');
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