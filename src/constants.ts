import Elara from './core/elara';
import { html } from 'lit-html';

/**
 * App constants
 */
const Constants = {
    api: 'https://api.dobruniadesign.com/api/',
    route: (path: string) => {
        return Constants.api+path;
    },
    modes: {
        default: 'day' as Elara.Modes
    },
    title: 'Dobrunia Design',
    logo: () => html`
        <iron-image style="width: 130px; height: 92px;" sizing="cover" preload src="assets/logo.png"></iron-image>
    `,
    defaults: {
        route: 'home'
    }
};

export default Constants;