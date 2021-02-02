import { html, TemplateResult } from 'lit-html';
import {repeat} from 'lit-html/directives/repeat';

import {unsafeHTML} from 'lit-html/directives/unsafe-html';
import { property, customElement } from 'lit-element';

import Page from '../core/strategies/Page';
import Constants from '../constants';

import { Utils, onImageContainerClicked, decodeHTML } from '../core/ui/ui';
import { fadeWith } from '../core/animations';
import { wrap } from '../core/errors/errors';

export interface ProjectMinimal {
    title: string;
    content: string;
    excerpt: string;
    featuredImage: {
        node: {
            sourceUrl: string;
        }
    };
}

@customElement('ui-projet')
export class Project extends Page {
    public static readonly is: string = 'ui-projet';

    public static readonly hasRouting = true;

    @property({type: Object, reflect: false, noAccessor: true})
    public project: ProjectMinimal;
    @property({type: String, reflect: false, noAccessor: true})
    public featured: string;
    @property({type: Array, reflect: false})
    public gallery: string[];

    private _toLoad: string;

    public constructor(slug: string){
        super();
        this._toLoad = slug;
    }

    public async firstUpdated(): Promise<void> {
        const projectQuery = `
        {
            projet(id: "${this._toLoad}", idType: SLUG) {
                title
                content
                featuredImage {
                    node {
                        sourceUrl(size: LARGE)
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
                query: projectQuery
            })
        }).then(res => res.json())
        .then(res => res.data.projet)
        .catch(_ => this.dispatchEvent(wrap(_))) as ProjectMinimal;

        if(first && first.featuredImage && first.featuredImage.node &&first.featuredImage.node.sourceUrl){
            this.featured = first.featuredImage.node.sourceUrl;
        } else {
            this.featured = '/assets/logo.png';
        }

        const testing = document.createElement('div');
        testing.innerHTML = first.content;

        const postImages = testing.querySelectorAll('img');
        const links = [];
        
        for(const image of Array.from(postImages)){
            links.push(image.src);
            image.parentElement.removeChild(image);
        }

        first.content = testing.innerText;

        first.title = decodeHTML(first.title);

        this.project = first;
        this.gallery = links;
        this.loaded = true;
        document.title = this.project.title + ' | ' + Constants.title;
        if(Utils.animationsReduced()){
            return;
        }
        const fade = fadeWith(300, true);
        this.page.animate(fade.effect, fade.options);
    }

    public render(): void | TemplateResult {
        return html`
        <div id="project" class="project" role="main">
        ${!this.loaded ? html`<mwc-circular-progress indeterminate></mwc-circular-progress>` : html``}

        ${this.project ? html`
            <h1 class="title">${this.project.title}</h1>
            ${this.featured ? html`
            <div class="image-container" @click=${onImageContainerClicked}>
                <elara-image .catch=${true} src=${this.featured}></elara-image>
            </div>
            `: html``}
            <main class="post-content">${unsafeHTML(this.project.content)}</main>
            ${this.gallery && this.gallery.length > 0 ? html`
            <div class="gallery ${this.gallery.length < 3 ? 'short' : ''}">
                ${repeat(this.gallery, link => html`
                <div class="image-container" @click=${onImageContainerClicked}>
                    <elara-image .catch=${true} src=${link}></elara-image>
                </div>
                `)}
            </div>
            ` : html``}
        ` : html``}
        </div>
        `;
    }

    private get page(){
        return this.querySelector('#project');
    }
}
