import { html, TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";

import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { property, customElement } from "lit/decorators.js";

import Page from "../core/strategies/Page";
import Constants from "../constants";

import { Utils, onImageContainerClicked, decodeHTML } from "../core/ui/ui";
import { fadeWith } from "../core/animations";
import { wrap } from "../core/errors/errors";

export interface ProjectMinimal {
  title: string;
  content: string;
  excerpt: string;
  featuredImage: {
    node: {
      sourceUrl: string;
    };
  };
  gallery: {
    sourceUrl: string;
  }[];
}

@customElement("ui-projet")
export class Project extends Page {
  public static readonly is: string = "ui-projet";

  public static readonly hasRouting = true;

  @property({ type: Object, reflect: false, noAccessor: true })
  public project: ProjectMinimal;
  @property({ type: String, reflect: false, noAccessor: true })
  public featured: string;
  @property({ type: Array, reflect: false })
  public gallery: string[];

  private _toLoad: string;

  public constructor(slug: string) {
    super();
    this._toLoad = slug;
  }

  public async firstUpdated(): Promise<void> {
    const projectQuery = `
        {
            projet(id: "${this._toLoad}", idType: SLUG) {
                title
                content
                featuredImage {
                    node {
                        sourceUrl(size: LARGE)
                    }
                }
                gallery {
                    sourceUrl
                }
            }
        }              
        `;

    const first = (await fetch(Constants.graphql, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: projectQuery,
      }),
    })
      .then((res) => res.json())
      .then((res) => res.data.projet)
      .catch((_) => this.dispatchEvent(wrap(_)))) as ProjectMinimal;

    if (
      first &&
      first.featuredImage &&
      first.featuredImage.node &&
      first.featuredImage.node.sourceUrl
    ) {
      this.featured = first.featuredImage.node.sourceUrl;
    } else {
      this.featured = "/assets/logo.png";
    }

    const testing = document.createElement("div");
    testing.innerHTML = first.content;

    if (first.gallery && first.gallery.length > 0) {
      this.gallery = first.gallery.map((item) => item.sourceUrl);
    } else {
      const postImages = testing.querySelectorAll("img");
      const links = [];

      for (const image of Array.from(postImages)) {
        links.push(image.src);
        image.parentElement.removeChild(image);
      }

      this.gallery = links;
    }

    first.content = testing.innerText;

    first.title = decodeHTML(first.title);

    this.project = first;
    this.loaded = true;
    document.title = this.project.title + " | " + Constants.title;
    if (Utils.animationsReduced()) {
      return;
    }
    const fade = fadeWith(300, true);
    this.page.animate(fade.effect, fade.options);
  }

  public render(): void | TemplateResult {
    return html`
      <div id="project" class="project" role="main">
        ${!this.loaded
          ? html`<mdui-circular-progress></mdui-circular-progress>`
          : html``}
        ${this.project
          ? html`
              <h1 class="title">${this.project.title}</h1>
              ${this.featured
                ? html`
                    <div
                      class="image-container"
                      @click=${onImageContainerClicked}
                    >
                      <elara-image
                        .catch=${true}
                        src=${this.featured}
                      ></elara-image>
                    </div>
                  `
                : html``}
              <main class="post-content">
                ${unsafeHTML(this.project.content)}
              </main>
              ${this.gallery && this.gallery.length > 0
                ? html`
                    <masonry-layout
                      gap="20"
                      maxcolwidth="300"
                      cols="${this.gallery.length <= 2 ? "2" : "auto"}"
                    >
                      ${repeat(
                        this.gallery,
                        (link) => html`
                            <img alt="${link}" src=${link}></img>
                        `,
                      )}
                    </masonry-layout>
                  `
                : html``}
            `
          : html``}
      </div>
    `;
  }

  private get page() {
    return this.querySelector("#project");
  }
}
