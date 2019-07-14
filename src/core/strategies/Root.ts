import { property } from 'lit-element';

import Elara from '../elara';

import Page from './Page';

import { MenuElement } from '../../atoms/menu';
import { hashChange } from '../routing/routing';
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
	protected _menuFade: Animation;

	@property({reflect: true, type: String})
	public route: string;
	
	public loadedElement: HTMLElement;

	private _onHashChangeListener: () => void;

	public connectedCallback(){
		super.connectedCallback();

		Utils.applyVariablesFor(Utils.dayOrNight());

		this._onHashChangeListener = this._onHashChange.bind(this);
		window.addEventListener('hashchange', this._onHashChangeListener, { passive: true });
	}

	public disconnectedCallback(){
		super.disconnectedCallback();
		window.removeEventListener('hashchange', this._onHashChangeListener);
	}
		
	/**
	 * Create the render root
	 */
	protected createRenderRoot(){
		// @tool: make elara-app in light-dom
		// return this;

		return this.attachShadow({mode: 'open'});
	}

	protected async _onHashChange(event: HashChangeEvent){
		const route = hashChange(event, this.default);
		this.route = route;

		this._content.innerHTML = '';
		this.loadedElement = await this.load(route);
	}
		
	public async load(route: string){
		return await load(route, this._content, this._menu, this._menuFade, this.head.title);
	}
		
	public askModeChange(mode: Elara.Modes): boolean {
		return Utils.applyVariablesFor(mode);
	}
		
	protected get _content(): HTMLElement {
		return this.shadowRoot.querySelector('main');
	}

	protected get _menu(): MenuElement {
		return this.shadowRoot.querySelector('#menu');
	}
}