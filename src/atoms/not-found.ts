import { html, TemplateResult, css, CSSResult, LitElement } from "lit";
import { property, customElement } from "lit/decorators.js";

import Constants from "../constants";
import { navigate } from "../core/routing/routing";

@customElement("ui-not-found")
export class NotFound extends LitElement {
  @property({ type: String, reflect: true })
  public asked: string;

  public constructor(asked: string) {
    super();
    this.asked = asked;
  }

  public static get styles(): CSSResult {
    return css`
      h1,
      p {
        user-select: none;
        z-index: 1;
      }

      a {
        color: var(--elara-primary);
        text-decoration: none;
        cursor: pointer;
        display: flex;
        align-items: center;
      }
      .text {
        padding: 2em;
      }
    `;
  }

  public render(): void | TemplateResult {
    return html`
      <div class="text">
        <h1>You are lost !</h1>
        <p>You asked for : ${this.asked}.</p>
        <a @click=${() => navigate(Constants.defaults.route)}
          ><mdui-button-icon icon="home"></mdui-button-icon> Homepage</a
        >
      </div>
    `;
  }
}
