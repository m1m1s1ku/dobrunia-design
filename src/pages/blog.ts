import { html, TemplateResult } from 'lit-html';
import { css } from 'lit-element';

import Page from '../core/strategies/Page';

class Blog extends Page {
    public static readonly is: string = 'ui-blog';

    public get head(){
        return {
            title: 'Blog',
            description: null,
            type: null,
            image: null,
            slug: null
        };
    }

    public static get styles(){
        return [
            ... super.styles,
            css`
            .blog {
                padding: 2em;
            }
            `
        ];
    }

    public render(): void | TemplateResult {
        return html`
        <div class="blog" role="main">
        
        </div>
        `;
    }
}
customElements.define(Blog.is, Blog);