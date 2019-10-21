namespace Elara {
    // UI modes
    export type Modes = 'day' | 'night' | null;
    // Element interfaces
    export interface Element extends HTMLElement {}

    // Loadable element
    export interface LoadableElement extends Elara.Element {
        loaded: boolean;
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