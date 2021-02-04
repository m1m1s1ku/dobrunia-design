import { html, property, TemplateResult } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';

import { fromEvent, scheduled, animationFrameScheduler, Subscription, Observable, EMPTY } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { fromFetch } from 'rxjs/fetch';

import Root from './core/strategies/Root';
import { wrap } from './core/errors/errors';
import terrazzo from './core/ui/terrazzo';

import Constants from './constants';

import crayon from 'crayon';
import { bindCrayon } from './router';

import IconsForProvider from './icons';
import { InstagramThumbs, instaLoad$ } from './instagram';
import { WPBootstrap, WPLink, WPMenus, WPTerrazzo } from './wordpress';

import { Item } from './atoms/nav';

import BootstrapQuery from './queries/bootstrap.graphql';

import './pages/index';
import './atoms/not-found';
import './atoms/nav';
import './atoms/image';
import './atoms/spinner';

export class ElaraApp extends Root {
	public static readonly is: string = 'elara-app';

	public default = 'home';

	@property({type: Array, reflect: false, noAccessor: true})
	public links: Item[] = [];
	@property({type: Array, reflect: false, noAccessor: true})
	public legalLinks: WPLink[] = [];
	@property({type: Array, reflect: false, noAccessor: true})
	public socialLinks: WPLink[] = [];

	@property({type: Array, reflect: false, noAccessor: true})
	public filters: Item[] = [];
	@property({type: Array, reflect: false, noAccessor: true})
	public socialThumbs: ReadonlyArray<InstagramThumbs>;
	@property({type: String, reflect: false, noAccessor: true})
	private _logo: string;

	private _terrazzoColors = ['#edcfd0', '#df899b', '#8e8685', '#a08583'];

	private _subscriptions: Subscription;
	private _resize$: Observable<Event>;

	public router: crayon.Router;

	public constructor(){
		super();
		this._subscriptions = new Subscription();
		
		this._resize$ = scheduled(fromEvent(window, 'resize').pipe(
			distinctUntilChanged(),
			debounceTime(500),
			tap(() => {
				terrazzo(this, this._terrazzoColors, true);
			})
		), animationFrameScheduler);
	}

	/**
	 * Bootstrap is launched by boot.js
	 * Could contains any kind of promise who will be handled by global promise loader
	 *
	 * @readonly
	 * @memberof ElaraApp
	 */
	public get bootstrap(): Promise<unknown> {		
		return Promise.all([
			this._setup(),
			import('./material'),
		]);
	}

	public connectedCallback(): void {
		super.connectedCallback();

		this._subscriptions.add(instaLoad$().pipe(
			tap((instaThumbs) => {
				this.socialThumbs = instaThumbs;
			}),
			switchMap(() => {
				return this.requestUpdate();
			})
		).subscribe());
		this._subscriptions.add(this._resize$.subscribe());
	}

	public disconnectedCallback(): void {
		super.disconnectedCallback();
		this._subscriptions.unsubscribe();
	}

	public firstUpdated(_changedProperties:  Map<string | number | symbol, unknown>): void {
		super.firstUpdated(_changedProperties);

		this.router = bindCrayon(this);
		this._subscriptions.add(this.router.events.subscribe(event => {
			if (event.type === crayon.RouterEventType.SameRouteAbort) {
				this.load(event.data.replace('/', ''));
			}
		 }));

		this.router.load();
	}

	public render(): TemplateResult {
		return html`
			<ui-nav .logo=${this._logo} .items=${this.links} .filters=${this.filters} .route=${this.route}></ui-nav>
			<canvas></canvas>
			<main id="main" class="content"></main>
			${this._footer}
		`;
	}

