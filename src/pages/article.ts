import { html, TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { repeat } from 'lit-html/directives/repeat';
import { css, property } from 'lit-element';

import Page from '../core/strategies/Page';
import Constants from '../constants';

import { Utils, onImageContainerClicked } from '../core/ui/ui';
import { fadeWith } from '../core/animations';
import { Article } from '../bridge';

class Single extends Page {
    public static readonly is: string = 'ui-article';

    public static readonly hasRouting: boolean = true;

    @property({type: Object, reflect: false})
    public article: Article;

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
            const articleR = await fetch(Constants.route('articles/slug/'+requestedHash[1]), {method: 'POST'});
            const articleRes = await articleR.json();
            this.loaded = true;

            const article = articleRes.data;
            this.article = {...article, content: unsafeHTML(article.content)};
            document.title = article.title + ' | ' + Constants.title;
            if(Utils.animationsReduced()){
                return;
            }
            const fade = fadeWith(300, true);
            this.page.animate(fade.effect, fade.options);
        }
    }

    public static get styles(){
        return [
            ... super.styles,
            css`
            .single {
                padding: 2em;
            }

            .images {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            `
        ];
    }

    public render(): void | TemplateResult {
        return html`
        <div id="blog" class="blog single" role="main">
            ${!this.loaded ? html`<paper-spinner active></paper-spinner>` : html``}
            ${this.article ? html`
            <h1>${this.article.title}</h1>
            <div class="content">
                ${this.article.content}
            </div>
            <div class="images">
                ${repeat(this.article.images, image => html`
                <div class="image-container" @click=${onImageContainerClicked}>
                    <iron-image style="width: 33vw; height: 400px;" sizing="contain" src="${image.path}"></iron-image>
                </div>
                `)}
            </div>
            ` : html``}
        </div>
        `;
    }

    private get page(){
        return this.shadowRoot.querySelector('#blog');
    }
}
customElements.define(Single.is, Single);