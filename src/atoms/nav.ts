import { html, TemplateResult } from 'lit-html';
import { CSSResult, css, property } from 'lit-element';

import PureElement from '../core/strategies/Element';
import { repeat } from 'lit-html/directives/repeat';
import { navigate } from '../core/routing/routing';
import { CSS, Utils } from '../core/ui/ui';
import Constants from '../constants';

export interface Item {
    route: string; 
    name: string;
    idx: number; 
    hidden: boolean;
}

export default class Nav extends PureElement {
    public static readonly is: string = 'ui-nav';

    @property({type: Array, reflect: false})
    public items: Item[] = [];

    @property({type: String, reflect: true})
    public route = null;

    @property({type: Boolean, reflect: true})
    public mobile = Utils.isMobile();

    @property({type: Boolean, reflect: true})
    public shown = false;

    private _resizeListener: (e: Event) => void;

    public constructor(){
        super();

        this._resizeListener = this._onResize.bind(this);
    }

    public static get styles(): CSSResult[] {
        return [
            CSS.typography.heading,
            CSS.typography.links,
            css`
            :host {
                z-index: 3;
            }

            .title {
                cursor: pointer;
                outline: none;
                padding: 2em 0 0 3em;
            }

            @media (max-width: 450px){
                .title {
                    padding: 1em 0 0 1em;
                }
            }
            
            .main {
                background: var(--elara-nav-background);
            }

            .mobile-handle {
                position: absolute;
                top: 2em;
                right: 3em;
                z-index: 999;
            }

            .item.active {
                color: var(--elara-secondary);
            }

            .links ul {
                outline: none;
                font-size: 0.9em;
                font-family: 'Kotori Rose', serif;
                text-transform: lowercase;
            }

            .links ul li {
                display: inline-block;
                list-style: none;
            }

            li a {
                margin: 0 0.5em;
                outline: none;
                user-select: none;
            }

            .menu {
                position: absolute;
                top: 0;
                right: 0;
                height: 45px;
                width: 45px;
                color: var(--elara-font-color);
            }
            
            .menu-content {
                position: fixed;
                top: 0;
                right: 0;
                left: 0;
                bottom: 0;
                background-color: var(--elara-background-color);
                color: var(--elara-font-color);
                display: none;
                transition: opacity .4s;
            }
    
            .menu-content .item {
                cursor: pointer;
                position: relative;
                font-size: 5vw;
                color: var(--elara-font-color);
                text-transform: lowercase;
                margin: 0.5rem 0;
                padding: 0 0.5rem;
                transition: color 0.3s;
                text-decoration: none;
                user-select: none;
                outline: none;
            }
    
            @media (max-width: 600px){
                .menu-content .item {
                    font-size: 8vw;
                }
            }
    
            .menu-content .item::after {
                content: '';
                width: 100%;
                top: 65%;
                height: 6px;
                background: var(--elara-primary);
                position: absolute;
                left: 0;
                opacity: 0;
                transform: scale3d(0,1,1);
                transition: transform 0.3s, opacity 0.3s;
                transform-origin: 100% 50%;
            }
    
            .menu-content .item:hover, .menu-content .item.active {
                color: var(--elara-font-hover);
            }
    
            .menu-content .item:hover::after, .menu-content .item.active::after {
                opacity: 1;
                transform: scale3d(1,1,1);
            }
    
            .menu.shown {
                z-index: 999;
            }
            .menu-content.shown {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 999;
                background-color: rgba(255, 255, 255, .8);
            }
            li {
                list-style: none;
            }
            `
        ];
    }

    public connectedCallback(): void {
        super.connectedCallback();
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
        return html`
        <nav class="main" role="navigation">
            <div class="header">
                <div aria-hidden="true" tabindex="0" class="title" @click=${() => navigate('home')} role="link">${Constants.logo()}</div>
                <div class="links">
                    <ul>
                        ${this.mobile ?
                            html`<li><paper-icon-button id="handle" tabindex="0" class="menu mobile-handle" icon="menu" aria-label="Menu" @click=${() => {
                                this.shown = !this.shown;
                            }}></paper-icon-button></li>` :
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
        `;
    }

    private _item(item: Item){
        if(item.hidden === true){
            return html``;
        }

        if(this.mobile){
            return html`
            <a class="item ${this.route === item.route ? 'active' : ''}" role="link" tabindex="${this.route === item.route ? '-1' : '0'}" @click=${() => {
                navigate(item.route);
                this.shown = false;
            }}>${item.name}</a>
            `;
        }

        return html`
            <li><a .class="item ${item && this.route === item.route ? 'active' : ''}" .tabindex="${item && this.route === item.route ? '-1' : '0'}" @click=${() => navigate(item.route)}>${item.name}</a></li>
        `;
    }
}
customElements.define(Nav.is, Nav);