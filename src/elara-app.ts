import { html, css, CSSResult, TemplateResult } from 'lit-element';

import Root from './core/strategies/Root';

import { promise } from './core/bootstrap/bootstrap';
import { navigate } from './core/routing/routing';
import { fadeWith } from './core/animations';

import './pages/index';
import './atoms/not-found';
import './atoms/menu';
import './atoms/nav';

// Polyfills
import('./polyfill');
// lazy import for polymer components
import('./polymer');

export class ElaraApp extends Root {
	public static readonly is: string = 'elara-app';

	public get loadables(){
		return [];
	}

	public get bootstrap(){
		return promise(this.loadables, this.shadowRoot);
	}

	public async show(route: string): Promise<void> {
		navigate(route);
		await this._hideMenu();
	}

	public async menu(isHide: boolean): Promise<void> {
		if(isHide){
			return this._hideMenu();
		} else {
			return this._showMenu();
		}
	}

	public firstUpdated(){		
		const hashEvent = new HashChangeEvent('hashchange', {
			newURL: location.origin + location.pathname + location.hash,
			oldURL: null
		});

		this._onHashChange(hashEvent);
	}

	public static get styles(): CSSResult[] {
		return [
		css`
		.content, .menu-content {
			background: var(--elara-background-color);
			color: var(--elara-font-color);
			display: inline-block;

			font-family: var(--elara-font-primary);
			opacity: 1;
			margin: 0;
			width: 100%;
		}

		.content.hidden {
			opacity: 0;
			z-index: 0;
			visibility: hidden;
		}

		.menu {
			position: absolute;
			top: 0;
			right: 0;
			height: 45px;
			width: 45px;
			color: var(--elara-font-color);
			z-index: 0;
		}

		footer {
			font-family: var(--elara-font-primary);
			font-size: 0.8em;
			background: var(--elara-background-color);
			color: var(--elara-font-color);
			display: flex;
			padding: 1em;
			flex-direction: column;
		}

		footer a {
			cursor: pointer;
			color: var(--elara-primary);
			text-decoration: none;
		}

		footer a:hover {
			color: var(--elara-font-hover);
		}
		`];
	  } 

	public get links(){
		return [
			{idx: 0, route: 'about', name: 'à propos'},
			{idx: 1, route: 'home', name: 'projets'},
			{idx: 2, route: 'blog', name: 'blog'},
			{idx: 3, route: 'contact', name: 'contact'}
		];
	}
	
	public render() {
		return html`
			<ui-nav .items=${this.links} .route=${this.route}></ui-nav>

			<main id="main" class="content"></main>

			<ui-menu id="menu" .items=${this.links} .route=${this.route}></ui-menu>
			${this._footer}
		`;
	}

	private async _showMenu(): Promise<void> {
		if(this._menu.shown){
			await this._hideMenu();
			return;
		}

		if(this._menuFade){
			return;
		}

		if(!this._content.classList.contains('hidden')){
			this._content.classList.add('hidden');
		}

		if(this._menu.shown === false){
			this._menu.shown = true;
		}

		const animation = fadeWith(300, true);
		this._menuFade = this._menu.animate(animation.effect, animation.options);
		await this._menuFade.finished;
		this._menuFade = null;
	}

	private get _footer(): TemplateResult {
		return html`
		<footer role="contentinfo">
			<div class="legal-info"></div>
            <div class="social-links"></div>
        </footer>
		`;
	}

	private async _hideMenu(): Promise<void> {
		if(this._menuFade){
			return;
		}

		const animation = fadeWith(300, false);
		this._menuFade = this._menu.animate(animation.effect, animation.options);

		await this._menuFade.finished;

		this._content.classList.remove('hidden');
		this._menu.shown = false;
		this._menuFade = null;
	}
}

customElements.define(ElaraApp.is, ElaraApp);
