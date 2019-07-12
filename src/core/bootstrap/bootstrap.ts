import Elara from '../elara';
import Constants from '../constants/constants';

import { MenuElement } from '../../atoms/menu';

import { NotFoundError } from '../errors/errors';
import { fadeWith } from '../animations';
import { ElaraElement } from '../ui/ui';

/**
 * Bootstrap promise
 * 
 * Used for global-loader
 * 
 * @param {string[]} loadables components name to wait
 * @param {ShadowRoot} host hosting shadowRoot
 */
export function promise(loadables: string[], host: ShadowRoot) {
    if(loadables.length === 0) return Promise.resolve();

    const loadPromises = [];
    
    for(const element of loadables){
        const load = new Promise((resolve) => {
            const elem = host.querySelector(element) as Elara.LoadableElement;
            const config = { attributes: true };
            const observer = new MutationObserver((mutation) => {
                if(!mutation.length){ return; }
                if (mutation[0].type == 'attributes' && mutation[0].attributeName === 'loaded') {
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(elem, config);
        });
        loadPromises.push(load);
    }
    
    return Promise.all(loadPromises);
}

/**
 * Load a route with animations
 * 
 * @param {string} route route name without prefix
 * @param {HTMLElement} content HTMLElement to load
 * @param {MenuElement} menu App menu
 * @param {Animation | null} menuFade App menu animation
 */
export async function load (route: string, content: HTMLElement, menu: MenuElement, menuFade: Animation | null): Promise<HTMLElement> {
    const defaultTitle = Constants.title;
    const titleTemplate = '%s | ' + defaultTitle;

    const Component = customElements.get('ui-' + route);
    content.classList.remove('full-width');

    const NotFound = customElements.get('ui-not-found');

    // @tool : disable shadow-root on pages
    /* Component.prototype.createRenderRoot = function() {
        return this;
    };*/

    const loaded = Component ? new Component() : new NotFound(route);

    if(loaded.head && loaded.head.title){
        document.title = titleTemplate.replace('%s', loaded.head.title);
    } else {
        document.title = defaultTitle;
    }

    if(loaded.isFullWidth === true && !content.classList.contains('full-width')){
        content.classList.add('full-width');
    } else if(!loaded.isFullWidth) {
        content.classList.remove('full-width');
    }
    content.appendChild(loaded);
    
    if(loaded instanceof NotFound){
        throw new NotFoundError(route);
    }
    window.scrollTo(0,0);

    if(menu.shown && menuFade === null){
        await ElaraElement().menu(true);
    }

    const handle = window.requestAnimationFrame(async() => {
        if(!loaded.shadowRoot){
            cancelAnimationFrame(handle);
            return;
        }

        const pageContent = loaded.shadowRoot.querySelector('.animated');
        if(!pageContent){
            cancelAnimationFrame(handle);
            return;
        }


        const animation = fadeWith(300, true);			
        const content = pageContent.animate(animation.effect, animation.options);
        await content.finished;
    });

    return loaded;
}