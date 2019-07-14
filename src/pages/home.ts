import { html, TemplateResult } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import { property, LitElement } from 'lit-element';

import Page from '../core/strategies/Page';
import { navigate } from '../core/routing/routing';
import { CSS } from '../core/ui/ui';
import Constants from '../core/constants/constants';
import { pulseWith } from '../core/animations';

export interface Category {
    id: string;
    name: string;
    slug: string;
};

export interface Image {
    filename: string;
    id: string;
    isRaw: number;
    path: string;
    projectId: string;
    size: string;
    userOrder: number;
};

export interface Project {
    bigOrder: number;
    category: Category;
    categoryId: string;
    content: string; // unsafe html
    description: string;
    images: ReadonlyArray<Image>;
    slug: string;
    title: string;
    userOrder: number;
};

export function projectCard(project: Project){
    return html`
    <article class="project card" @click=${() => navigate('project'.concat('/'+ project.slug))}>
        ${project.images ? html`
            <iron-image style="width: 320px; height: 240px;" sizing="contain" preload src="${project.images[0].path}"></iron-image>
        ` : ''}
        <div class="text">
            <h3 class="title">${project.title}</h3>
            <span>${project.category.name}</span>
        </div>
    </article>
    `;
}

export interface ElementWithProjects extends LitElement {
    projects: ReadonlyArray<Project>;
    loaded: boolean;
} 

export const chunk = (arr: unknown[], size: number) => {
    const R = [];
    for (let i=0, len=arr.length; i<len; i+=size){
        R.push(arr.slice(i,i+size));
    }
    return R;
};

export async function projectLoad(host: ElementWithProjects, lastCardSelector: string, filterSlug?: string){
    const request = await fetch(Constants.route('projects'));
    const parsed = await request.json();

    let filtered = parsed.data;
    if(filterSlug){
        filtered = parsed.data.filter(project => {
            if(project.category.slug === filterSlug){
                return true;
            }
    
            return false;
        });
    }

    const chunks = chunk(filtered, 1);

    let initial = 100;
    for(const chunk of chunks){
        setTimeout(async () => {
            host.projects = [...host.projects, ...chunk];
            await host.updateComplete;
            
            const animationConfig = pulseWith(300);
            host.shadowRoot.querySelector(lastCardSelector).animate(animationConfig.effect, animationConfig.options);
        }, initial += 100);
    }

    host.loaded = true;
}

class Home extends Page implements ElementWithProjects {
    public static readonly is: string = 'ui-home';

    @property({type: Array, reflect: false})
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

    public connectedCallback(): void {
        super.connectedCallback();
        projectLoad(this, '#cards .card:last-child');
    }

    public static get styles(){
        return [
            ... super.styles,
            CSS.cards
        ];
    }

    public render(): void | TemplateResult {
        return html`
        ${!this.loaded ? html`<div class="loading"><paper-spinner active></paper-spinner></div>` : html``}
        <div id="cards" class="animated cards">
        ${repeat(this.projects, (project) => {
            return projectCard(project);
        })}
        </div>
        `;
    }
}
customElements.define(Home.is, Home);