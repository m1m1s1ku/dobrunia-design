import { html, TemplateResult } from 'lit-html';
import {repeat} from 'lit-html/directives/repeat';

import {unsafeHTML} from 'lit-html/directives/unsafe-html';
import { css, property } from 'lit-element';

import Page from '../core/strategies/Page';
import Constants from '../constants';

import { Utils, onImageContainerClicked } from '../core/ui/ui';
import { fadeWith } from '../core/animations';
import { wrap } from '../core/errors/errors';

export interface ProjectMinimal {
    title: string;
    content: string;
    excerpt: string;
    featuredImage: {
        sourceUrl: string;
    };
}

class Project extends Page {
    public static readonly is: string = 'ui-projet';

    public static readonly hasRouting = true;

    @property({type: Object, reflect: false, noAccessor: true})
    public project: ProjectMinimal;
    @property({type: String, reflect: false, noAccessor: true})
    public featured: string;
    @property({type: Array, reflect: false})
    public gallery: string[];

    public get head(){
        return {
            title: null,
            description: null,
            type: 'article',
            image: null,
            slug: null
        };
    }

    public static get styles(){
        return [
            ... super.styles,
            css`
            .project {
                display: flex;
                align-items: center;
                flex-direction: column;
                justify-content: center;
                padding: 2em;
            }

            .project iron-image {
                width: 90vw; 
                height: 240px;
                margin: 1em;
            }
            .post-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                background-color: rgba(255,255,255, .8);
                padding: 1em;
            }
            `
        ];
    }

    public async firstUpdated(){
        const requestedHash = location.hash.split('/');
        if(requestedHash.length > 1){
            const projectSlug = requestedHash[1];

            const projectQuery = `
            {
                projetBy(slug: "${projectSlug}") {
                  title
                  content
                  excerpt
                  featuredImage {
                    sourceUrl
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
            .then(res => res.data.projetBy)
            .catch(_ => this.dispatchEvent(wrap(_))) as ProjectMinimal;

            this.featured = first.featuredImage.sourceUrl;

            const testing = document.createElement('div');
            testing.innerHTML = first.content;

            const postImages = testing.querySelectorAll('img');
            const links = [];
            
            for(const image of Array.from(postImages)){
                links.push(image.src);
                image.parentElement.removeChild(image);
            }

            first.content = testing.innerText;

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
    }

    public render(): void | TemplateResult {
        return html`
        <div id="project" class="project" role="main">
        ${!this.loaded ? html`<paper-spinner active></paper-spinner>` : html``}

        ${this.project ? html`
            <h1 class="title">${this.project.title}</h1>
            ${this.featured ? html`
            <div class="image-container" @click=${onImageContainerClicked}>
                <iron-image sizing="contain" src=${this.featured}></iron-image>
            </div>
            `: html``}
            <main class="post-content">${unsafeHTML(this.project.content)}</main>
            ${this.gallery && this.gallery.length > 0 ? html`
                ${repeat(this.gallery, link => html`
                <div class="image-container" @click=${onImageContainerClicked}>
                    <iron-image sizing="contain" src=${link}></iron-image>
                </div>
                `)}
            ` : html``}
        ` : html``}
        </div>
        `;
    }

    private get page(){
        return this.shadowRoot.querySelector('#project');
    }
}
customElements.define(Project.is, Project);