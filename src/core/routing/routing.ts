/**
 * Redirect to another website
 *
 * @export
 * @param {string} url
 * @param {string} [target='_blank']
 * @returns {boolean}
 */
export function redirect(url: string, target = '_blank'): boolean {
    return !!window.open(url, target);
}

/**
 * Navigate to an app route
 * 
 * FIXME: Handle deep urls (sub-nav capabilities)
 * @export
 * @param {string} route route without base prefix
 */
export function navigate(route: string): boolean {
    if(route.indexOf('http') !== -1){
        window.open(route, '_blank');
        return true;
    }

     location.hash = `#!${route.replace('#', '')}`;
     return true;
}

/**
 * HashChange root logic
 * 
 * @export
 * @param {HashChangeEvent} event newURL|oldURL event
 */
export function hashChange(event: HashChangeEvent, defaultRoute: string): string | null {
    const routeWithPrefix = event.newURL.replace(location.origin + location.pathname, '');

    const routingParams = routeWithPrefix.split('#!').filter(Boolean);
    let route = null;
    if(routingParams.length === 0){
        route = routingParams.shift();
    } else {
        route = routingParams.pop();
    }

     // if same has current, no.
    if(event.oldURL === event.newURL){
        return null;
    }

    let subRoute = false;

    if(route && route.indexOf('/') !== -1){
        subRoute = true;
        route = route.split('/')[0];
    }

    const isDefault = event.newURL === location.origin + location.pathname;

    // If loaded component has routing, let him decide
    const current = customElements.get('ui-'+route) as CustomElementPageClass;
    if(current && current.hasRouting === true){
        return route;
    } else if(current && subRoute && current.hasRouting === false) {
        console.warn('Elara::', 'Navigating with args to a component who doesn\'t have routing logic');
    } else if(!current && !isDefault) {
        console.error('Elara error ::', 'Component not found');
    }

    // if index asked, go to default or if nothing asked, go to default
    if(isDefault || !route){
        return defaultRoute;
    }

    return route;
 }

 interface CustomElementPageClass {
	hasRouting: boolean;
}