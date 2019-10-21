namespace Elara {
    // UI modes
    export type Modes = 'day' | 'night' | null;
    // Element interfaces
    export interface Element extends HTMLElement {}

    // Elara-app public-api
    export interface Root extends Elara.Element {
        config: {
            name: string;
            revision: string;
        };
        default: string;
        head: {
            title: string;
        };
        loaded: boolean;
        askModeChange(mode: Elara.Modes): boolean;
    }

    // Loadable element
    export interface LoadableElement extends Elara.Element {
        loaded: boolean;
    }

    // Page with helmet
    export interface Page extends Elara.Element {
        default: string;
        
        head: {
            title: string;
            description: string;
            type: string;
            image?: string;
            slug: string;
        };
    }

    export interface UpdatableElement extends HTMLElement {
        requestUpdate(name?: PropertyKey, oldValue?: unknown): Promise<unknown>;
    }

    export interface InputElement extends HTMLInputElement {
        invalid: boolean;
        validate(): boolean;
    }
}

export default Elara;