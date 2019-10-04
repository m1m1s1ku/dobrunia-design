import { html, TemplateResult } from 'lit-html';
import {unsafeHTML} from 'lit-html/directives/unsafe-html';
import { css, property } from 'lit-element';

import Page from '../core/strategies/Page';
import Constants from '../constants';

import { Utils, decodeHTML, onImageContainerClicked } from '../core/ui/ui';
import { fadeWith } from '../core/animations';
import WPBridge from '../core/wordpress/bridge';
import { WPSearchPost } from '../core/wordpress/interfaces';

class Project extends Page {
    public static readonly is: string = 'ui-project';

    public static readonly hasRouting = true;

    @property({type: Object, reflect: false, noAccessor: true})
    public project: WPSearchPost;
    @property({type: String, reflect: false, noAccessor: true})
    public featured: string;

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
                width: 100vw; 
                height: 240px;
                margin: 1em;
            }
            .post-content {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            `
        ];
    }

    public async firstUpdated(){
        const requestedHash = location.hash.split('/');
        if(requestedHash.length > 1){
            const projectSlug = requestedHash[1];
            const bridge = new WPBridge(null, null);
            const projects = await bridge.loader.projects(null, projectSlug).toPromise();
            console.warn(projects);

            if(projects.length < 0){
                throw new Error('Project not found');
            }

            const first = projects[0];
            const media = await bridge.loader.media(first.featured_media).toPromise();
            const featured = media.source_url;

            this.project = {...first};
            this.featured = featured;
            this.loaded = true;
            document.title = decodeHTML(this.project.title.rendered) + ' | ' + Constants.title;
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
            <h1 class="title">${unsafeHTML(this.project.title.rendered)}</h1>
            ${this.featured ? html`
            <div class="image-container" @click=${onImageContainerClicked}>
                <iron-image sizing="contain" src=${this.featured}></iron-image>
            </div>
            `: html``}
            <main class="post-content">${unsafeHTML(this.project.content.rendered)}</main>
        ` : html``}
        </div>
        `;
    }

    private get page(){
        return this.shadowRoot.querySelector('#project');
    }
}
customElements.define(Project.is, Project);