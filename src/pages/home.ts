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

    let projects = await bridge.loader.projects(filterSlug, null).toPromise();
    const loadedCategories = new Map<number, WPCategory>();
    for(const project of projects){
        const wasGet = loadedCategories.get(project.categories[0]);
        if(!wasGet){
            loadedCategories.set(project.categories[0], await bridge.loader.single(project.categories[0], null).toPromise());
        }
        project.category = loadedCategories.get(project.categories[0]);
        project.media = await bridge.loader.media(project.featured_media).toPromise();
    }
    
    // Import old to new using bridge
    /*const bridge = new WPBridge('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvYmFzZS5kb2JydW5pYWRlc2lnbi5jb20iLCJpYXQiOjE1NzAwNDExMzMsIm5iZiI6MTU3MDA0MTEzMywiZXhwIjoxNTcwNjQ1OTMzLCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.-fXn4sI9ZV3wCjvRQFu1jfN3Pu1LJKsSBMk8m6V3ZIg', null);
    for(const proj of filtered){
        const uploadedImages = [];
        console.warn('has ', proj.images.length, ' to upload before post');
        for(const image of proj.images){
            const imageBlob = await Processing.retrieveAsBlob(image.path, Constants.proxy);
            const picName = slugify(image.filename, '-');
            const imageNumber = await bridge.maker.media(new File([imageBlob], 'name'), picName).toPromise();
            uploadedImages.push(imageNumber);
            console.warn('inserted picture for project');
        }

        const first = uploadedImages.shift();

        let content = proj.content;
        for(const toAddFeatured of uploadedImages){
            console.warn('has ', uploadedImages.length, ' to concat before post');
            const media = await bridge.loader.media(toAddFeatured).toPromise();
            console.warn(media.source_url);
            content = content.concat(`
            \n <img src="${media.source_url}" />
            `);
        }

        const category = await bridge.maker.category({
            description:'',
            name: proj.category.name,
            slug: proj.category.slug,
            parent: null
        }).toPromise();

        console.warn('final content', content);

        const project = await bridge.maker.project({
            title: proj.title,
            status: WPArticleStatus.publish,
            content,
            categories: [category],
            // eslint-disable-next-line @typescript-eslint/camelcase
            featured_media: first,
            tags: [],
            date: new Date().toISOString(),
            excerpt: proj.slug,
            password: '',
            slug: '',
        }).toPromise();

        console.warn('added project è_é', project);
    }*/

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