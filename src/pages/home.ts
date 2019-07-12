import { html, TemplateResult } from 'lit-html';
import { css, property } from 'lit-element';

import Page from '../core/strategies/Page';
import { repeat } from 'lit-html/directives/repeat';

interface Category {
    id: string;
    name: string;
    slug: string;
};

interface Image {
    filename: string;
    id: string;
    isRaw: number;
    path: string;
    projectId: string;
    size: string;
    userOrder: number;
};

interface Project {
    bigOrder: number;
    category: Category;
    categoryId: string;
    content: string; // unsafe html
    description: string;
    image: string;
    images: ReadonlyArray<Image>;
    slug: string;
    title: string;
    userOrder: number;
};

class Home extends Page {
    public static readonly is: string = 'ui-home';

    @property({type: Array})
    public projects: ReadonlyArray<Project> = [];

    public get head(){
        return {
            title: 'Projets',
            description: '',
            type: 'page',
            image: '',
            slug: '#!home'
        };
    }

    public static get styles(){
        return [
            ... super.styles,
            css`
            .cards {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
                grid-gap: 1em;
                
                padding: 1em 2em;
            }

            .card {
                text-align: center;
            }
            .card .text .title {
                margin: .5em;
            }
            .card .text span {
                margin: 1em;
            }
            `
        ];
    }

    public async firstUpdated(){
        const request = await fetch('https://k8s02.local/api/projects');
        const parsed = await request.json();
        this.projects = parsed.data;
    }

    public render(): void | TemplateResult {
        return html`
        <div class="animated cards">
        ${repeat(this.projects, (project) => {
            return html`
            <article class="project card">
                ${project.images ? html`
                    <iron-image style="width: 320px; height: 240px;" sizing="contain" preload src="${project.images[0].path}"></iron-image>
                ` : ''}
                <div class="text">
                    <h3 class="title">${project.title}</h3>
                    <span>${project.category.name}</span>
                </div>
            </article>
            `;
        })}
        </div>
        `;
    }
}
customElements.define(Home.is, Home);