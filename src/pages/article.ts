import { html, TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { css, property } from 'lit-element';

import Page from '../core/strategies/Page';
import Constants from '../constants';

import { Utils, decodeHTML, onImageContainerClicked } from '../core/ui/ui';
import { fadeWith } from '../core/animations';
import WPBridge from '../core/wordpress/bridge';
import { WPSearchPost } from '../core/wordpress/interfaces';

class Single extends Page {
    public static readonly is: string = 'ui-post';

    public static readonly hasRouting: boolean = true;

    @property({type: Object, reflect: false})
    public article: WPSearchPost;
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
        const bridge = new WPBridge(null, null);
        const requestedHash = location.hash.split('/');
        if(requestedHash.length > 1){
            const article = await bridge.loader.post(requestedHash[1], false).toPromise();
            this.loaded = true;

            if(article.length > 0){
                /* eslint-disable @typescript-eslint/camelcase */

                const image = await bridge.loader.media(article[0].featured_media).toPromise();

                const post = article[0] as WPSearchPost;
                document.title = post.title.rendered + ' | ' + Constants.title;
                this.article = post;
                this.featured = image.source_url;
            }

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
            ${!this.loaded ? html`
            <div class="loading">
                <paper-spinner active></paper-spinner>
            </div>` : html``}
            ${this.article ? html`
            <h1>${decodeHTML(this.article.title.rendered)}</h1>
            ${this.featured ? html`
            <div class="image-container" @click=${onImageContainerClicked}>
                <iron-image style="width: 100vw; height: 400px;" sizing="contain" src="${this.featured}"></iron-image>
            </div>
            ` : html``}
            <div class="content">
                ${unsafeHTML(this.article.content.rendered)}
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