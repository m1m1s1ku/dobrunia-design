import { html, TemplateResult } from 'lit-html';
import { css, CSSResult, property } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';

import PureElement from '../core/strategies/Element';
import { ElaraElement } from '../core/ui/ui';

export class MenuElement extends PureElement {
    public static readonly is: string = 'ui-menu';

    @property({type: Array, reflect: false})
    public items = [];

    @property({type: String, reflect: true})
    public route = null;

    @property({type: Boolean, reflect: true})
    public shown = false;

    public static get styles(): CSSResult {
        return css`
        .menu {
			position: absolute;
			top: 0;
			right: 0;
			height: 45px;
			width: 45px;
			color: var(--elara-font-color);
			z-index: 0;
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

		.menu-content.shown {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
		}
		li {
			list-style: none;
		}
        `;
    }

	public render(): void | TemplateResult {
		return html`
		<div id="menu" class="menu-content ${this.shown === true ? 'shown' : ''}" role="navigation">
			<!-- li is needed for aria -->
			<li><paper-icon-button class="menu" role="button" icon="close" aria-label="Close menu"></paper-icon-button></li>
            ${repeat(this.items, (link) => this._link(link))}
		</div>
        `;
    }

    private _link({route, name}): TemplateResult {
		return html`
		<a class="item ${this.route === route ? 'active' : ''}" role="link" tabindex="${this.route === route ? '-1' : '0'}" @click=${() => ElaraElement().show(route)}>${name}</a>
		`;
	}
}
customElements.define(MenuElement.is, MenuElement);