	/**
	 * Setup bootstrap for website
	 *
	 * @private
	 * @memberof ElaraApp
	 */
	private async _setup(){
		return fromFetch(Constants.graphql, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({query: BootstrapQuery})
		}).pipe(
			switchMap((response) => response.json()),
			tap(response => {
				const data = response.data as WPBootstrap;
				const colors = data.terrazzo;

				this._logo = colors.logo;

				this._buildTerrazzo(colors);
				this._buildMenu(data.menus);
			}),
			switchMap(() => {
				return this.requestUpdate();
			}),
			switchMap(() => {
				return this.updateComplete;
			}),
			catchError((err) => {
				this.dispatchEvent(wrap(err));
				return EMPTY;
			}),
		).toPromise();
	}

	private _buildTerrazzo(colors: WPTerrazzo){
		this._terrazzoColors = [];
		for(const key of Object.keys(colors)){
			if(key === 'logo') continue;
			this._terrazzoColors.push(colors[key]);
		}

		terrazzo(this, this._terrazzoColors, false);
	}

	private _buildMenu(data: WPMenus){
		const menuLinks = data.nodes.find(node => node.slug === 'menu');
		const mainMenuLinks = menuLinks.menuItems.nodes;

		const siteURL = 'https://dobruniadesign.com';

		const legalLinks = data.nodes.find(node => node.slug === 'legal-links');
		this.legalLinks = legalLinks.menuItems.nodes.map(node => {
			node.url = node.url.replace(siteURL, '');
			return node;
		});

		const socialLinks = data.nodes.find(node => node.slug === 'social-links');
		this.socialLinks = socialLinks.menuItems.nodes.map(node => {
			node.url = node.url.replace(siteURL, '');
			node.icon = IconsForProvider[node.label.toLowerCase()];

			return node;
		});

		let idx = 0;
		const links = [];
		const filters = [];

		const menuLinksURL = 'https://www.dobruniadesign.com';
		
		for(const link of mainMenuLinks){
			const isHome = link.url.replace(menuLinksURL, '') === '';
			const lastComponent = link.url.split(/[\\/]/).filter(Boolean).pop();

			let isCategory = false;
			if(link?.connectedObject?.taxonomy?.node?.name){
				isCategory = true;
			}
			
			let nextURL = isCategory ? 'category/'+lastComponent : lastComponent;
			// Does redirect to another endpoint, just throw it back like it is
			if(link.url.indexOf(Constants.domain) === -1){
				nextURL = link.url;
			}

			if(link.url.indexOf('page') !== -1){
				nextURL = link.url.replace('https://', '').replace('dobruniadesign.com', '').split('/').filter(Boolean).join('/');
			}

			if(link.url.indexOf('#') !== -1){
				nextURL = link.url.replace('#', '');
			}

			const parsed = {
				route: isHome ? 'home' : nextURL,
				name: link.label,
				idx: idx++,
				filter: !!isCategory,
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
	}

	private get _footer(): TemplateResult {
		return html`
		<footer>
			<div class="left">
				<span class="big-type"><a rel="noopener" target="_blank" href="https://www.google.fr/maps/dir//Dobrunia+design/data=!4m6!4m5!1m1!4e2!1m2!1m1!1s0x12cddbba95967955:0x9af320f68ee988ce?sa=X&ved=2ahUKEwjwwqmtov7dAhVFJBoKHcAJB60Q9RcwEnoECAcQEw">Concept store - 9 Rue Miron, 06000 Nice</a></span>
				<span class="middle-type"><a href="mailto:info@dobruniadesign.com">info@dobruniadesign.com</a></span>
				<span class="low-type">&copy; ${new Date().getFullYear()} Dobrunia Design. - Tous droits réservés.
				${repeat(this.legalLinks, link => {
					return html`<a href="${link.url}">${link.label}</a>`;
				})}
				</span>
			</div>
			<div class="right">
				<h4>Nous suivre</h4>
				<div class="icons">
					${repeat(this.socialLinks, social => {
						return html`<a aria-label="${social.label}" title="${social.label}" href="${social.url}" target="_blank" rel="noopener">
						${social.icon ? social.icon : social.label}
					</a>`;
					})}
				</div>
			</div>
			<div class="instagram">
				${this.socialThumbs && this.socialThumbs.length > 0 ? html`
					<div class="pics">
						${repeat(this.socialThumbs, thumb => html`
						<a target="_blank" href="https://instagram.com/p/${thumb.shortcode}" rel="noopener">
							<elara-image src="${thumb.src}"></elara-image>
						</a>	
						`)}
					</div>
				` : html``}
				<a class="instalink" target="_blank" href="https://www.instagram.com/dobruniadesignatelier/" rel="noopener">
					Instagram ${IconsForProvider['instagram']}
				</a>
			</div>
		</footer>
		`;
	}
}

customElements.define(ElaraApp.is, ElaraApp);

declare global {
	interface HTMLElementTagNameMap {
		'elara-app': ElaraApp;
	}
}