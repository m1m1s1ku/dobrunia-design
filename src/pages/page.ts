import { html, TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { css, property } from 'lit-element';
import { oc } from 'ts-optchain';

import Page from '../core/strategies/Page';
import Constants from '../constants';

import { Utils, decodeHTML, onImageContainerClicked } from '../core/ui/ui';
import { fadeWith } from '../core/animations';
import { ProjectMinimal } from './project';
import { wrap } from '../core/errors/errors';

class PageController extends Page {
    public static readonly is: string = 'ui-page';

    public static readonly hasRouting: boolean = true;

    @property({type: Object, reflect: false})
    public article: ProjectMinimal;
    @property({type: String, reflect: false})
    public featured: string;

    public get head(){
        return {
            title: 'Article',
            description: null,
            type: null,
            image: null,
            slug: '#!article'
        };
    }

    public connectedCallback(): void {
        super.connectedCallback();
        this._load();
    }
    
    private async _load(){
        const requestedHash = location.hash.split('/');
        if(requestedHash.length > 1){
            const pageQuery = `
            {
                pageBy(uri: "${requestedHash[1]}") {
                    title
                    featuredImage {
                      sourceUrl
                    }
                    content(format: RENDERED)
                  }
            }              
            `;

            const first = await fetch(Constants.graphql, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: pageQuery
                })
            }).then(res => res.json()).then(res => res.data.pageBy).catch(_ => this.dispatchEvent(wrap(_))) as ProjectMinimal;

            this.loaded = true;

            const post = first;
            document.title = post.title + ' | ' + Constants.title;
            this.article = post;
            this.featured = oc<ProjectMinimal>(post).featuredImage.sourceUrl('/assets/logo.png');

            if(Utils.animationsReduced()){
                return;
            }
            const fade = fadeWith(300, true);
            this._page.animate(fade.effect, fade.options);
        }
    }

    public static get styles(){
        return [
            ... super.styles,
            css`
            .page {
                padding: 2em;
                background: linear-gradient( to bottom, rgba(255, 255, 255, 0), rgba(249, 249, 249, 0.6) );
            }

            .images {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            li {
                list-style: initial;
            }
            `
        ];
    }

    public render(): void | TemplateResult {
        return html`
        <div id="page" class="page" role="main">
            ${!this.loaded ? html`
            <div class="loading">
                <paper-spinner active></paper-spinner>
            </div>` : html``}
            ${this.article ? html`
            <h1>${decodeHTML(this.article.title)}</h1>
            ${this.featured ? html`
            <div class="image-container" @click=${onImageContainerClicked}>
                <iron-image style="width: 100vw; height: 400px;" sizing="contain" src="${this.featured}"></iron-image>
            </div>
            ` : html``}
            <div class="content">
                ${unsafeHTML(this.article.content)}
            </div>
            ` : html``}
        </div>
        `;
    }

    private get _page(){
        return this.shadowRoot.querySelector('#page');
    }
}
customElements.define(PageController.is, PageController);