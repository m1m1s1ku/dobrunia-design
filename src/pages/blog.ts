import { html, TemplateResult } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import { css, property } from 'lit-element';

import Page from '../core/strategies/Page';
import { navigate } from '../core/routing/routing';

import { pulseWith } from '../core/animations';
import { Utils, chunk, decodeHTML } from '../core/ui/ui';

import Constants from '../constants';
import { wrap } from '../core/errors/errors';
import { oc } from 'ts-optchain';

interface ArticleMinimal {
    id: string;
    title: string;
    slug: string;
    featuredImage: {
        sourceUrl: string;
    };
};

class Blog extends Page {
    public static readonly is: string = 'ui-blog';

    @property({type: Array, reflect: false})
    public articles: ReadonlyArray<ArticleMinimal> = [];
    @property({type: Array, reflect: false})
    private ghost: ReadonlyArray<ArticleMinimal> = [];

    private _ratio = .6;

    private _observer: IntersectionObserver = new IntersectionObserver((entries, observer) => {
        for(const entry of entries){
            if(entry.intersectionRatio > this._ratio){
                entry.target.classList.remove('reveal');
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        }
    }, {
        root: null,
        rootMargin: '0px',
        threshold: this._ratio
    });

    public static get styles(){
        return [
            ... super.styles,
            css`
            .blog {
                padding: 2em;
            }

            article {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                padding: 1em;
                cursor: pointer;
                margin: 1em;
                transition: all 0.3s cubic-bezier(.25,.8,.25,1);
                border-radius: 2px;
                background-color: rgba(255,255,255, .8);
            }

            article .item-link {
                flex: 1;
                display: block;
                text-align: right;
                text-decoration: none;
            }

            article.reveal {
                opacity: 0;
            }

            article.revealed {
                opacity: 1;
                transition: opacity .3s;
            }

            @media (prefers-reduced-motion: reduce){
                article.reveal {
                    opacity: 1;
                }
        
                article.revealed {
                    transition: 0s;
                }
            }

            svg {
                height: 30px;
                width: 30px;
            }

            article:hover {
                box-shadow: rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px;
            }

            iron-image {
                margin: .5em;
            }

            .title-search {
                display: flex;
                justify-content: space-between;
                flex-direction: row;
            }

            paper-input {
                --paper-input-container-focus-color: var(--elara-primary);
            }
            
            .article-thumb {
                margin: 0 .5em;
                width: 100px;
                height: 100px;
            }
            `
        ];
    }
    
    public async firstUpdated(){
        this._load();
        document.title = 'Blog' + ' | ' + Constants.title;
    }
    
    private async _load(){
        const articlesR = await fetch(Constants.graphql, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `{
                    posts(first: 100) {
                      edges {
                        node {
                          id
                          title
                          slug
                          featuredImage {
                            sourceUrl
                          }
                        }
                      }
                    }
                  }`
            })
        }).then(res => res.json()).then(res => res.data.posts.edges).catch(_ => this.dispatchEvent(wrap(_)));

        this.loaded = true;

        const parsed = [];

        for(const article of articlesR){
            parsed.push(
                {
                    ...article.node, 
                    featuredImage: {
                        sourceUrl: oc<ArticleMinimal>(article.node).featuredImage.sourceUrl('./assets/logo.png')
                    }
            });
        }

        const chunks = chunk(parsed, 1);

        let cancelAnimations = false;

        let initial = 100;
        for(const chunk of chunks){
            const append = async () => {
                this.articles = [...this.articles, ...chunk];
                await this.updateComplete;
            };

            let appendTime = 100;

            setTimeout(async () => {
                await append();

                const article = this.shadowRoot.querySelector('.blog article:last-child');
                if(cancelAnimations){
                    article.classList.add('reveal');
                    this._observer.observe(article);
                    return;
                }

                if(!Utils.isInViewport(article)){
                    appendTime = 0;
                    cancelAnimations = true;
                    article.classList.add('reveal');
                    this._observer.observe(article);
                    return;
                }

                if(Utils.animationsReduced()){
                    return;
                }

                const animationConfig = pulseWith(300);
                article.animate(animationConfig.effect, animationConfig.options);
            }, !cancelAnimations ? initial += appendTime : initial);
        }
        
        this.ghost = parsed;
    }

    public search(value: string){
        this.articles = this.ghost.filter(item => item.title.toLowerCase().indexOf(value.toLowerCase()) !== -1);
    }

    public render(): void | TemplateResult {
        return html`
        <div class="blog" role="main">
            <div class="title-search">
                <h1>Actualités</h1>
                <paper-input autofocus type="search" label="Recherche ..." @value-changed=${(event: CustomEvent) => {
                    this.search(event.detail.value);
                }}></paper-input>
            </div>
            ${!this.loaded ? html`<paper-spinner active></paper-spinner>` : html``}
            ${repeat(this.articles, article => html`
            <article @click=${() => navigate('post/'+article.slug)}>
                ${article.featuredImage ? html`
                <iron-image sizing="contain" class="article-thumb" src=${article.featuredImage.sourceUrl}></iron-image>
                ` : html``}
                <h3>${decodeHTML(article.title)}</h3>
                <a class="item-link">
                    <svg class="icon" height="512" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M873.215 196.204c-60.839-0.994-117.983 5.802-171.675 19.877-56.662 14.86-109.719 37.898-159.441 68.453v519.514c45.387-24.745 92.631-45.387 142.692-59.761 58.711-16.844 121.041-25.033 188.421-21.089v-47.701c21.958 0.823 44.161-1.887 64.003-9.526v92.155h-0.031c-0.004 1.241-0.074 2.494-0.225 3.754-2.071 17.534-17.966 30.070-35.498 28.004-72.204-8.633-137.914-1.678-199.178 15.904-61.37 17.623-118.663 45.983-173.765 80.115l-0.243 0.169-0.25 0.159-0.041 0.031-0.203 0.139-0.441 0.288-0.058 0.041-0.512 0.318-0.085 0.050-0.174 0.109-0.511 0.303-0.654 0.369-0.14 0.069-0.262 0.14-0.262 0.149h-0.015l-0.253 0.129-0.269 0.14-0.174 0.079-0.378 0.175-0.269 0.129-0.058 0.019-0.219 0.101-0.277 0.119-0.219 0.098-0.058 0.019-0.277 0.119-0.85 0.327-0.281 0.105-0.284 0.098-0.581 0.198-0.605 0.198-0.262 0.081-0.298 0.089-0.194 0.061-0.098 0.019-0.292 0.079-0.298 0.079-0.069 0.019-0.228 0.061-0.304 0.069-0.239 0.061-0.054 0.007-0.604 0.14-0.121 0.019-0.182 0.039-0.308 0.058-0.292 0.058h-0.007l-0.308 0.050-0.303 0.050-0.169 0.019-0.144 0.033-0.615 0.079-0.041 0.007-0.272 0.031-0.313 0.039-0.219 0.019-0.727 0.070h-0.085l-0.228 0.019-0.318 0.019-0.268 0.019h-0.050l-0.313 0.007-0.323 0.019h-0.318l-0.639 0.007-0.641-0.007h-0.323l-0.324-0.019-0.318-0.007h-0.050l-0.268-0.019-0.318-0.019-0.222-0.019h-0.090l-0.721-0.069-0.222-0.019-0.313-0.039-0.268-0.031-0.039-0.007-0.313-0.039-0.304-0.039-0.144-0.031-0.17-0.019-0.619-0.101-0.602-0.117-0.182-0.039-0.121-0.019-0.604-0.14-0.054-0.007-0.243-0.058-0.304-0.069-0.298-0.079-0.292-0.079-0.298-0.079-0.101-0.019-0.489-0.148-0.286-0.089-0.587-0.189-0.139-0.050-0.743-0.256-0.262-0.098-0.85-0.327-0.273-0.119-0.065-0.019-0.219-0.098-0.273-0.119-0.222-0.101-0.053-0.019-0.273-0.129-0.277-0.129-0.095-0.050-0.174-0.079-0.269-0.14-0.253-0.129h-0.007l-0.269-0.149-0.403-0.208-0.65-0.369-0.023-0.007-0.492-0.289-0.253-0.159-0.577-0.358-0.438-0.288-0.203-0.139-0.039-0.033-0.251-0.159-0.25-0.169c-55.098-34.133-112.389-62.494-173.761-80.115-61.266-17.584-126.977-24.532-199.178-15.904-17.532 2.067-33.431-10.468-35.501-28.002-0.149-1.262-0.219-2.513-0.222-3.754h-0.023v-87.715c20.445 5.394 42.612 6.318 63.999 4.102v48.684c67.376-3.945 129.71 4.244 188.421 21.089 50.067 14.374 97.305 35.018 142.692 59.761v-519.513c-49.723-30.555-102.78-53.593-159.441-68.453-53.692-14.076-110.831-20.873-171.675-19.877v180.238c-20.841-2.881-42.944-4.171-63.999-2.393v-208.59c0-17.674 14.33-32.006 32.001-32.006l0.407 0.007c140.995-7.759 273.908 21.994 394.707 95.861 120.784-73.867 253.721-103.619 394.697-95.861l0.416-0.007c17.674 0 32.003 14.334 32.003 32.006v210.218c-20.548-3.198-42.654-2.999-64.003-0.874v-178.597h-0.004zM823.671 425.396c-1.539 13.967-2.668 27.894-3.393 41.801l27.527 9.795-28.114 3.973c-0.496 14.911-0.535 29.781-0.159 44.622l22.526 9.079-22.116 3.090c0.65 15.745 1.778 31.459 3.348 47.146l19.523 4.317-18.706 3.546c1.227 11.264 2.701 22.521 4.375 33.745 15.497 4.401 79.222 19.929 113.762-10.917 39.516-35.276 59.27-107.234 38.102-167.92-17.802-51.040-123.536-30.198-156.677-22.279v0zM182.755 425.396c-33.139-7.918-138.87-28.758-156.677 22.279-21.164 60.687-1.415 132.645 38.097 167.92 34.545 30.844 98.269 15.318 113.762 10.917 1.677-11.226 3.15-22.479 4.385-33.745l-18.71-3.546 19.523-4.321c1.566-15.685 2.692-31.401 3.348-47.146l-22.116-3.090 22.521-9.079c0.382-14.842 0.345-29.713-0.154-44.622l-28.119-3.973 27.532-9.795c-0.726-13.906-1.853-27.835-3.393-41.801z"></path></svg>
                </a>
            </article>
            `)}
        </div>
        `;
    }
}
customElements.define(Blog.is, Blog);