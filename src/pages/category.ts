import { html, TemplateResult } from "lit";
import { property, customElement } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";

import Page from "../core/strategies/Page";
import {
  projectCard,
  projectLoad,
  ElementWithProjects,
  iObserverForCard,
  ProjectMinimal,
} from "./home";
import Constants from "../constants";
import { wrap } from "../core/errors/errors";

@customElement("ui-category")
export class Category extends Page implements ElementWithProjects {
  public static readonly hasRouting: boolean = true;

  @property({ type: Object, reflect: false })
  public projects: ReadonlyArray<ProjectMinimal> = [];

  @property({ type: Boolean, reflect: false })
  public empty = false;

  private _observer = iObserverForCard(0.2);
  private _toLoad: string;

  public constructor(slug: string) {
    super();
    this._toLoad = slug;
  }

  public async firstUpdated(): Promise<void> {
    if (this._toLoad) {
      await this._loadRequested();
    } else {
      this.empty = true;
      this.loaded = true;
    }
  }

  private async _loadRequested() {
    const query = `{
            categories(where: {slug:"${this._toLoad}"}) {
              edges {
                node {
                  id,
                  name,
                  slug
                }
              }
            }
          }
        `;

    const projR = await fetch(Constants.graphql, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
      }),
    })
      .then((res) => res.json())
      .then((res) => res.data)
      .catch((_) => this.dispatchEvent(wrap(_)));

    const category = projR.categories.edges;
    let cat = null;
    if (category && category.length > 0) {
      cat = category[0].node;
    }

    if (!category || (category && category.length === 0) || !cat) {
      document.title = "Non trouvé" + " | " + Constants.title;
      this.empty = true;
      this.projects = [];
      this.loaded = true;
      return;
    }

    document.title = cat.name + " | " + Constants.title;

    this.projects = [];
    await projectLoad(
      this,
      "#cards .card:last-child",
      cat.slug,
      this._observer,
    );
    this._toLoad = null;
  }

  public render(): void | TemplateResult {
    return html`
      ${!this.loaded
        ? html`
            <div class="loading">
              <mdui-circular-progress></mdui-circular-progress>
            </div>
          `
        : html``}
      ${this.loaded && this.empty
        ? html` <p class="not-found">Catégorie non trouvée</p> `
        : html``}

      <div id="cards" class="category cards" role="main">
        ${repeat(this.projects, (project) => projectCard(project))}
      </div>
    `;
  }
}
