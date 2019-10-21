import { property } from 'lit-element';

import Elara from '../elara';

import Page from './Page';

import { load } from '../bootstrap/bootstrap';
import { Utils } from '../ui/ui';

/**
 * Root strategy
 *
 * Should be used by the main-component of an app 
 * 
 * ```html
 * 	<elara-app></elara-app>
 * ```
 * @export
 * @class Root
 * @extends {Page}
 */
export default class Root extends Page {
	public hasElaraRouting = true;
	@property({reflect: true, type: String})
	public route: string;
	
	public connectedCallback(){
		super.connectedCallback();

		Utils.applyVariablesFor(Utils.dayOrNight());
	}

	public disconnectedCallback(){
		super.disconnectedCallback();
	}
		
	/**
	 * Create the render root
	 */
	protected createRenderRoot(){
		// @tool: make elara-app in light-dom
		// return this;

		return this.attachShadow({mode: 'open'});
	}
		
	public async load(route: string){
		return await load(route, this._content);
	}
		
	public askModeChange(mode: Elara.Modes): boolean {
		return Utils.applyVariablesFor(mode);
	}
		
	protected get _content(): HTMLElement {
		return this.shadowRoot.querySelector('main');
	}
}