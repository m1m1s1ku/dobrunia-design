import { html, TemplateResult } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import Page from '../core/strategies/Page';
import Constants from '../constants';

import { Utils, decodeHTML, onImageContainerClicked } from '../core/ui/ui';
import { fadeWith } from '../core/animations';
import { ProjectMinimal } from './project';
import { wrap } from '../core/errors/errors';
import { navigate } from '../core/routing/routing';

@customElement('ui-post')
export class Single extends Page {
  public static readonly is: string = 'ui-post';

  public static readonly hasRouting: boolean = true;

  @property({ type: Object, reflect: false })
  public article: ProjectMinimal;
  @property({ type: String, reflect: false })
  public featured: string;
  private _toLoad: string;

  public constructor(toLoad: string) {
    super();

    this._toLoad = toLoad;
  }

  public firstUpdated(): Promise<void> {
    return this._load();
  }

  private async _load() {
    const projectQuery = `
        {
            post(id: "${this._toLoad}", idType: SLUG) {
                title
                content
                excerpt
                featuredImage {
                    node {
                        sourceUrl(size: MEDIUM_LARGE)
                    }
                }
            }
        }              
        `;

    const first = (await fetch(Constants.graphql, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: projectQuery,
      }),
    })
      .then((res) => res.json())
      .then((res) => res.data.post)
      .catch((_) => this.dispatchEvent(wrap(_)))) as ProjectMinimal;
    this.loaded = true;

    if (!first) {
      return;
    }

    const post = first;
    document.title = post.title + ' | ' + Constants.title;
    this.article = post;
    this.featured = post?.featuredImage?.node?.sourceUrl
      ? post.featuredImage.node.sourceUrl
      : '/assets/logo.png';

    if (Utils.animationsReduced()) {
      return;
    }
    const fade = fadeWith(300, true);
    this.page.animate(fade.effect, fade.options);
  }

  public render(): void | TemplateResult {
    return html`
      <div id="blog" class="blog single" role="main">
        ${!this.loaded
          ? html` <div class="loading">
              <mwc-circular-progress indeterminate></mwc-circular-progress>
            </div>`
          : html``}
        ${this.article
          ? html`
              <h1>${decodeHTML(this.article.title)}</h1>
              ${this.featured
                ? html`
                    <div
                      class="image-container"
                      @click=${onImageContainerClicked}
                    >
                      <elara-image
                        .catch=${true}
                        src="${this.featured}"
                      ></elara-image>
                    </div>
                  `
                : html``}
              <div class="content">${unsafeHTML(this.article.content)}</div>
            `
          : html``}
        ${this.loaded && !this.article
          ? html`
              <div class="cols">
                <div class="content page-not-found">
                  <h2>Article non trouvé</h2>
                  <p>
                    Nous n'avons trouvé aucun article nommée ainsi, elle a
                    peut-être été déplacée.
                  </p>
                  <a @click=${() => navigate(Constants.defaults.route)}
                    ><mwc-icon-button icon="home"></mwc-icon-button> Retourner à
                    l'accueil</a
                  >
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }

  private get page() {
    return this.querySelector('#blog');
  }
}
