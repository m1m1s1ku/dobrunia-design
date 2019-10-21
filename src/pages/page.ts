import { html, TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { css, property } from 'lit-element';
import { oc } from 'ts-optchain';

import Page from '../core/strategies/Page';
import Constants from '../constants';

import { Utils, onImageContainerClicked } from '../core/ui/ui';
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
    private _toLoad: string;

    public constructor(toLoad: string){
        super();

        this._toLoad = toLoad;
    }
    
    private async _load(uri: string){
        const pageQuery = `
        {
            pageBy(uri: "${uri}") {
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

    public static get styles(){
        return [
            ... super.styles,
            css`
            .page {
                padding: 2em;
                background: linear-gradient( to bottom, rgba(255, 255, 255, 0), rgba(249, 249, 249, 0.6) );
            }

            li {
                list-style: initial;
            }

            .content {
                padding: 1em;
                width: 100%;
                background-color: rgba(255, 255, 255, 0.8);
            }

            .cols {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
            }

            iron-image {
                width: 25vw; 
                height: 400px;
            }

            .image-container {
                padding: 1em;
            }

            h3 {
                margin: 0;
            }

            @media (max-width: 600px){
                .cols {
                    flex-direction: column-reverse;
                }

                .image-container {
                    text-align: center;
                }

                iron-image {
                    width: 250px;
                }
            }
            `
        ];
    }

    public async firstUpdated(){
        await this._load(this._toLoad);
    }

    public render(): void | TemplateResult {
        return html`
        <div id="page" class="page" role="main">
            ${!this.loaded ? html`
            <div class="loading">
                <paper-spinner active></paper-spinner>
            </div>` : html``}
            ${this.article ? html`
            <div class="cols">
                <div class="content">
                    ${unsafeHTML(this.article.content)}
                </div>
                ${this.featured ? html`
                <div class="image-container" @click=${onImageContainerClicked}>
                    <iron-image sizing="contain" src="${this.featured}"></iron-image>
                </div>
                ` : html``}
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