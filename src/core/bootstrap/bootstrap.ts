import { NotFoundError } from '../errors/errors';
import { fadeWith } from '../animations';
import { Utils } from '../ui/ui';
import Constants from '../../constants';

/**
 * Load a route with animations
 * 
 * @param {string} route route name without prefix
 * @param {HTMLElement} content HTMLElement to load
 */
export async function load (route: string, content: HTMLElement): Promise<HTMLElement> {
    const titleTemplate = '%s | ' + Constants.title;

    const Component = customElements.get('ui-' + route);
    content.classList.remove('full-width');

    const NotFound = customElements.get('ui-not-found');

    // @tool : disable shadow-root on pages
    /* Component.prototype.createRenderRoot = function() {
        return this;
    };*/

    const loaded = Component ? new Component() : new NotFound(route);

    if(loaded.head && loaded.head.title && !loaded.customTitle){
        document.title = titleTemplate.replace('%s', loaded.head.title);
    }

    if(loaded.customTitle){
        document.title = loaded.customTitle;
    }

    if(loaded.isFullWidth === true && !content.classList.contains('full-width')){
        content.classList.add('full-width');
    } else if(!loaded.isFullWidth) {
        content.classList.remove('full-width');
    }
    content.appendChild(loaded);

    if(!Utils.animationsReduced()){
        const config = fadeWith(200, true);
        content.animate(config.effect, config.options);
    }
    
    if(loaded instanceof NotFound){
        throw new NotFoundError(route);
    }
    window.scrollTo(0,0);

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

        const animation = fadeWith(1000, true);			
        const content = pageContent.animate(animation.effect, animation.options);
        await content.finished;
    });

    return loaded;
}