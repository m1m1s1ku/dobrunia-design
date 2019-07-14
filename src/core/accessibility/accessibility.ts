import Elara from '../elara';

export function isEnter(event: KeyboardEvent): boolean {
    return (event.keyCode || event.which) === 13;
}

export function isTab(event: KeyboardEvent): boolean {
    return (event.keyCode || event.which) === 9;
}

export function onSkipLink(e: KeyboardEvent | Event, host: Elara.Root): void {
    e.stopPropagation(); 
    e.preventDefault();
    
    if(!isTab(e as KeyboardEvent)){ return; }

    const target = e.target as HTMLLinkElement;
    target.blur();

    if(!host.loadedElement){
        return;
    }

    const skipArea = host.loadedElement.shadowRoot.querySelector('.skip');
    if(skipArea && skipArea instanceof HTMLElement){
        skipArea.scrollIntoView(); 
    }
}