import { property } from 'lit-element';

import Page from './Page';

import { load } from '../bootstrap/bootstrap';
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
	
	/**
	 * Create the render root
	 */
	protected createRenderRoot(){
		// @tool: make elara-app in light-dom
		// return this;

		return this.attachShadow({mode: 'open'});
	}
		
	public async load(route: string){
		this.route = route;
		return await load(route, this._content);
	}
		
	protected get _content(): HTMLElement {
		return this.shadowRoot.querySelector('main');
	}
}