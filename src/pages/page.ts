import { html, TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { property, customElement } from 'lit-element';

import Page from '../core/strategies/Page';
import Constants from '../constants';

import { Utils, onImageContainerClicked } from '../core/ui/ui';
import { fadeWith } from '../core/animations';
import { ProjectMinimal } from './project';
import { wrap } from '../core/errors/errors';
import { navigate } from '../core/routing/routing';

@customElement('ui-page')
export class PageController extends Page {
    public static readonly hasRouting: boolean = true;

    @property({type: Object, reflect: false})
    public article: ProjectMinimal;
    @property({type: String, reflect: false})
    public featured: string;
    private _toLoad: string;

    public constructor(toLoad: string){
        super();

        this._toLoad = toLoad;
    }
    
    private async _load(uri: string){
        const pageQuery = `
        {
            pages(where: {name: "${uri}"}) {
                edges {
                  node {
                    id
                    title
                    featuredImage {
                      node {
                        sourceUrl(size: LARGE)
                      }
                    }
                    content(format: RENDERED)
                  }
                }
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
        }).then(res => res.json()).then(res => res.data.pages?.edges[0]?.node).catch(_ => this.dispatchEvent(wrap(_))) as ProjectMinimal;

        if(!first){
            this.loaded = true;
            return;
        }

        this.loaded = true;

        const post = first;
        document.title = post.title + ' | ' + Constants.title;
        this.article = post;
        const hasSource = post?.featuredImage?.node?.sourceUrl;
        this.featured = hasSource ? post.featuredImage.node.sourceUrl : null;

        if(Utils.animationsReduced()){
            return;
        }
        const fade = fadeWith(300, true);
        this._page.animate(fade.effect, fade.options);
    }

    public async firstUpdated(): Promise<void> {
        await this._load(this._toLoad);
    }

    public render(): void | TemplateResult {
        return html`
        <div id="page" class="page" role="main">
            ${!this.loaded ? html`
            <div class="loading">
                <mwc-circular-progress indeterminate></mwc-circular-progressr>
            </div>` : html``}
            ${this.article ? html`
            <div class="cols">
                <div class="content">
                    ${unsafeHTML(this.article.content)}
                </div>
                ${this.featured ? html`
                <div class="image-container" @click=${onImageContainerClicked}>
                    <elara-image .catch=${true} src="${this.featured}"></elara-image>
                </div>
                ` : html``}
            </div>
            ` : html`
            ${this.loaded && this.article ? html`
            <div class="cols">
                <div class="content page-not-found">
                    <h2>Page non trouvée</h2>
                    <p>Nous n'avons trouvé aucune page nommée ainsi, elle a peut-être été déplacée.</p>
                    <a @click=${() => navigate(Constants.defaults.route)}><mwc-icon-button icon="home"></mwc-icon-button> Retourner à l'accueil</a>
                </div>
            </div>
            ` : ''}
            `}
        </div>
        `;
    }

    private get _page(){
        return this.querySelector('#page');
    }
}
