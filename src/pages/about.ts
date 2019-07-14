import { html, TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { css, property } from 'lit-element';

import Page from '../core/strategies/Page';
import Constants from '../core/constants/constants';

interface APIPage {
    id: string;
    name: string;
    image: string;
    slug: string;
    content: string;
};

class About extends Page {
    public static readonly is: string = 'ui-about';
    @property({type: Object})
    public pageInfo: unknown;

    public get head(){
        return {
            title: 'À propos',
            description: null,
            type: null,
            image: null,
            slug: null
        };
    }

    public static get styles(){
        return [
            ... super.styles,
            css`
            .about {
                padding: 2em;
                text-align: center;
            }
            `
        ];
    }

    public async firstUpdated(){
        const pageR = await fetch(Constants.route('pages/about'));
        const pageData = await pageR.json();
        const response = pageData.data;
        this.pageInfo = {
            id: response.id,
            name: response.name,
            image: response.image,
            slug: response.slug,
            content: unsafeHTML(response.content)
        };
    }

    public render(): void | TemplateResult {
        const page = this.pageInfo as APIPage;

        return html`
        <div class="about" role="main">
        ${page ? html`
            <h1>${page.name}</h1>
            <iron-image style="width:300px; height: 300px" sizing="cover" preload src="${page.image}"></iron-image>
            ${page.content}
        ` : html``}
        </div>
        `;
    }
}
customElements.define(About.is, About);