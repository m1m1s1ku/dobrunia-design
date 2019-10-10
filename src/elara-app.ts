import { html, css, CSSResult, property } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';

import Root from './core/strategies/Root';

import { navigate } from './core/routing/routing';

import './pages/index';
import './atoms/nav';
import './atoms/not-found';

import Elara from './core/elara';
import Constants from './constants';
import { Item } from './atoms/nav';

import terrazzo from './core/ui/terrazzo';

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
	@property({type: Array, reflect: true, noAccessor: true})
	public links: Item[] = [];
	@property({type: Array, reflect: true, noAccessor: true})
	public filters: Item[] = [];
	@property({type: Array, reflect: false, noAccessor: true})
	public socialThumbs: {
		src: string;
		shortcode: string;
	}[];

	public constructor(){
		super();
		
		this.bootstrap;
		this.hasElaraRouting = true;
	}

	async connectedCallback(): Promise<void> {
		super.connectedCallback();

		try {
			const instaThumbs = [];
			const instagramR = await fetch('https://www.instagram.com/dobruniadesign/?__a=1');
			const responseI = await instagramR.json();
			const userData = responseI.graphql.user;
			const timeline = userData.edge_owner_to_timeline_media.edges.slice(0, 3);
	
			for(const latestPost of timeline){
				const resources = latestPost.node.thumbnail_resources;
				const thumbnail = resources.find(resource => resource.config_height === 240);
				if(thumbnail){
					instaThumbs.push({
						shortcode: latestPost.node.shortcode,
						src: thumbnail.src
					});
				}
			}

			this.socialThumbs = instaThumbs;
		} catch (err) {
			console.error('Error while loading instagram feed', err);
		}

		const menuQuery = `{
			menus(where: {slug: "menu"}) {
			  edges {
				node {
				  id
				  name
				  menuItems {
					edges {
					  node {
						id
						url
						label
						connectedObject {
							... on Category {
							  id
							  name
							  taxonomy {
								name
							  }
							}
						  }
					  }
					}
				  }
				}
			  }
			}
		}`;

		const menuLinksR = await fetch(Constants.graphql, {
			method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: menuQuery
            })
		}).then(res => res.json()).then(res => res.data.menus.edges[0].node.menuItems.edges);

		const response = menuLinksR;
		let idx = 0;

		const links = [];
		const filters = [];
		for(const edge of response){
			const link = edge.node;
			const isHome = link.url.replace('https://www.dobruniadesign.com', '') === '';
			const lastComponent = link.url.split(/[\\/]/).filter(Boolean).pop();

			const isCategory = link.connectedObject && link.connectedObject.taxonomy && link.connectedObject.taxonomy.name === 'category';

			let nextURL = isCategory ? 'category/'+lastComponent : lastComponent;
			if(link.type === 'custom' && !isHome){
				nextURL = link.url;
			}

			const parsed = {
				route: isHome ? 'home' : nextURL,
				name: link.label,
				idx: idx++,
				filter: isCategory,
				hidden: false
			};

			if(isCategory){
				filters.push(parsed);
				continue;
			}

			links.push(parsed);
		}

		this.links = links;
		this.filters = filters;
		await this.performUpdate();
	}

	public get bootstrap(){		
		return Promise.all([import('./polymer')]);
	}

	public async show(route: string): Promise<void> {
		navigate(route);
	}

	public async firstUpdated(){
		terrazzo(this);

		if(location.pathname !== '/'){
			location.hash = '#!'+location.pathname.slice(1, location.pathname.length);
			location.pathname = '';
		}

		const hashEvent = new HashChangeEvent('hashchange', {
			newURL: location.origin + location.pathname + location.hash,
			oldURL: null
		});

		await this._onHashChange(hashEvent);
	}

	public static get styles(): CSSResult[] {
		return [
		css`
		.content {
			color: var(--elara-font-color);
			display: inline-block;

			font-family: var(--elara-font-primary);
			opacity: 1;
			margin: 0;
			width: 100%;
			margin-top: 1em;
			min-height: 75vh;
			background: linear-gradient( to bottom, rgba(255, 255, 255, 0), rgba(249, 249, 249, 0.6) );
		}

		.content.hidden {
			opacity: 0;
			z-index: 0;
			visibility: hidden;
		}

		footer {
			position: relative;
			user-select: none;
			font-family: var(--elara-font-primary);
			min-height: 130px;
			justify-content: space-between;
			background-color: #eecfcb;
			display: flex;
			flex-direction: row;
			color: #3c3c3b;
		}
		
		footer a {
			cursor: pointer;
			color: #3c3c3b;
			text-decoration: none;
		}

		footer a:hover {
			color: var(--elara-font-hover);
		}

		.logotype::first-letter {
			font-size: 1.5em;
		}


		footer .right {
			padding-left: 1em;
			padding-right: 1em;
		}

		footer .left {
			padding: 1em 1em;
			position: relative;
			display: flex;
			flex-direction: column;
		}

		.big-type, .middle-type {
			font-size: 16px;
			letter-spacing: 3px;
		}

		.middle-type {
			margin-top: .7em;
		}

		.low-type {
			position: absolute;
			bottom: 10px;
			letter-spacing: 2px;
			font-size: 13px;
		}
			
		footer svg {
			width: 30px;
			height: 30px;
			margin: 5px;
			cursor: pointer;
		}

		footer .icons {
			display: flex;
			flex-direction: row;
			justify-content: flex-end;
		}

		@media (max-width: 600px){
			footer {
				flex-direction: column;
			}

			.middle-type {
				margin-top: auto;
			}

			.low-type {
				position: initial;
			}
		}

		canvas {
			position: fixed;
			height: 100vh;
			width: 100vw;
			z-index: -1;
		}

		.instagram {
			margin: 1em;
			display: flex;
			flex-direction: column;
			align-items: flex-end;
		}

		.instalink {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		footer svg {
			transition: fill .3s;
		}

		footer a:hover svg {
			fill: var(--elara-font-hover);
		}

		footer a iron-image {
			transition: transform .3s;
		}

		footer a:hover iron-image {
			transform: scale(1.1);
		}
	`];
	}
	
	public render() {
		return html`
			${this.waiting ? html`` : html``}
			<ui-nav .items=${this.links} .filters=${this.filters} .route=${this.route}></ui-nav>
			<canvas></canvas>
			<main id="main" class="content"></main>
			<footer>
				<div class="left">
					<span class="big-type"><a target="_blank" href="https://www.google.fr/maps/dir//Dobrunia+design/data=!4m6!4m5!1m1!4e2!1m2!1m1!1s0x12cddbba95967955:0x9af320f68ee988ce?sa=X&ved=2ahUKEwjwwqmtov7dAhVFJBoKHcAJB60Q9RcwEnoECAcQEw">Concept store - 9 Rue Miron, 06000 Nice</a></span>
					<span class="middle-type"><a href="mailto:info@dobruniadesign.com">info@dobruniadesign.com</a></span>
					<span class="low-type">&copy; ${new Date().getFullYear()} Dobrunia Design. - Tous droits réservés.</span>
				</div>
				<div class="right">
					<h4>Nous suivre</h4>
					<div class="icons">
						<a title="Facebook" href="https://www.facebook.com/dobruniadesign/" target="_blank">
							<svg viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7C18.3 21.1 22 17 22 12c0-5.5-4.5-10-10-10z"/></g></svg>
						</a>
						<a title="Instagram" href="https://www.instagram.com/dobruniadesign/" target="_blank">
							${this.instagramLogo}
						</a>
						<a title="Etsy" href="https://www.etsy.com/fr/shop/DobruniaDesign" target="_blank">
							<svg viewBox="0 0 512 512"><defs id="defs12"/><g id="g6436"><rect height="512" id="rect2987" rx="64" ry="64" style="fill-opacity:1;fill-rule:nonzero;stroke:none" width="512" x="0" y="5.6843419e-014"/><path d="m 150.41383,431.55931 c 30.32414,-1.32 67.15631,0 103.06447,0 37.06417,0 75.01635,-2.46401 104.90449,0 12.07605,0.99601 23.1841,8.22404 33.13615,1.82401 7.68003,-9.89204 1.98401,-23.1681 3.68401,-36.47617 3.22402,-25.26411 26.52012,-55.55628 -7.37203,-62.0003 -14.43607,13.15606 -4.70403,25.64812 -12.87606,41.94421 -9.90004,19.73209 -45.36821,26.55612 -79.14036,29.17214 -28.98414,2.252 -79.78837,5.15602 -90.18842,-14.58408 -8.78004,-16.66007 -3.68801,-42.5002 -3.68801,-63.8243 0,-24.12012 -2.58801,-47.21222 3.68801,-65.65631 36.82018,2.69202 84.43639,-12.27206 110.42851,3.64402 17.38808,10.65605 7.50003,31.50814 27.60813,38.29618 13.84006,-3.71602 6.45202,-21.6041 5.51602,-38.29618 -0.592,-10.75605 -0.548,-25.87211 0,-38.29618 0.74401,-16.76807 7.21603,-36.21616 -11.04805,-36.47216 -14.34406,11.14805 -3.56002,29.72813 -18.40809,40.11619 -4.74402,3.32801 -15.04806,4.73202 -22.0721,5.48002 -27.58412,2.91201 -70.84832,0.536 -93.87642,-3.65202 -3.17202,-33.60815 -2.90002,-79.40836 0,-113.06452 12.50005,-12.41606 41.25218,-12.84806 60.74028,-12.77206 34.14015,0.136 87.38039,2.97602 97.54444,20.0641 5.53203,9.29604 1.148,28.75213 11.04805,31.00014 19.91609,4.54802 10.23605,-30.98815 11.04805,-47.41622 0.60001,-12.316058 6.04403,-20.248095 3.67202,-29.180131 -6.44403,-8.804046 -16.04807,-4.392028 -22.0801,-3.644024 -62.63228,7.744036 -157.75272,3.644024 -224.53702,3.644024 -7.97604,0 -21.90811,-3.97602 -27.60413,5.472019 -3.85202,21.064102 24.90411,12.356058 34.96415,23.708112 3.27202,3.69202 8.10804,20.00009 9.20405,31.00414 2.91201,29.22814 0,73.86835 0,116.71654 0,45.2762 3.43601,90.94842 0,118.54056 -1.2,9.63604 -7.01203,25.15612 -9.20405,27.35613 -12.54005,12.52805 -45.6882,-1.34802 -42.33618,25.53611 11.64804,7.83604 28.52012,2.50001 44.18019,1.81601 z" id="Etsy" style="fill:#ffffff;fill-opacity:1"/></g></svg>
						</a>
					</div>
				</div>
				<div class="instagram">
					${this.socialThumbs && this.socialThumbs.length > 0 ? html`
						<div class="pics">
							${repeat(this.socialThumbs, thumb => html`
							<a target="_blank" href="https://instagram.com/p/${thumb.shortcode}">
								<iron-image style="width: 90px; height: 90px;" sizing="contain" src="${thumb.src}"></iron-image>
							</a>	
							`)}
						</div>
						<a class="instalink" target="_blank" href="https://www.instagram.com/dobruniadesign/">
							Instagram ${this.instagramLogo}
						</a>
					` : html``}
				</div>
			</footer>
		`;
	}

	public get instagramLogo(){
		return html`
		<svg viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M12 4.622c2.403 0 2.688.01 3.637.052.877.04 1.354.187 1.67.31.42.163.72.358 1.036.673.315.315.51.615.673 1.035.123.317.27.794.31 1.67.043.95.052 1.235.052 3.638s-.01 2.688-.052 3.637c-.04.877-.187 1.354-.31 1.67-.163.42-.358.72-.673 1.036-.315.315-.615.51-1.035.673-.317.123-.794.27-1.67.31-.95.043-1.234.052-3.638.052s-2.688-.01-3.637-.052c-.877-.04-1.354-.187-1.67-.31-.42-.163-.72-.358-1.036-.673-.315-.315-.51-.615-.673-1.035-.123-.317-.27-.794-.31-1.67-.043-.95-.052-1.235-.052-3.638s.01-2.688.052-3.637c.04-.877.187-1.354.31-1.67.163-.42.358-.72.673-1.036.315-.315.615-.51 1.035-.673.317-.123.794-.27 1.67-.31.95-.043 1.235-.052 3.638-.052M12 3c-2.444 0-2.75.01-3.71.054s-1.613.196-2.185.418c-.592.23-1.094.538-1.594 1.04-.5.5-.807 1-1.037 1.593-.223.572-.375 1.226-.42 2.184C3.01 9.25 3 9.555 3 12s.01 2.75.054 3.71.196 1.613.418 2.186c.23.592.538 1.094 1.038 1.594s1.002.808 1.594 1.038c.572.222 1.227.375 2.185.418.96.044 1.266.054 3.71.054s2.75-.01 3.71-.054 1.613-.196 2.186-.418c.592-.23 1.094-.538 1.594-1.038s.808-1.002 1.038-1.594c.222-.572.375-1.227.418-2.185.044-.96.054-1.266.054-3.71s-.01-2.75-.054-3.71-.196-1.613-.418-2.186c-.23-.592-.538-1.094-1.038-1.594s-1.002-.808-1.594-1.038c-.572-.222-1.227-.375-2.185-.418C14.75 3.01 14.445 3 12 3zm0 4.378c-2.552 0-4.622 2.07-4.622 4.622s2.07 4.622 4.622 4.622 4.622-2.07 4.622-4.622S14.552 7.378 12 7.378zM12 15c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3zm4.804-8.884c-.596 0-1.08.484-1.08 1.08s.484 1.08 1.08 1.08c.596 0 1.08-.484 1.08-1.08s-.483-1.08-1.08-1.08z"/></g></svg>
		`;
	}
}

customElements.define(ElaraApp.is, ElaraApp);
