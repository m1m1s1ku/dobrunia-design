import { property } from 'lit/decorators.js';

import Page from './Page';

import { load } from '../bootstrap/bootstrap';
/**
 * Root strategy
 *
 * Should be used by the main-component of an app
 *
 * ```html
 * 	<elara-app></elara-app>
 * ```
 * @export
 * @class Root
 * @extends {Page}
 */
export default class Root extends Page {
  @property({ reflect: true, type: String })
  public route: string;

  public async load(route: string): Promise<void> {
    this.route = route;
    await load(route, this._content);
    return;
  }

  protected get _content(): HTMLElement {
    return this.querySelector('main');
  }
}
