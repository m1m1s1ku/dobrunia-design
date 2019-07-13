import { html, TemplateResult } from 'lit-html';
import { css, property } from 'lit-element';

import Page from '../core/strategies/Page';
import { Project, projectCard } from './home';
import { repeat } from 'lit-html/directives/repeat';
import { CSS } from '../core/ui/ui';
import Constants from '../core/constants/constants';

class Category extends Page {
    public static readonly is: string = 'ui-category';

    public static readonly hasRouting: boolean = true;

    @property({type: Object, reflect: false})
    public category: ReadonlyArray<Project> = [];

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
            const slug = requestedHash[1];

            const request = await fetch(Constants.route('projects'));
            const parsed = await request.json();
            const filtered = parsed.data.filter(project => {
                if(project.category.slug === slug){
                    return true;
                }
    
                return false;
            });
    
            this.category = filtered;
        }
    }

    public render(): void | TemplateResult {
        return html`
        <div class="category cards" role="main">
        ${repeat(this.category, (project) => {
            return projectCard(project);
        })}
        </div>
        `;
    }
}
customElements.define(Category.is, Category);