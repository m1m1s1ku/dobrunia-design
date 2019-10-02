import { html, TemplateResult } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import { property, LitElement } from 'lit-element';

import Page from '../core/strategies/Page';
import { navigate } from '../core/routing/routing';
import { CSS, Utils, chunk } from '../core/ui/ui';
import Constants from '../constants';
import { pulseWith } from '../core/animations';
import { Project } from '../bridge';
// import WPBridge from '../core/wordpress/bridge';
// import { WPArticleStatus } from '../core/wordpress/interfaces';

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

export async function projectLoad(host: ElementWithProjects, lastCardSelector: string, filterSlug?: string, observer?: IntersectionObserver){
    const request = await fetch(Constants.route('projects'));
    const parsed = await request.json();

    let filtered = parsed.data as Project[];

    // debugger;
    /* 
    // Import old to new using bridge
    const bridge = new WPBridge('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvYmFzZS5kb2JydW5pYWRlc2lnbi5jb20iLCJpYXQiOjE1NzAwNDExMzMsIm5iZiI6MTU3MDA0MTEzMywiZXhwIjoxNTcwNjQ1OTMzLCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.-fXn4sI9ZV3wCjvRQFu1jfN3Pu1LJKsSBMk8m6V3ZIg', null);
    for(const proj of filtered){
        // get current project data

        const uploadedImages = [];
        for(const image of proj.images){
            const imageBlob = await Processing.retrieveAsBlob(image.path, Constants.proxy);
            const picName = slugify(image.filename, '-');
            const imageNumber = await bridge.maker.media(new File([imageBlob], 'name'), picName).toPromise();
            uploadedImages.push(imageNumber);
            console.warn('inserted picture for project');
            debugger;
        }

        const first = uploadedImages.shift();

        const project = await bridge.maker.project({
            title: proj.title,
            status: WPArticleStatus.publish,
            content: proj.content,
            categories: [],
            // eslint-disable-next-line @typescript-eslint/camelcase
            featured_media: first,
            tags: [],
            date: new Date().toISOString(),
            excerpt: proj.slug,
            password: '',
            slug: '',
        }).toPromise();
        console.warn('added project è_é', project);
        // add medias
        // add post content
    }
    */

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