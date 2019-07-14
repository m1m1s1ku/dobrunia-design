import { html, TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { css, property } from 'lit-element';

import Page from '../core/strategies/Page';
import Constants from '../constants';
import { Utils, onImageContainerClicked } from '../core/ui/ui';
import { fadeWith } from '../core/animations';

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

    public async connectedCallback(){
        super.connectedCallback();
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
        this.loaded = true;
        if(Utils.animationsReduced()){
            return;
        }
        const fade = fadeWith(300, true);
        this.page.animate(fade.effect, fade.options);
    }

    public render(): void | TemplateResult {
        const page = this.pageInfo as APIPage;

        return html`
        <div id="about" class="about" role="main">
        ${!this.loaded ? html`<paper-spinner active></paper-spinner>` : html``}
        ${page ? html`
            <h1>${page.name}</h1>
            <div class="image-container" @click=${onImageContainerClicked}>
                <iron-image style="width:300px; height: 300px" sizing="cover" preload src="${page.image}"></iron-image>
            </div>
            ${page.content}
        ` : html``}
        </div>
        `;
    }

    public get page(){
        return this.shadowRoot.querySelector('#about');
    }
}
customElements.define(About.is, About);