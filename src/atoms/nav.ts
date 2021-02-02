import { html, TemplateResult } from 'lit-html';
import { property, LitElement } from 'lit-element';

import { repeat } from 'lit-html/directives/repeat';
import { navigate } from '../core/routing/routing';
import { Utils } from '../core/ui/ui';
import Constants from '../constants';
import { ElaraApp } from '../elara-app';

export interface Item {
    route: string; 
    name: string;
    idx: number; 
    hidden: boolean;
    filter: boolean;
}

export default class Nav extends LitElement {
    public static readonly is: string = 'ui-nav';

    @property({type: Array, reflect: false})
    public items: Item[] = [];

    @property({type: Array, reflect: false})
    public filters: Item[] = [];

    @property({type: String, reflect: true})
    public route = null;

    @property({type: Boolean, reflect: true})
    public mobile = Utils.isMobile();

    @property({type: Boolean, reflect: true})
    public shown = false;

    @property({type: String, reflect: true})
    public logo = '';

    private _resizeListener: (e: Event) => void;
    _elara: ElaraApp;

    public constructor(){
        super();

        this._resizeListener = this._onResize.bind(this);
    }

    public createRenderRoot(): this {
        return this;
    }

    public connectedCallback(): void {
        super.connectedCallback();
        this._elara = document.querySelector<ElaraApp>('elara-app');
        window.addEventListener('resize', this._resizeListener);
    }

    public disconnectedCallback(): void {
        super.disconnectedCallback();
        window.removeEventListener('resize', this._resizeListener);
    }

    private _onResize(_: Event){
        this.mobile = Utils.isMobile();
    }

	public render(): void | TemplateResult {
        const hasFilters = (this.route && this.route.indexOf('home') !== -1) || (this.route && this.route.indexOf('category') !== -1);

        return html`
        <nav class="main" role="navigation">
            <div class="header ${hasFilters ? '' : 'has-no-filters'}">
                ${this.logo ? html`
                <div aria-hidden="true" tabindex="0" class="title" role="link">
                    <elara-image @click=${() => navigate('home')} sizing="cover" preload src="${this.logo}"></elara-image>
                </div>
                ` : html``}
                <div class="links">
                    ${this.items.length === 0 ? html`
                        <mwc-circular-progress indeterminate></mwc-circular-progress>
                    ` : html``}
                    <ul>
                        ${this.mobile ?
                            html`<li><mwc-icon-button id="handle" tabindex="0" class="menu mobile-handle" icon="menu" aria-label="Menu" @click=${() => {
                                this.shown = !this.shown;
                            }}></mwc-icon-button></li>` :
                            html`${repeat(this.items, this._item.bind(this))}`}
                    </ul>
                </div>
            </div>
            ${this.mobile ? html`
            <div class="menu ${this.shown === true ? 'shown' : ''}" @click=${e => {
                if((e.currentTarget as HTMLElement).classList.contains('menu')){
                    this.shown = false;
                }
            }}>
                <div class="menu-content ${this.shown === true ? 'shown' : ''}">
                    ${repeat(this.items, this._item.bind(this))}
                </div>
            </div>
            ` : html``}
        </nav>
        ${this.filters && this.filters.length > 0 ? html`
            <div class="filters ${hasFilters ? '' : 'hidden'}">
                <ul>
                    <li><mwc-icon-button aria-label="Réinitialiser" class=${this.route === 'home' ? 'hidden' : ''} icon="close" @click=${() => {
                        navigate(Constants.defaults.route);
                    }}></mwc-icon-button></li>
                    ${repeat(this.filters, this._item.bind(this))}
                </ul>
            </div>
        ` : html``}
        `;
    }

    private _item(item: Item){
        if(item.hidden === true){
            return html``;
        }

        return html`
        <li><a class="item ${item && this._elara.router.history.currentRoute.substr(1) === item.route ? 'active' : ''}" role="link" tabindex="${this.route === item.route ? '-1' : '0'}" @click=${() => {
            navigate(item.route);
            if(this.mobile){
                this.shown = false;
            }
            this.performUpdate();
        }}>${item.name}</a></li>
        `;
    }
}
customElements.define(Nav.is, Nav);