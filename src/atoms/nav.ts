import { html, TemplateResult } from 'lit-html';
import { CSSResult, css, property } from 'lit-element';

import PureElement from '../core/strategies/Element';
import { repeat } from 'lit-html/directives/repeat';
import { navigate } from '../core/routing/routing';
import { CSS, ElaraElement, Utils } from '../core/ui/ui';
import Constants from '../core/constants/constants';
import { isEnter } from '../core/accessibility/accessibility';

class Nav extends PureElement {
    public static readonly is: string = 'ui-nav';

    @property({type: Array, reflect: false})
    public items = [];

    @property({type: String, reflect: true})
    public route = null;

    @property({type: Boolean, reflect: true})
    public mobile = Utils.isMobile();

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
            .main {
                background: var(--elara-nav-background);
            }

            .mobile-handle {
                position: absolute;
                top: 2em;
                right: 3em;
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
            }`
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
                <div aria-hidden="true" tabindex="0" class="title" @click=${() => navigate('home')} @keydown=${(e: KeyboardEvent) => isEnter(e) ? navigate('home') : null} role="link">${Constants.logo()}</div>
                <div class="links">
                    <ul>
                        ${this.mobile ?
                            html`<li><paper-icon-button id="handle" tabindex="0" class="menu mobile-handle" icon="menu" aria-label="Menu" @click=${() => ElaraElement().menu(false)}></paper-icon-button></li>` :
                            html`${repeat(this.items, this._item.bind(this))}
                        `}
                    </ul>
                </div>
            </div>
        </nav>
        `;
    }

    private _item(item: { route: string; name: string; idx: number; hidden: boolean }){
        if(item.hidden === true){
            return html``;
        }

        return html`
            <li><a class="item" tabindex="${item && this.route === item.route ? '-1' : '0'}" @keydown=${(e: KeyboardEvent) => isEnter(e) ? navigate(item.route) : null} @click=${() => navigate(item.route)}>${item.name}</a></li>
        `;
    }
}
customElements.define(Nav.is, Nav);