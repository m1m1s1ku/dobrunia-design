import { html, css, CSSResult, property } from 'lit-element';

import Root from './core/strategies/Root';

import { navigate } from './core/routing/routing';

import './pages/index';
import './atoms/nav';
import './atoms/not-found';

import Elara from './core/elara';
import Constants from './constants';
import { Item } from './atoms/nav';

// Polyfills
import('./polyfill');

export class ElaraApp extends Root implements Elara.Root {
	public static readonly is: string = 'elara-app';

	public default = 'home';

	@property({type: Boolean, reflect: true, noAccessor: true})
	public waiting = false;

	public config: {
        name: string;
        revision: string;
	};
	@property({type: Boolean, reflect: true, noAccessor: true})
	public links: Item[] = [];

	public constructor(){
		super();
		
		this.bootstrap;
		this.hasElaraRouting = true;
	}

	public get bootstrap(){		
		return Promise.all([import('./polymer')]);
	}

	public async show(route: string): Promise<void> {
		navigate(route);
	}

	public async firstUpdated(){
		const hashEvent = new HashChangeEvent('hashchange', {
			newURL: location.origin + location.pathname + location.hash,
			oldURL: null
		});

		await this._onHashChange(hashEvent);
		const menuLinksR = await fetch(Constants.api+Constants.menu);
		const response = await menuLinksR.json();

		let idx = 0;
		for(const link of response){
			const isHome = link.url.replace('https://www.dobruniadesign.com', '') === '';
			const lastComponent = link.url.split(/[\\/]/).filter(Boolean).pop();

			let nextURL = link.type === 'taxonomy' ? 'category/'+lastComponent : lastComponent;
			if(link.type === 'custom' && !isHome){
				nextURL = link.url;
			}

			this.links = [
				...this.links,
				{
					route: isHome ? 'home' : nextURL,
					name: link.title,
					idx,
					hidden: false
				}
			];
			idx++;
		}

		await this.performUpdate();
	}

	public static get styles(): CSSResult[] {
		return [
		css`
		.content {
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
		}s

		footer {
			user-select: none;
			font-family: var(--elara-font-primary);
			font-size: 0.8em;
			background: var(--elara-background-color);
			color: var(--elara-font-color);
			display: flex;
			padding: 1em;
			flex-direction: row;
			justify-content: flex-end;
		}
		
		footer a {
			cursor: pointer;
			color: var(--elara-primary);
			text-decoration: none;
		}

		footer a:hover {
			color: var(--elara-font-hover);
		}

		.logotype::first-letter {
			font-size: 1.5em;
		}
		`];
	}
	
	public render() {
		return html`
			${this.waiting ? html`` : html``}
			<ui-nav .items=${this.links}></ui-nav>
			<main id="main" class="content"></main>
		`;
	}
}

customElements.define(ElaraApp.is, ElaraApp);
