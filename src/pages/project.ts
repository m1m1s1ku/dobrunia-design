import { html, TemplateResult } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import {unsafeHTML} from 'lit-html/directives/unsafe-html';
import { css, property } from 'lit-element';

import Page from '../core/strategies/Page';
import Constants from '../core/constants/constants';

import { Project as ProjectInfo } from '../bridge';
import { onImageContainerClicked } from '../core/ui/ui';

class Project extends Page {
    public static readonly is: string = 'ui-project';

    public static readonly hasRouting = true;

    @property({type: Object})
    public project: ProjectInfo;

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
                width: 30vw; 
                height: 240px;
                margin: 1em;
            }
            `
        ];
    }

    public async firstUpdated(){
        const requestedHash = location.hash.split('/');
        if(requestedHash.length > 1){
            const projectSlug = requestedHash[1];
            const projectR = await fetch(Constants.route('projects/').concat(projectSlug), {
                method: 'POST'
            });

            const response = await projectR.json();
            this.project = {... response.data, content: unsafeHTML(`${response.data.content}`)};
            document.title = this.project.title + ' | ' + Constants.title;
        }
    }

    public render(): void | TemplateResult {
        return html`
        <div class="project" role="main">
        ${this.project ? html`
            <h1 class="title">${this.project.title}</h1>
            <p>${this.project.description}</p>
            ${this.project.content}
            ${repeat(this.project.images, image => {
                return html`
                <div class="image-container" @click=${onImageContainerClicked}>
                    <iron-image sizing="cover" preload src="${image.path}"></iron-image>
                </div>
                `;
            })}
        ` : html`
        `}
        </div>
        `;
    }
}
customElements.define(Project.is, Project);