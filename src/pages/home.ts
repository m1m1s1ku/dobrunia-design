import { html, TemplateResult } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import { property, LitElement } from 'lit-element';

import Page from '../core/strategies/Page';
import { navigate } from '../core/routing/routing';
import { CSS, Utils, chunk, decodeHTML } from '../core/ui/ui';
import { pulseWith } from '../core/animations';
import WPBridge from '../core/wordpress/bridge';
import { WPSearchPost, WPCategory } from '../core/wordpress/interfaces';

export function projectCard(project: WPSearchPost){
    return html`
    <article class="project card" @click=${() => navigate('project'.concat('/'+ project.slug))}>
        ${project.media ? html`
            <iron-image sizing="contain" preload src="${project.media.source_url}"></iron-image>
        ` : ''}
        <div class="text">
            <h3 class="title">${decodeHTML(project.title.rendered)}</h3>
            <span>${project.category.name}</span>
        </div>
    </article>
    `;
}

export interface ElementWithProjects extends LitElement {
    projects: ReadonlyArray<WPSearchPost>;
    loaded: boolean;
}

export async function projectLoad(host: ElementWithProjects, lastCardSelector: string, filterSlug?: number, observer?: IntersectionObserver){
    const bridge = new WPBridge(null, null);

    // TODO : Remove / improve that thing

    let projects = await bridge.loader.projects(filterSlug, null).toPromise();
    const loadedCategories = new Map<number, WPCategory>();
    
    for(const project of projects){
        const wasGet = loadedCategories.get(project.categories[0]);
        if(!wasGet){
            loadedCategories.set(project.categories[0], await bridge.loader.single(project.categories[0], null).toPromise());
        }
        project.category = loadedCategories.get(project.categories[0]);
    }

    if(filterSlug){
        projects = projects.filter(project => {
            if(project.category.id === filterSlug){
                return true;
            }
    
            return false;
        });
    }

    const chunks = chunk(projects, 1);

    let initial = 100;
    for(const chunk of chunks){
        setTimeout(async () => {
            for(const proj of chunk){
                proj.media = await bridge.loader.media(proj.featured_media).toPromise();
            }
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
    public projects: ReadonlyArray<WPSearchPost> = [];

    @property({type: Boolean, reflect: false})
    public loaded = false;

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