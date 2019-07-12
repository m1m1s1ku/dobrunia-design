import { html, TemplateResult } from 'lit-html';
import { css } from 'lit-element';

import Page from '../core/strategies/Page';

class Home extends Page {
    public static readonly is: string = 'ui-home';

    public get head(){
        return {
            title: 'Accueil',
            description: '',
            type: 'page',
            image: '',
            slug: '#!home'
        };
    }

    public static get styles(){
        return [
            ... super.styles,
            css`
            `
        ];
    }

    public render(): void | TemplateResult {
        return html`
        <div class="animated">

        </div>
        `;
    }
}
customElements.define(Home.is, Home);