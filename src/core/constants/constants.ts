import Elara from '../elara';
import { html } from 'lit-html';

/**
 * App constants
 */
const Constants = {
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