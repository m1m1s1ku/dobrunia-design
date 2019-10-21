import { LitElement, property } from 'lit-element';
import { CSS } from '../ui/ui';

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

    public static get styles(){
        return [
            CSS.grid,
            CSS.spinner,
            CSS.images,
            CSS.typography.buttons,
            CSS.typography.lists,
            CSS.typography.links,
            CSS.typography.heading,
            CSS.shortcodes
        ];
    }
}