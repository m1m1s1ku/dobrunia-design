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

    public static get styles(): CSSResult[] {
        return [
            CSS.grid,
            CSS.typography.heading,
            CSS.typography.links,
            css`
            :host {
                z-index: 3;
            }
            .title {
                padding: .5em;
            }
            .main {
                background: var(--elara-nav-background);
            }

            .links { position: relative; display: flex; align-items: center;}

            .links ul {
                display: flex;
                margin: 0;
                padding: 0;
                height: 100%;
                width: 100%;
                position: absolute;
                justify-content: flex-end;
                align-items: center;
            }

            .links ul li {
                display: inline-block;
                list-style: none;
            }

            li a, .menu {
                color: white;
            }

            li a {
                margin: 0 0.5em
            }`
        ];
    }

	public render(): void | TemplateResult {
        return html`
        <nav class="main" role="navigation">
            <div class="grid">
                <div aria-hidden="true" tabindex="0" class="title" @click=${() => navigate('home')} @keydown=${(e: KeyboardEvent) => isEnter(e) ? navigate('home') : null} role="link">${Constants.logo(100)}</div>
                <div class="links">
                    <ul>
                        ${Utils.isMobile() ? 
                            html`<li><paper-icon-button id="handle" tabindex="0" class="menu" icon="menu" aria-label="Menu" @click=${() => ElaraElement().menu(false)}></paper-icon-button></li>` :
                            html`${repeat(this.items, this._item.bind(this))}
                        `}
                    </ul>
                </div>
            </div>
        </nav>
        `;
    }

    private _item(item: { route: string; name: string; idx: number }){
        return html`
            <li><a class="item" tabindex="${item && this.route === item.route ? '-1' : '0'}" @keydown=${(e: KeyboardEvent) => isEnter(e) ? navigate(item.route) : null} @click=${() => navigate(item.route)}>${item.name}</a></li>
        `;
    }
}
customElements.define(Nav.is, Nav);