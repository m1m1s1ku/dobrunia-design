import { html, TemplateResult } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import { property, LitElement, css } from 'lit-element';

import Page from '../core/strategies/Page';
import { navigate } from '../core/routing/routing';
import { CSS, Utils, chunk, decodeHTML } from '../core/ui/ui';
import { pulseWith } from '../core/animations';
import Constants from '../constants';

export interface ProjectMinimal {
    categories: {
        nodes: 
            {categoryId: number; slug: string; name: string}[];
    };
    featuredImage: {
        sourceUrl: string;
    };
    title: string;
    slug: string;
}

export function projectCard(project: ProjectMinimal){
    return html`
    <article class="project card" @click=${() => navigate('projet'.concat('/'+ project.slug))}>
        ${project.featuredImage ? html`
            <iron-image sizing="contain" preload src="${project.featuredImage.sourceUrl}"></iron-image>
        ` : ''}
        <div class="text">
            <h3 class="title">${decodeHTML(project.title)}</h3>
            <span>${project.categories.nodes[0].slug}</span>
        </div>
    </article>
    `;
}

export interface ElementWithProjects extends LitElement {
    projects: ReadonlyArray<ProjectMinimal>;
    loaded: boolean;
}

export async function projectLoad(host: ElementWithProjects, lastCardSelector: string, filterSlug?: number, observer?: IntersectionObserver){
    const projR = await fetch(Constants.graphql, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: `{
                projets(first: 100) {
                  nodes {
                    title
                    slug
                    featuredImage {
                      sourceUrl
                    }
                    categories {
                      nodes {
                        categoryId,
                        slug,
                        name
                      }
                    }
                  }
                }
              }
            `,
        }),
    }).then(res => res.json()).then(res => res.data);

    let projects = projR.projets.nodes;
    if(filterSlug){
        projects = projects.filter(project => {
            if(project.categories.nodes.find(node => node.slug === filterSlug)){
                return true;
            }
    
            return false;
        });
    }

    const chunks = chunk(projects, 1) as ProjectMinimal[][];

    let appendTime = 100;
    for(const chunk of chunks){
        setTimeout(async () => {
            host.projects = [...host.projects, ...chunk];
            await host.updateComplete;
            
            const card = host.shadowRoot.querySelector(lastCardSelector);
            if(Utils.isInViewport(card)){
                appendTime = 0;
                card.classList.add('revealed');
                if(Utils.animationsReduced()){
                    return;
                }
                const animationConfig = pulseWith(300);
                card.animate(animationConfig.effect, animationConfig.options);
            } else {
                appendTime += 50;
                card.classList.add('reveal');
                observer.observe(card);
            }
        }, appendTime);
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
    public projects: ReadonlyArray<ProjectMinimal> = [];

    @property({type: Boolean, reflect: false})
    public loaded = false;

    public get head(){
        return {
            title: 'Accueil',
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
            CSS.cards,
            css``
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