import {
    html, customElement, css, property, LitElement
} from 'lit-element';

@customElement('elara-spinner')
export class ElaraSpinner extends LitElement {
    @property({type: Boolean, reflect: false})
    public active = true;

    @property({type: String, reflect: false})
    public text = 'Loading';

    public static get styles(){
        return css`
        :host {
          height: auto;
          width: auto;
        }

        .container {
          padding-left: 4em;
          display: grid;
          align-items: center;
          text-align: center;
          grid-template-columns: repeat(2, 1fr);
          width: 100%;
          position: relative;
        }

        .dots {
          align-self: flex-end;
          width: 6px;
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: max-content;
          grid-column-gap: 5px;
          margin: 10px;
          margin-top: -5px;
          animation: ellipsis steps(3, end) 1.8s infinite;
          overflow: hidden;
        }

        .text {
          justify-self: flex-end;
          font-size: 1.5em;
        }

        .dot {
          background: var(--elara-font-color);
          display: block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        @keyframes ellipsis {
          to {
            width: 40px;
          }
        }        
        `;
    }

    public render() {
        return this.active ? html`
        <div class="container">
          <span class="text">${this.text}</span>
          <span class="dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </span>
        </div>` : html``;
    }
}


declare global {
	interface HTMLElementTagNameMap {
		'elara-spinner': ElaraSpinner;
	}
}