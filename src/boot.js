// @ts-check
// @ts-ignore
window.polymerSkipLoadingFontRoboto = true;

const neededElements = [
  'paper-icon-button', 
  'paper-button',
  'iron-icon',
  'iron-image',
  'paper-input',
  'paper-spinner'
];

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
      <h4>
        ${error.continue == true ? `
          Oops.
          ` : `
          Error detected, please reload.
          `}
      </h4>
      <p>${error.message}</p>
      <div class="actions">
        ${error.continue == true ? '<paper-button class="continue" onclick="dismiss()">Dismiss</paper-button>' : ''}
        <paper-button class="reload" onclick="reload()" raised toggles>Reload</paper-button>
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
    });
  });
}

function _onGenericError(event) {
  if(event.error && event.error.elara === true){ 
    console.warn('Elara error ::', event.error);
    event.preventDefault();
    event.stopPropagation();
    return; 
  }

  document.body.appendChild(makeGenericHandler(event.error));
}

function _onUnload(){
  window.removeEventListener('error', _onGenericError);
}

(() => {
  document.addEventListener('DOMContentLoaded', _onDomLoaded, {passive: true});
  document.addEventListener('unload', _onUnload, {passive: true});
  window.addEventListener('error', _onGenericError, {passive: true});
})();