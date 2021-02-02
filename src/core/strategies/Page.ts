import { LitElement, property } from 'lit-element';

/**
 * Page strategy
 *
 * A simple page who extends from LitElement and implements Elara Page
 * Give minimal typography/grid styling
 * 
 * @export
 * @class Page
 * @extends {LitElement}
 * @implements {Elara.Page}
 */
export default class Page extends LitElement {
    public static hasRouting = false;

    @property({type: Boolean, reflect: true})
    public loaded = false;

    protected createRenderRoot(): this {
        return this;
    }
}