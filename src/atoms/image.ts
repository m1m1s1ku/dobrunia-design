import { LitElement, property, customElement, html, query, PropertyValues, TemplateResult } from 'lit-element';
import { fadeWith } from '../core/animations';

@customElement('elara-image')
export class ElaraImage extends LitElement {
    @property({type: String, reflect: true})
    public src: string;

    @property({type: String, reflect: true})
    public alt: string;

    @property({type: String, reflect: true})
    public sizing: 'cover' | 'contain' = 'contain';

    @property({type: String, reflect: true})
    public placeholder = '';

    @property({type: Boolean, reflect: true})
    public catch = false;

    private _listener: (ev: Event) => void;   
    private _errorListener: (ev: Event) => void = this._onError.bind(this);   
    private _handle: number;

    @query('.elara-image') private _img!: HTMLImageElement;

    protected createRenderRoot(): this {
        return this;
    }

    protected update(_changedProperties: PropertyValues): void {
        super.update(_changedProperties);
        if(_changedProperties.has('src')){
            if(this._img){
                this._img.style.visibility = 'hidden';
            }

            this._handle = null;
            if(!this.querySelector('elara-spinner')){
                this._handle = setTimeout(() => {
                    const spinner = document.createElement('elara-spinner');
                    spinner.text = this.placeholder;
                    this.prepend(spinner);
                }, 300) as unknown as number;
            }
        }
    }

    public updated(): void {
        this._listener = this._previewLoadListener(this._handle);
        if(this._img){
            this._img.addEventListener('load', this._listener);
            this._img.addEventListener('error', this._errorListener);
        }
    }

    private _onError(){
        if(!this._img){
            return;
        }
        
        this._img.style.visibility = null;

        if(this.catch){
            this._img.parentElement.removeChild(this._img);
        }

        const spin = this.querySelector('elara-spinner');
        if(spin){
            this.removeChild(spin);
        }

        if(this._handle !== undefined){
            clearTimeout(this._handle);
        }
    }
    
    private _previewLoadListener(timeoutHandle: number) {
        return (ev: Event) => {
            const previewed = ev.target as HTMLImageElement;
            if(previewed.complete){
                const animation = fadeWith(300, true);
                requestAnimationFrame(() => {
                    if(!this._img){
                        return;
                    }
                    
                    this._img.style.visibility = null;
                    this._img.animate(animation.effect, animation.options);
                    this._img.removeEventListener('load', this._listener);
                    const spin = this.querySelector('elara-spinner');
                    if(spin){
                        this.removeChild(spin);
                    }
                    
                    this._listener = null;
                    if(timeoutHandle !== undefined){
                        clearTimeout(timeoutHandle);
                    }
                });
            }
        };
    }

	public render(): TemplateResult {
        return html`<img class="elara-image" .src=${this.src} .alt="${this.alt}" .sizing="${this.sizing}" />`;
    }
}

declare global {
	interface HTMLElementTagNameMap {
		'elara-image': ElaraImage;
	}
}