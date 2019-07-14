import { html, TemplateResult } from 'lit-html';
import { property, css, CSSResult } from 'lit-element';

import PureElement from '../core/strategies/Element';

import './tree';

import Constants from '../constants';
import { navigate } from '../core/routing/routing';

class NotFound extends PureElement {
    public static readonly is: string = 'ui-not-found';

    @property({type: String, reflect: true})
    public asked: string;

    public constructor(asked: string){
        super();
        this.asked = asked;
    }

    public static get styles(): CSSResult {
        return css`
        h1, p {
            user-select: none;
            z-index: 1;
        }

        a {
            color: var(--elara-primary);
            text-decoration: none;
            cursor: pointer;
        }
        .text {
            padding: 2em;
        }
        `;
    }

	public render(): void | TemplateResult {
        return html`
        <div class="text">
            <h1>You are lost !</h1>
            <p>You asked for : ${this.asked}.</p>
            <a @click=${() => navigate(Constants.defaults.route)}><iron-icon icon="home"></iron-icon> Homepage</a>
            <ui-tree .width=${1366} .height=${768}></ui-tree>
        </div>
        `;
    }
}
customElements.define(NotFound.is, NotFound);