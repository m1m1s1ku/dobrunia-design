import Elara from './core/elara';
import { html } from 'lit-html';

/**
 * App constants
 */
const Constants = {
    domain: 'dobruniadesign.com',
    api: 'https://api.dobruniadesign.com/api/',
    proxy: location.host === 'localhost:3000' ? 'https://corsunblock.herokuapp.com/' : '',
    login: 'jwt-auth/v1/token',
    media: 'wp/v2/media',
    posts: 'wp/v2/posts',
    tags: 'wp/v2/tags',
    validate: 'jwt-auth/v1/token/validate',
    categories: 'wp/v2/categories',
    title: 'Dobrunia Design',
    logo: () => html`
        <iron-image style="width: 130px; height: 92px;" sizing="cover" preload src="assets/logo.png"></iron-image>
    `,
    route: (path: string) => {
        return Constants.api+path;
    },
    modes: {
        default: 'day' as Elara.Modes
    },
    defaults: {
        route: 'home'
    }
};

export default Constants;