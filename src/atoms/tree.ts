import { html, TemplateResult, property, css, CSSResult } from 'lit-element';

import PureElement from '../core/strategies/Element';

/**
 * @class Tree
 * @extends {PureElement}
 */
export class Tree extends PureElement {
    public static readonly is: string = 'ui-tree';

    @property({type: Number, reflect: true})
    public height = 300;
    @property({type: Number, reflect: true})
    public width = 300;

    public firstUpdated(): void {
        const ctx = this._canvas.getContext('2d');
        window.requestAnimationFrame(() => {
            this._tree(ctx, 600, 600, 80, - Math.PI / 2, 13, 13);
        });
    }

    public static get styles(): CSSResult {
        return css`
        #tree {
            position: fixed;
        }
        `;
    }
    
	public render(): void | TemplateResult {
		return html`<canvas id="tree" height="${this.height}" width="${this.width}"></canvas>`;
    }
    
    private _tree(ctx: CanvasRenderingContext2D, startX: number, startY: number, length: number, angle: number, depth: number, branchWidth: number ): void {
        const rand = Math.random;

        let newLength: number;
        let newAngle: number;

        const maxBranch = 3;
        const maxAngle = 2 * Math.PI / 4;
        
        ctx.beginPath();
        ctx.moveTo(startX,startY);

        const endX = startX + length * Math.cos(angle);
        const endY = startY + length * Math.sin(angle);
        
        ctx.lineCap = 'round';
        ctx.lineWidth = branchWidth;
        ctx.lineTo(endX,endY);
        
        if (depth <= 2) {
            ctx.strokeStyle = '#1b1b1b';
        } else {
            ctx.strokeStyle = '#333';
        }
        ctx.stroke();
        
        const newDepth = depth - 1;
        
        if (!newDepth) {
            return;
        }
        
        const subBranches = (rand() * (maxBranch - 1)) + 1;
        
        branchWidth *= 0.7;
        
        for ( let i = 0; i < subBranches; i++ ) {
            newAngle = angle + rand() * maxAngle - maxAngle * 0.5;
            newLength = length * (0.7 + rand() * 0.3);
            this._tree(ctx, endX, endY, newLength, newAngle, newDepth, branchWidth);
        }
    }

    private get _canvas(): HTMLCanvasElement {
        return this.shadowRoot.querySelector('#tree');
    }
}

customElements.define(Tree.is, Tree);