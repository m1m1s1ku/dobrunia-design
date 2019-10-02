import { html, css, CSSResult, property } from 'lit-element';

import Root from './core/strategies/Root';

import { navigate } from './core/routing/routing';

import './pages/index';
import './atoms/not-found';

import Elara from './core/elara';

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

	public constructor(){
		super();
		
		this.bootstrap;
		this.hasElaraRouting = false;
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
		// await this._remoteBG();
		await this.performUpdate();
	}

	/* 
	private async _remoteBG(){
		let backgroundURL = null;
		try {
			backgroundURL = await Processing.toDataURL('https://source.unsplash.com/collection/162213/1366x768', 1);
		} catch (err){
			const fallback = await import('./assets/assets/default.jpeg');
			backgroundURL = await Processing.toDataURL(fallback.default);
		}
		document.documentElement.style.setProperty('--unsplash-bg', `url('${backgroundURL}')`);
	}
	*/

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
			${this.waiting ? html`
			` : html``}
			<main id="main" class="content"></main>
		`;
	}
}

customElements.define(ElaraApp.is, ElaraApp);
