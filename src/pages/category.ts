import { html, TemplateResult } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import { css, property } from 'lit-element';

import Page from '../core/strategies/Page';
import { CSS } from '../core/ui/ui';
import { projectCard, projectLoad, ElementWithProjects, iObserverForCard, ProjectMinimal } from './home';
import Constants from '../constants';

class Category extends Page implements ElementWithProjects {
    public static readonly is: string = 'ui-category';

    public static readonly hasRouting: boolean = true;

    @property({type: Object, reflect: false})
    public projects: ReadonlyArray<ProjectMinimal> = [];

    @property({type: Boolean, reflect: false})
    public empty = false;
    
    private _observer = iObserverForCard(.2);
    private _changeListener: () => {};

    public get head(){
        return {
            title: null,
            description: null,
            type: 'category',
            image: null,
            slug: '#!category'
        };
    }

    public static get styles(){
        return [
            ... super.styles,
            CSS.cards,
            css`
            .category {
                padding: 2em;
                padding-top: 0;
            }

            .not-found {
                display: flex;
                justify-content: center;
                align-items: center;
            }
            `
        ];
    }

    public connectedCallback(){
        super.connectedCallback();

        this._changeListener = this._reload.bind(this);
        window.addEventListener('hashchange', this._changeListener);
    }

    public disconnectedCallback(){
        super.disconnectedCallback();
        window.removeEventListener('hashchange', this._changeListener);
        this._changeListener = null;
    }

    private async _reload(){
        this.loaded = false;
        const requestedHash = location.hash.split('/');
        await this._loadRequested(requestedHash[1]);
        this.loaded = true;
    }

    public async firstUpdated(){
        const requestedHash = location.hash.split('/');
        if(requestedHash.length > 1){
            this._loadRequested(requestedHash[1]);
        } else {
            this.empty = true;
            this.loaded = true;
        }
    }

    private async _loadRequested(hash: string){
        const query = `{
            categories(where: {slug:"${hash}"}) {
              edges {
                node {
                  id,
                  name,
                  slug
                }
              }
            }
          }
        `;

        const projR = await fetch(Constants.graphql, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query
            }),
        }).then(res => res.json()).then(res => res.data);
    
        const category = projR.categories.edges;
        const cat = category[0].node;
        if(!category || !cat){
            document.title = 'Non trouvé' + ' | ' + Constants.title;
            this.empty = true;
            this.projects = [];
            this.loaded = true;
            return;
        }

        document.title = cat.name + ' | ' + Constants.title;

        this.projects = [];
        await projectLoad(this, '#cards .card:last-child', cat.slug, this._observer);
    }

    public render(): void | TemplateResult {
        return html`
        ${!this.loaded ? html`
        <div class="loading">
            <paper-spinner active></paper-spinner>
        </div>
        ` : html``}

        ${this.loaded && this.empty ? html`
            <p class="not-found">Catégorie non trouvée</p>
        ` : html``}

        <div id="cards" class="category cards" role="main">
        ${repeat(this.projects, (project) =>  projectCard(project))}
        </div>
        `;
    }
}
customElements.define(Category.is, Category);