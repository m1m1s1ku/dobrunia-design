import { html, TemplateResult } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import { css, property } from 'lit-element';

import Page from '../core/strategies/Page';
import { CSS } from '../core/ui/ui';
import { projectCard, projectLoad, ElementWithProjects, iObserverForCard } from './home';
import Constants from '../constants';

import { WPSearchPost } from '../core/wordpress/interfaces';
import WPBridge from '../core/wordpress/bridge';

class Category extends Page implements ElementWithProjects {
    public static readonly is: string = 'ui-category';

    public static readonly hasRouting: boolean = true;

    @property({type: Object, reflect: false})
    public projects: ReadonlyArray<WPSearchPost> = [];
    
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
            this.loaded = true;
        }
    }

    private async _loadRequested(hash: string){
        const bridge = new WPBridge(null, null);
        const category = await bridge.loader.single(null, hash).toPromise();

        if(!category || !category[0]){
            document.title = 'Non trouvé' + ' | ' + Constants.title;
            this.projects = [];
            this.loaded = true;
            return;
        }

        document.title = category[0].name + ' | ' + Constants.title;

        this.projects = [];
        await projectLoad(this, '#cards .card:last-child', category[0].id, this._observer);
    }

    public render(): void | TemplateResult {
        return html`
        ${!this.loaded ? html`
        <div class="loading">
            <paper-spinner active></paper-spinner>
        </div>
        ` : html``}

        ${this.loaded && this.projects.length === 0 ? html`
            <p class="not-found">Catégorie non trouvée</p>
        ` : html``}

        <div id="cards" class="category cards" role="main">
        ${repeat(this.projects, (project) =>  projectCard(project))}
        </div>
        `;
    }
}
customElements.define(Category.is, Category);