import { html, TemplateResult } from 'lit-html';
import { css } from 'lit-element';

import Page from '../core/strategies/Page';

class Blank extends Page {
    public static readonly is: string = 'ui-blank';

    public get head(){
        return {
            title: null,
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
            .Blank {
                padding: 2em;
            }
            `
        ];
    }

    public render(): void | TemplateResult {
        return html`
        <div class="Blank" role="main">
            <h1>Blank</h1>
            <p>WIP</p>
        </div>
        `;
    }
}
customElements.define(Blank.is, Blank);