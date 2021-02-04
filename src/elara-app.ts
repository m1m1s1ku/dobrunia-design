import { html, property, SVGTemplateResult, TemplateResult } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';

import crayon from 'crayon';

import Root from './core/strategies/Root';

import './pages/index';
import './atoms/nav';
import './atoms/not-found';
import './atoms/image';
import './atoms/tree';
import './atoms/spinner';


import Constants from './constants';
import { Item } from './atoms/nav';

import terrazzo from './core/ui/terrazzo';
import { wrap } from './core/errors/errors';

import { fromEvent, scheduled, animationFrameScheduler, Subscription, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';

import IconsForProvider from './icons';

import BootstrapQuery from './queries/bootstrap.graphql';

interface WPLink {
	id: string; label: string; url: string;
	icon?: SVGTemplateResult;
}

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
	public socialThumbs: {
		src: string;
		shortcode: string;
	}[];
	@property({type: String, reflect: false, noAccessor: true})
	private _logo: string;

	private _terrazzoColors = ['#edcfd0', '#df899b', '#8e8685', '#a08583'];

	private _subscriptions: Subscription;
	private _resize$: Observable<Event>;

	public router: crayon.Router;

	public constructor(){
		super();
		this._subscriptions = new Subscription();

		this.router = crayon.create();
		this.router.path('/', () => {
			return this.load('home');
		});
		this.router.path('/home', () => {
			return this.load('home');
		});

		this.router.path('/revendeurs', () => {
			return this.load('revendeurs');
		});

		this.router.path('/page/:page', (req) => {
			return this.load('page/'+req.params.page);
		});

		this.router.path('/blog', () => {
			return this.load('blog');
		});

		this.router.path('/projet/:slug', req => {
			return this.load('projet/'+req.params.slug);
		});

		this.router.path('/post/:slug', (req) => {
			return this.load('post/'+req.params.slug);
		});

		this.router.path('/**', (req) => {
			return this.load(req.pathname.replace('/', ''));
		});

		this._subscriptions.add(this.router.events.subscribe(event => {
			if (event.type === crayon.RouterEventType.SameRouteAbort) {
				this.load(event.data.replace('/', ''));
			}
		 }));
		
		this._resize$ = scheduled(fromEvent(window, 'resize').pipe(
			distinctUntilChanged(),
			debounceTime(500),
			tap(() => {
				terrazzo(this, this._terrazzoColors, true);
			})
		), animationFrameScheduler);
	}

	/**
	 * Load instagram feed using partially public api
	 *
	 * @private
	 * @memberof ElaraApp
	 */
	private async _loadInstagram(){
		try {
			const instaThumbs = [];
			// NOTE : HACK ahead. Using a now "private" API
			const instagramR = await fetch('https://www.instagram.com/graphql/query/?query_id=17888483320059182&query_hash=472f257a40c653c64c666ce877d59d2b&variables=%7B%22id%22:%228130742951%22,%22first%22:%2212%22%7D', {
				headers: {
					'User-Agent'       : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
					'referer'          : 'https://www.instagram.com/dobruniadesignatelier/',
				}
			});

			const responseI = await instagramR.json();
			const userData = responseI.data.user;
			const timeline = userData.edge_owner_to_timeline_media.edges.slice(0, 4);
	
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
			// console.error('Error while loading instagram feed', err);
		}
	}

	/**
	 * Setup bootstrap for website
	 *
	 * @private
	 * @memberof ElaraApp
	 */
	private async _setup(){
		const requestR = await fetch(Constants.graphql, {
			method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: BootstrapQuery
            })
		}).then(res => res.json()).catch(_ => this.dispatchEvent(wrap(_)));

		const colors = requestR.data.terrazzo;
		this._terrazzoColors = [];
		for(const key of Object.keys(colors)){
			if(key === 'logo') continue;
			this._terrazzoColors.push(colors[key]);
		}
		this._logo = colors.logo;

		terrazzo(this, this._terrazzoColors, false);

		let menuLinks = requestR.data.menus.nodes.find(node => node.slug === 'menu');
		menuLinks = menuLinks.menuItems.nodes;

		const siteURL = 'https://dobruniadesign.com';

		const legalLinks = requestR.data.menus.nodes.find(node => node.slug === 'legal-links');
		this.legalLinks = legalLinks.menuItems.nodes.map(node => {
			node.url = node.url.replace(siteURL, '');
			return node;
		});

		const socialLinks = requestR.data.menus.nodes.find(node => node.slug === 'social-links');
		this.socialLinks = socialLinks.menuItems.nodes.map(node => {
			node.url = node.url.replace(siteURL, '');
			node.icon = IconsForProvider[node.label.toLowerCase()];

			return node;
		});

		let idx = 0;
		const links = [];
		const filters = [];

		const menuLinksURL = 'https://www.dobruniadesign.com';
		
		for(const link of menuLinks){
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

		await this.requestUpdate();

		return this.updateComplete;
	}

	public async connectedCallback(): Promise<void> {
		super.connectedCallback();
		this._subscriptions.add(this._resize$.subscribe());
		await this._loadInstagram();
		this.router.load();
	}

	public async disconnectedCallback(): Promise<void> {
		super.disconnectedCallback();
		this._subscriptions.unsubscribe();
	}

	public terrazzo(idx: number, color: string): void {
		this._terrazzoColors[idx] = color;
		terrazzo(this, this._terrazzoColors, false);
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
			import('./material'),
			this._setup(),
		]);
	}

	public render(): TemplateResult {
		return html`
			<ui-nav .logo=${this._logo} .items=${this.links} .filters=${this.filters} .route=${this.route}></ui-nav>
			<canvas></canvas>
			<main id="main" class="content"></main>
			${this._footer}
		`;
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
					<a class="instalink" target="_blank" href="https://www.instagram.com/dobruniadesignatelier/" rel="noopener">
						Instagram ${IconsForProvider['instagram']}
					</a>
				` : html``}
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