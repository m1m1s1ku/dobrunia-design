import { css } from 'lit-element';
import Elara from '../elara';
import { IronImageElement } from '@polymer/iron-image';

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
    listener: null,
    sizing: null,
    width: null,
    height: null,
};

const showImage = (container: HTMLElement, image: IronImageElement) => {
    document.body.className = 'scrolling-disabled';
    state.sizing = image.sizing;
    state.width = image.style.width;
    state.height = image.style.height;

    image.style.width = '80%';
    image.style.height = '80%';

    container.classList.add('opened');
    container.focus();
    window.removeEventListener('keydown', state.listener);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    state.listener = galleryListener(container, image);
    window.addEventListener('keydown', state.listener);
};

const hideImage = (container: HTMLElement, image: IronImageElement) => {
    document.body.className = '';

    image.sizing = state.sizing;
    image.style.width = state.width;
    image.style.height = state.height;

    container.classList.remove('opened');
};

const clean = () => {
    if(state.listener){
        window.removeEventListener('keydown', state.listener);
    }

    state = {
        listener: null,
        sizing: null,
        width: null,
        height: null,
    };
};

function galleryListener(firstContainer: HTMLElement, firstImage: IronImageElement) {    
    return (e: KeyboardEvent) => {
        const prev = firstContainer.previousElementSibling as HTMLElement;
        const next = firstContainer.nextElementSibling as HTMLElement;
    
        switch(e.keyCode){
            // left
            case 37: {
                if(prev && prev.classList.contains('image-container')){
                    const prevImage = prev.querySelector('iron-image');

                    hideImage(firstContainer, firstImage);
                    showImage(prev, prevImage);
                } else {
                    hideImage(firstContainer, firstImage);
                    clean();
                }
                break;
            }
            // right
            case 39:
            // enter
            case 32: {
                if(next && next.classList.contains('image-container')){
                    const nextImage = next.querySelector('iron-image');
                    hideImage(firstContainer, firstImage);
                    showImage(next, nextImage);
                } else {
                    hideImage(firstContainer, firstImage);
                    clean();
                }
                break;
            }
            // escape
            case 27:
            default: {
                hideImage(firstContainer, firstImage);
                clean();
            }
        }
    };
};

export function onImageContainerClicked(e: KeyboardEvent) {
    const firstContainer = e.currentTarget as HTMLDivElement;
    const firstImage = firstContainer.querySelector('iron-image');
    
    if(firstContainer.classList.contains('opened')){
        hideImage(firstContainer, firstImage);
        clean();
    } else {
        const keyboardListener = galleryListener(firstContainer, firstImage);
        if(state.listener){
            throw new Error('Already binded listener');
        }
        
        state.listener = keyboardListener;
        showImage(firstContainer, firstImage);
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
