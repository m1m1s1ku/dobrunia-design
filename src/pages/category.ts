import { html, TemplateResult } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import { css, property } from 'lit-element';

import Page from '../core/strategies/Page';
import { CSS } from '../core/ui/ui';
import { projectCard, projectLoad, ElementWithProjects, iObserverForCard } from './home';
import Constants from '../constants';

import { Project } from '../bridge';

class Category extends Page implements ElementWithProjects {
    public static readonly is: string = 'ui-category';

    public static readonly hasRouting: boolean = true;

    @property({type: Object, reflect: false})
    public projects: ReadonlyArray<Project> = [];
    
    private _observer = iObserverForCard(.2);

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
            }
            `
        ];
    }

    public async firstUpdated(){
        const requestedHash = location.hash.split('/');
        if(requestedHash.length > 1){
            await projectLoad(this, '#cards .card:last-child', requestedHash[1], this._observer);
            if(this.projects.length === 0){
                setTimeout(() => {
                    document.title = this.projects[0].category.name + ' | ' + Constants.title;
                }, 200);
            } else {
                document.title = this.projects[0].category.name + ' | ' + Constants.title;
            }
        }
    }

    public render(): void | TemplateResult {
        return html`
        ${!this.loaded ? html`<paper-spinner active></paper-spinner>` : html``}

        <div id="cards" class="category cards" role="main">
        ${repeat(this.projects, (project) =>  projectCard(project))}
        </div>
        `;
    }
}
customElements.define(Category.is, Category);