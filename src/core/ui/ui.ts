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
        LIGHT: '(prefers-color-scheme: light)'
    },
    grid: css`.grid { display: flex; flex-wrap: wrap; } .grid > div { flex: 1 0 5em; }`,
    typography: {
        buttons: css`button:focus, button:hover {outline: 1px solid var(--elara-primary); background-color: var(--elara-secondary)}; `,
        lists: css`li { list-style: none }`,
        links: css`a { cursor: pointer; color: var(--elara-font-color); text-decoration: none; transition: color .3s; } a:hover { color: var(--elara-font-hover)}`,
        heading: css`h1, h2 { user-select: none; font-family: var(--elara-font-display); } h1::first-letter { font-size: 1.3em; } h2::first-letter { font-size: 1.2em }`
    }
};

export function ElaraElement(): Elara.Root {
    return document.querySelector('elara-app');
};

export const Utils = {
    isMobile: (): boolean => {
        return window.innerWidth < 600;
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
    }
};
