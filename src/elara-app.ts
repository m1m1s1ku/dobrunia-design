import { html, css, CSSResult, TemplateResult, property } from 'lit-element';

import Root from './core/strategies/Root';

import { promise } from './core/bootstrap/bootstrap';
import { navigate } from './core/routing/routing';
import { fadeWith } from './core/animations';

import './pages/index';
import './atoms/not-found';
import './atoms/menu';
import './atoms/nav';
import { repeat } from 'lit-html/directives/repeat';
import Constants from './constants';
import Elara from './core/elara';

import { Link, SocialLink, APICategories } from './bridge';

// Polyfills
import('./polyfill');
// lazy import for polymer components
import('./polymer');

export class ElaraApp extends Root implements Elara.Root {
	public static readonly is: string = 'elara-app';

	@property({type: Array, reflect: false})
	private categories: ReadonlyArray<Link> = [];

	@property({type: Array, reflect: false})
	private links: ReadonlyArray<SocialLink> = [];

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

	public async firstUpdated(){		
		const hashEvent = new HashChangeEvent('hashchange', {
			newURL: location.origin + location.pathname + location.hash,
			oldURL: null
		});

		this._onHashChange(hashEvent);

		const linksR = await fetch(Constants.route('links'));
		const linksResponse = await linksR.json();
		this.links = linksResponse.data;
		
		const categoriesR = await fetch(Constants.route('projects/categories'));
		const response = await categoriesR.json();
		const remoteLinks: APICategories[] = response.data;
		const adapted = remoteLinks.map((cat: APICategories) => {
			return {
				idx: parseInt(cat.id, 10),
				name: cat.name,
				route: 'category/' + cat.slug
			};
		});

		const staticLinks = [
			{idx: 0, route: 'about', name: 'à propos'},
			{idx: 1, route: 'home', name: 'projets'},
			{idx: 2, route: 'blog', name: 'blog'},
			{idx: 3, route: 'contact', name: 'contact'}
		];
		
		for(const link of adapted){
			staticLinks.splice(2, 0, link);
		}
		
		this.categories = staticLinks;
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
			user-select: none;
			font-family: var(--elara-font-primary);
			font-size: 0.8em;
			background: var(--elara-background-color);
			color: var(--elara-font-color);
			display: flex;
			padding: 1em;
			flex-direction: row;
			justify-content: space-between;
		}
		
		footer a {
			cursor: pointer;
			color: var(--elara-primary);
			text-decoration: none;
		}

		footer a.social-link {
			margin: 0 .2em;
		}

		footer a:hover {
			color: var(--elara-font-hover);
		}
		`];
	}
	
	public render() {
		return html`
			<ui-nav .items=${this.categories} .route=${this.route}></ui-nav>

			<main id="main" class="content"></main>

			<ui-menu id="menu" .items=${this.categories} .route=${this.route}></ui-menu>
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
			<div class="legal-info">
			&copy; Dobrunia Design - ${new Date().getFullYear()}
			</div>
			<div class="social-links">
			${repeat(this.links, link => html`<a class="social-link" href="${link.url}" rel="noopener" target="_blank">${link.name}</a>`)}
			</div>
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
