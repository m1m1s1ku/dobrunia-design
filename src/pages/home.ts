import { html, TemplateResult } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import { property, LitElement } from 'lit-element';

import Page from '../core/strategies/Page';
import { navigate } from '../core/routing/routing';
import { CSS, Utils } from '../core/ui/ui';
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
            <iron-image sizing="contain" preload src="${project.images[0].path}"></iron-image>
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

export async function projectLoad(host: ElementWithProjects, lastCardSelector: string, filterSlug?: string, observer?: IntersectionObserver){
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
            
            const card = host.shadowRoot.querySelector(lastCardSelector);
            if(Utils.isInViewport(card)){
                card.classList.add('revealed');
                if(Utils.animationsReduced()){
                    return;
                }
                const animationConfig = pulseWith(300);
                card.animate(animationConfig.effect, animationConfig.options);
            } else {
                card.classList.add('reveal');
                observer.observe(card);
            }

        }, initial += 100);
    }

    host.loaded = true;
}

export function iObserverForCard(ratio: number){
    return new IntersectionObserver((entries, observer) => {
        for(const entry of entries){
            if(entry.intersectionRatio > ratio){
                entry.target.classList.remove('reveal');
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        }
    }, {
        root: null,
        rootMargin: '0px',
        threshold: ratio
    });
}

class Home extends Page implements ElementWithProjects {
    public static readonly is: string = 'ui-home';

    private _observer = iObserverForCard(.4);

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
        projectLoad(this, '#cards .card:last-child', null, this._observer);
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