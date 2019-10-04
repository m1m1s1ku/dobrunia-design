import Elara from './core/elara';
import { html } from 'lit-html';
import { navigate } from './core/routing/routing';

/**
 * App constants
 */
const Constants = {
    domain: 'dobruniadesign.com',
    api: 'https://base.dobruniadesign.com/wp-json/',
    proxy: location.host === 'localhost:3000' ? '' : '',
    menu: 'dobrunia/menu',
    login: 'jwt-auth/v1/token',
    media: 'wp/v2/media',
    posts: 'wp/v2/posts',
    projects: 'wp/v2/projects',
    tags: 'wp/v2/tags',
    validate: 'jwt-auth/v1/token/validate',
    categories: 'wp/v2/categories',
    title: 'Dobrunia Design',
    logo: () => html`
        <iron-image @click=${() => navigate('home')} style="cursor: pointer; width: 130px; height: 92px;" sizing="cover" preload src="assets/logo.png"></iron-image>
    `,
    modes: {
        default: 'day' as Elara.Modes
    },
    defaults: {
        route: 'home'
    }
};

export default Constants;