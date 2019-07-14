import { css } from 'lit-element';
import Elara from '../elara';

export const UI = {
    modes: {
        localStorageKey: 'night-mode'
    }
};

export const Processing = {
    /**
     * Convert a remote url to an image data-url
     * 
     * @param src remote url
     */
    toDataURL(src: string): Promise<string> {
        return new Promise((resolve) => {
            const image = new Image();
            image.crossOrigin = 'Anonymous';
            
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = image.naturalHeight;
                canvas.width = image.naturalWidth;
                context.drawImage(image, 0, 0);
                resolve(canvas.toDataURL('image/jpeg'));
            };
        
            image.src = src;
        });
    }
};

export const CSS = {
    queries: {
        DARK: '(prefers-color-scheme: dark)',
        LIGHT: '(prefers-color-scheme: light)',
        ANIMATIONS: '(prefers-reduced-motion: reduce)'
    },
    images: css`
    .image-container {
        cursor: pointer;
    }
    
    .image-container.opened {
        transition: .3s;
        position: fixed;
        top: 0;
        right: 0;
        left: 0;
        bottom: 0;
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255,255,255, .8);
        overflow: hidden;
        z-index: 999;
    }

    .image-container.opened iron-image {
        width: 100%;
        height: 100%;
    }
    `,
    cards: css`
    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); 
        grid-gap: 1em;
        
        padding: 1em 2em;
    }

    @media (max-width: 475px){
        .cards {
            grid-template-columns: repeat(auto-fill, minmax(100%, 1fr)); 
        }
    }

    .card {
        cursor: pointer;
        text-align: center;
    }

    .card.reveal {
        opacity: 0;
    }

    .card.revealed {
        opacity: 1;
        transition: opacity .3s;
    }

    @media (prefers-reduced-motion: reduce){
        .card.reveal {
            opacity: 1;
        }

        .card.revealed {
            transition: 0s;
        }
    }

    .card iron-image {
        width: 100%;
        height: 240px;
    }

    .card .text .title {
        font-size: 1.3em;
        margin: .5em;
    }

    .card .text span {
        margin: 1em;
    }
    `,
    grid: css`.grid { display: flex; flex-wrap: wrap; } .grid > div { flex: 1 0 5em; }`,
    typography: {
        buttons: css`button:focus, button:hover {outline: 1px solid var(--elara-primary); background-color: var(--elara-secondary)}; `,
        lists: css`li { list-style: none }`,
        links: css`a { cursor: pointer; color: var(--elara-font-color); text-decoration: none; transition: color .3s; } a:hover { color: var(--elara-font-hover)}`,
        heading: css`h1, h2, h3 { user-select: none; font-family: var(--elara-font-display); } h1::first-letter { font-size: 1.3em; } h2::first-letter { font-size: 1.2em }`
    }
};

export function ElaraElement(): Elara.Root {
    return document.querySelector('elara-app');
};


let state = {
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

const show = (container: HTMLElement) => {
    const image = container.querySelector('iron-image');

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
    const image = container.querySelector('iron-image');

    document.body.className = '';

    image.sizing = state.sizing;
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

const touchListener = (container: HTMLElement) => {
    return (e: TouchEvent) => {
        if(e.type === 'touchstart'){
            state.touchstartX = e.changedTouches[0].screenX;
            return;
        } else {
            state.touchendX = e.changedTouches[0].screenX;
        }

        const prev = container.previousElementSibling as HTMLElement;
        const next = container.nextElementSibling as HTMLElement;

        const hasPrev = prev && prev.classList.contains('image-container');
        const hasNext = next && next.classList.contains('image-container');

        if (state.touchendX < state.touchstartX){
            if(!hasNext){
                hide(container);
                clean();
                return;
            }

            hide(container);
            show(next);

            return;
        }

        if (state.touchendX > state.touchstartX){
            if(!hasPrev){
                hide(container);
                clean();
                return;
            }

            hide(container);
            show(prev);

            return;
        }
    };
};

function galleryListener(firstContainer: HTMLElement) {    
    return (e: KeyboardEvent) => {
        const prev = firstContainer.previousElementSibling as HTMLElement;
        const next = firstContainer.nextElementSibling as HTMLElement;

        const hasPrev = prev && prev.classList.contains('image-container');
        const hasNext = next && next.classList.contains('image-container');

        const willDismiss = e.keyCode === 37 && !hasPrev || e.keyCode === 32 && !hasNext || e.keyCode === 39 && !hasNext || e.keyCode === 27;

        if(willDismiss){
            hide(firstContainer);
            clean();
            return;
        }
    
        switch(e.keyCode){
            // left
            case 37: {
                hide(firstContainer);
                show(prev);
                break;
            }
            // right
            case 39:
            // enter
            case 32: {
                hide(firstContainer);
                show(next);
                break;
            }
        }
    };
};

export function onImageContainerClicked(e: KeyboardEvent) {
    const firstContainer = e.currentTarget as HTMLDivElement;
    
    if(firstContainer.classList.contains('opened')){
        hide(firstContainer);
        clean();
    } else {
        show(firstContainer);
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
    mode: (): Elara.Modes => {
        return localStorage.getItem(UI.modes.localStorageKey) as Elara.Modes;
    },
    // Day-night handling
    nightSwitchClick: async (click: Event, host: Elara.UpdatableElement): Promise<boolean> => {
        click.preventDefault();
        click.stopPropagation();
        const hasNightMode = !Utils.isSunny();
        const future = !hasNightMode ? 'night' : 'day';
        localStorage.setItem(UI.modes.localStorageKey, future);

        await host.requestUpdate();
        
        return ElaraElement().askModeChange(future);
    },
    applyVariablesFor: (mode: Elara.Modes): boolean => {
        const root = document.documentElement;

        if(mode === 'night'){
            root.style.setProperty('--elara-background-color', '#373737');
            root.style.setProperty('--elara-font-color', '#f0f0f0');
            root.style.setProperty('--elara-font-hover', '#9e9e9e');
        } else {
            root.style.removeProperty('--elara-background-color');
            root.style.removeProperty('--elara-font-color');
            root.style.removeProperty('--elara-font-hover');
        }

        return true;
    },
    hasSwitched: (): boolean => {
        return Utils.mode() !== null;
    },
    isSunny: (): boolean => {
        return Utils.mode() === 'day';
    },
    dayOrNight: (): Elara.Modes => {
        if(Utils.hasSwitched()){
            if(Utils.isSunny()){
                return 'day';
            } else {
                return 'night';
            }
        } else {
            if(Utils.isDarkOS()){
                return 'night';
            } else {
                return 'day';
            }
        }
    },
    isDarkOS(): boolean {
        if(!window.matchMedia){
            console.warn('Elara:: Night mode not supported at the moment');

            return false;
        }

        return window.matchMedia(CSS.queries.DARK).matches;
    },
    animationsReduced(): boolean {
        if(!window.matchMedia){
            console.warn('Elara:: MatchMedia not supported.');

            return false;
        }

        return window.matchMedia(CSS.queries.ANIMATIONS).matches;
    }
};

export const chunk = (arr: unknown[], size: number) => {
    const R = [];
    for (let i=0, len=arr.length; i<len; i+=size){
        R.push(arr.slice(i,i+size));
    }
    return R;
};