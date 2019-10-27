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
  if(error){
    handler.classList.add('in-error');
  }
  handler.innerHTML = `
  <style>
  .dot {
    width: 12px;
    height: 12px;
    background: #fcfcfc;
    border-radius: 50%;
    position: absolute;
    top: 4%;
    right: 6%;
  }
  button {
    cursor: pointer;
    line-height: 2em;
    background: #fcfcfc;
    border-radius: 10px;
    outline: 0;
    border: none;
    box-shadow: 2px 2px 10px rgba(119, 119, 119, 0.5);
    transition: all 0.5s ease-in-out;
    font-size: 0.9em;
    font-weight: 100;
    letter-spacing: 2px;
    margin: .5em;
  }
  button:hover {
    background: #efefef;
    transform: scale(1.05);
    transition: all 0.3s ease-in-out;
  }
  .dot:hover {
    background: #c9c9c9;
  }
  </style>
  <div class="dot"></div>
  <div class="content">
    ${error !== null ? `
      <h4>Une erreur est survenue.</h4>
      ${error.message ? `<p>${error.message}</p>` : ''}
      <div class="actions">
        ${error.continue == true ? '<button class="button-box continue" onclick="dismiss()">Continuer</button>' : ''}
        <button class="reload" onclick="reload()" raised toggles>Réessayer</button>
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
  
  handler.querySelector('.dot').addEventListener('click', () => {
    handler.parentElement.removeChild(handler);
  });

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