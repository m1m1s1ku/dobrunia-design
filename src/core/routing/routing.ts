import { ElaraApp } from '../../elara-app';

/**
 * Navigate to an app route
 * 
 * FIXME: Handle deep urls (sub-nav capabilities)
 * @export
 * @param {string} route route without base prefix
 */
export function navigate(route: string) {
    if(route.indexOf('http') !== -1){
        window.open(route, '_blank');
        return true;
    }

    const app = document.body.querySelector<ElaraApp>('elara-app');
    return app.router.navigate(route);
}