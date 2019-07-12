import { LitElement } from 'lit-element';
import Elara from '../elara';

/**
 * Atom strategy
 * An element who extends from LitElement, and shouldn't be linked to Elara / Current app 
 *
 * @export
 * @class PureElement
 * @extends {LitElement}
 * @implements {Elara.Element}
 */
export default class PureElement extends LitElement implements Elara.Element {}