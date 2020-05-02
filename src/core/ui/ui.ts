import { TemplateResult } from 'lit-element';

export function decodeHTML(html: string){
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

export const Processing = {
    /**
     * Convert a remote url to an image data-url
     * 
     * @param src remote url
     */
    toDataURL(src: string, quality = 1): Promise<string> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'Anonymous';
            
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = image.naturalHeight;
                canvas.width = image.naturalWidth;
                context.drawImage(image, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };

            image.onerror = image.onabort = () => {
                reject();
            }; 
        
            image.src = src;
        });
    },
    async retrieveAsFile(url: string, proxy: string): Promise<File> {
        try {
            const blob = await Processing.retrieveAsBlob(url, proxy);
            return new File([blob], url.replace(/[\#\?].*$/,'').substring(url.lastIndexOf('/')+1));
        } catch {
            return null;
        }
    },
    async retrieveAsBlob(url: string, proxy: string): Promise<Blob> {
        try {
            return await fetch(proxy.concat(url)).then(r => r.blob());
        } catch {
            return null;
        }
    }
};

/**
 * Return a word without accents using normalize \o/
 * @param str "Crème au chocolat"
 * @return {string} "Creme au chocolat"
 */
export function normalize(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function slugify(str: string, separator: string){
    str = str.trim();
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    const from = 'åàáãäâèéëêìíïîòóöôùúüûñç·/_,:;';
    const to = 'aaaaaaeeeeiiiioooouuuunc------';

    for (let i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    return str
        .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-') // collapse dashes
        .replace(/^-+/, '') // trim - from start of text
        .replace(/-+$/, '') // trim - from end of text
        .replace(/-/g, separator);
}

export function ifDefined(property: unknown, template: TemplateResult, initial: TemplateResult){
    if(!property) return initial;

    return template;
}

export const CSS = {
    queries: {
        DARK: '(prefers-color-scheme: dark)',
        LIGHT: '(prefers-color-scheme: light)',
        ANIMATIONS: '(prefers-reduced-motion: reduce)'
    }
};

interface GalleryState {
    container: HTMLElement;
    listeners: {
        keyboard: (e: KeyboardEvent) => void;
        touch: (e: TouchEvent) => void;
    };
    sizing: string;
    width: string;
    height: string;
    touchstartX: number;
    touchendX: number;
};

let state: GalleryState = {
    container: null,
    listeners: {
        keyboard: null,
        touch: null
    },
    sizing: null,
    width: null,
    height: null,
    touchstartX: 0,
    touchendX: 0
};

export interface IronImageCompatibleElement extends HTMLImageElement {
    sizing: string;
}

const show = (container: HTMLElement) => {
    const image = container.querySelector('elara-image');

    state.container = container;
    state.touchstartX = 0;
    state.touchendX = 0;

    document.body.className = 'scrolling-disabled';
    state.sizing = image.sizing;
    state.width = image.style.width;
    state.height = image.style.height;

    image.style.width = '80%';
    image.style.height = '80%';

    state.container.classList.add('opened');
    state.container.focus();

    window.removeEventListener('keydown', state.listeners.keyboard);
    
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    state.listeners.keyboard = galleryListener(state.container);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    state.listeners.touch = touchListener(state.container);

    state.container.addEventListener('touchstart', state.listeners.touch);
    state.container.addEventListener('touchend', state.listeners.touch);
    window.addEventListener('keydown', state.listeners.keyboard);
};

const hide = (container: HTMLElement) => {
    const image = container.querySelector('elara-image');

    document.body.className = '';

    image.style.width = state.width;
    image.style.height = state.height;

    container.removeEventListener('touchstart', state.listeners.touch);
    container.removeEventListener('touchend', state.listeners.touch);

    container.classList.remove('opened');
};

const clean = () => {
    if(state.listeners.keyboard){ window.removeEventListener('keydown', state.listeners.keyboard); }
    if(state.listeners.touch){ 
        state.container.removeEventListener('touchstart', state.listeners.touch);
        state.container.removeEventListener('touchend', state.listeners.touch);
     }

    state = {
        container: null,
        listeners: {
            keyboard: null,
            touch: null
        },
        sizing: null,
        width: null,
        height: null,
        touchstartX: 0,
        touchendX: 0
    };
};

export function touchEvents(onRight: () => void, onLeft: () => void){
    return (e: TouchEvent) => {
        if(e.type === 'touchstart'){
            state.touchstartX = e.changedTouches[0].screenX;
            return;
        } else {
            state.touchendX = e.changedTouches[0].screenX;
        }

        if (state.touchendX < state.touchstartX){
            onRight();
        }
        if (state.touchendX > state.touchstartX){
            onLeft();
        }
    };
}

const touchListener = (container: HTMLElement) => {
    return touchEvents(() => {
        const next = container.nextElementSibling as HTMLElement;
        const hasNext = next && next.classList.contains('image-container');

        if(!hasNext){
            hide(container);
            clean();
            return;
        }

        hide(container);
        show(next);
    }, () => {
        const prev = container.previousElementSibling as HTMLElement;
        const hasPrev = prev && prev.classList.contains('image-container');
        if(!hasPrev){
            hide(container);
            clean();
            return;
        }

        hide(container);
        show(prev);
    });
};

function galleryListener(container: HTMLElement) {    
    return (e: KeyboardEvent) => {
        const prev = container.previousElementSibling as HTMLElement;
        const next = container.nextElementSibling as HTMLElement;

        const hasPrev = prev && prev.classList.contains('image-container');
        const hasNext = next && next.classList.contains('image-container');

        const willDismiss = e.keyCode === 37 && !hasPrev || e.keyCode === 32 && !hasNext || e.keyCode === 39 && !hasNext || e.keyCode === 27;

        if(willDismiss){
            hide(container);
            clean();
            return;
        }
    
        switch(e.keyCode){
            // left
            case 37: {
                hide(container);
                show(prev);
                break;
            }
            // right
            case 39:
            // enter
            case 32: {
                hide(container);
                show(next);
                break;
            }
        }
    };
};

export function onImageContainerClicked(e: KeyboardEvent) {
    const container = e.currentTarget as HTMLElement;
    
    if(container.classList.contains('opened')){
        hide(container);
        clean();
    } else {
        show(container);
    }
}

export const Utils = {
    isMobile: (): boolean => {
        return window.innerWidth <= 570;
    },
    isInViewport(elem: Element) {
        const bounding = elem.getBoundingClientRect();

        return (
            bounding.top >= 0 &&
            bounding.left >= 0 &&
            bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },
    animationsReduced(): boolean {
        if(!window.matchMedia){
            console.warn('Elara:: MatchMedia not supported.');

            return false;
        }

        return window.matchMedia(CSS.queries.ANIMATIONS).matches;
    }
};

export function chunk<T>(arr: T[], size: number): T[][] {
    const R = [];
    for (let i=0, len=arr.length; i<len; i+=size){
        R.push(arr.slice(i,i+size));
    }
    return R;
}