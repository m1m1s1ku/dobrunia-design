import { Observable, EMPTY, of, from, OperatorFunction } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { map, switchMap, catchError, tap } from 'rxjs/operators';

import Constants from '../../constants';
import { slugify } from '../ui/ui';

import { WPCategory, WPTag, WPPost, WPCreateCategory, WPSearchPost } from './interfaces';
import { flatTree } from './helper';
import { navigate } from '../routing/routing';

export interface TagsStatus {
    hasChanged: boolean; 
    current: number; 
    totalPages: number; 
    totalTags: number;
}

export declare namespace WPBridgeAPI {
    export interface Loader {
        category(id: number, perPage?: number, page?: number): Observable<WPSearchPost[]>;
        categories(search?: string, perPage?: number, page?: number): Observable<ReadonlyArray<WPCategory>>;
        tags: () => {
            page(index: number): Observable<Response>;
            exists(tag: string, database: unknown): Observable<number>;
            hasChanged(current: number, perPage?: number): Observable<TagsStatus>;
        };
        post(slug: string, isSearch: boolean): Observable<ReadonlyArray<WPPost | WPSearchPost>>;
        search(term: string, isSearch: boolean, page?: number, categories?: number[], perPage?: number): Observable<Response>;
    }

    export interface Maker {
        post(article: WPPost): Observable<WPPost>;
        media(file: File, article: string): Observable<number>;
        tag(tag: WPTag, database: unknown): Observable<number>;
        category(category: WPCreateCategory): Observable<number>;
    }
}

export function cancelFetchOnError<T>(defaultValue?: T): OperatorFunction<Response, T> {
    return input$ => input$.pipe(
        switchMap(response => {
            if(response.ok){
                return response.json() as Promise<T>;
            } else {
                return defaultValue ? of(defaultValue) : EMPTY;
            }
        })
    );
}

export function redirectOnUnauthorized(): OperatorFunction<Response, Response>{
    return input$ => input$.pipe(
        tap((response: Response) => {
            if(response.status === 401){
                navigate('login');
            }
        })
    );
}

export default class WPBridge {
    private token: string;
    private _signal: AbortSignal;

    public constructor(token: string, signal: AbortSignal){
        this.token = token;
        this._signal = signal;
    }

    public get loader(): WPBridgeAPI.Loader {
        const maker = this.maker;

        return {
            category: (id: number, perPage = 100, page = 1): Observable<WPSearchPost[]> => {
                return fromFetch(Constants.proxy+Constants.api+Constants.posts+'?per_page='+perPage+(id ? '&categories='+id:'')+(page? '&page='+page : ''), {signal: this._signal}).pipe(
                    redirectOnUnauthorized(),
                    cancelFetchOnError<WPSearchPost[]>()
                );
            },
            categories: (search?: string, perPage = 100, page = 1): Observable<ReadonlyArray<WPCategory>> => {
                return fromFetch(Constants.proxy+Constants.api+Constants.categories+'?per_page='+perPage+(search ? '&search='+search:'')+(page? '&page='+page : ''), {signal: this._signal}).pipe(
                    redirectOnUnauthorized(),
                    cancelFetchOnError<WPCategory[]>(),
                    map(categories => {
                        return flatTree(categories);
                    })
                );
            },
            tags: () => {
                return {
                    page(index: number){
                        return fromFetch(Constants.proxy+Constants.api+Constants.tags+'?per_page=100&page='+index, {signal: this._signal}).pipe(
                            redirectOnUnauthorized(),
                        );
                    },
                    exists(tag: string, database: unknown){
                        return fromFetch(Constants.proxy.concat(Constants.api.concat(Constants.tags).concat('?search='+tag)), {signal: this._signal}).pipe(
                            redirectOnUnauthorized(),
                            cancelFetchOnError<WPTag[]>(),
                            switchMap(tags => {
                                if(tags.length > 0){
                                    return of(tags[0].id);
                                } else {
                                    return maker.tag({
                                        name: tag,
                                        slug: slugify(tag, '-')
                                    }, database);
                                }
                            })
                        );
                    },
                    hasChanged(current: number, perPage = 100): Observable<{hasChanged: boolean; current: number; totalPages: number; totalTags: number}>{
                        return fromFetch(Constants.proxy+Constants.api+Constants.tags+'?per_page='+perPage, {signal: this._signal}).pipe(
                            map(response => {
                                if(response.ok){
                                    const totalPages = parseInt(response.headers.get('X-Wp-Totalpages'), 10);
                                    const totalTags = parseInt(response.headers.get('X-Wp-Total'), 10);

                                    const hasChangedExtra = {
                                        current,
                                        totalPages,
                                        totalTags
                                    };

                                    if(current !== totalTags){
                                        return {
                                            hasChanged: true,
                                            ...hasChangedExtra
                                        };
                                    } else {
                                        return {
                                            hasChanged: false,
                                            ...hasChangedExtra
                                        };
                                    }
                                } else {
                                    return {
                                        hasChanged: false,
                                        current,
                                        totalPages: -1,
                                        totalTags: -1
                                    };
                                }
                            })
                        );
                    }
                };
            },
            post(slug: string, isSearch: boolean, page = 1) {
                return fromFetch(Constants.proxy.concat(Constants.api.concat(Constants.posts)+ (isSearch ? '?search=' : '?slug=') + slug) + '&per_page=100&page='+page, {signal: this._signal}).pipe(
                    redirectOnUnauthorized(),
                    cancelFetchOnError<WPPost[]>([])
                );
            },
            search(term: string, isSearch: boolean, page = 1, categories?: number[], perPage = 100) {
                return fromFetch(Constants.proxy.concat(Constants.api.concat(Constants.posts)+ (isSearch ? '?search=' : '?slug=') + term) + `&per_page=${perPage}&page=`+page+(categories ? '&categories='+categories.join(',') : ''), {signal: this._signal}).pipe(
                    redirectOnUnauthorized()
                );
            }
        };
    }

    public get maker(): WPBridgeAPI.Maker {
        return {
            post: (article: WPPost) => {
                return fromFetch(Constants.proxy + Constants.api + Constants.posts, {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify(article),
                    method: 'POST',
                    signal: this._signal
                }).pipe(
                    redirectOnUnauthorized(),
                    switchMap(response => {
                        if(response.ok && response.status === 201){
                            return response.json();
                        } else {
                            return EMPTY;
                        }
                    }
                ));
            },
            media: (file: File, article: string): Observable<number> => {
                if(!file){
                    return of(null);
                }

                if(file.size/1024/1024 > 2){
                    console.warn('File size exceeds max');
                    return of(-1);
                }
        
                const name = file.name.split('?')[0].split('.').pop();
        
                let extension = '.jpg';
                if(!!name.match(/png/)){
                    extension = '.png';
                }
                if(!!name.match(/jpe?g/)){
                    extension = '.jpg';
                }
        
                return fromFetch(Constants.proxy + Constants.api + Constants.media, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': file.type,
                        'Content-Disposition': 'attachment; filename=' + article + extension
                    },
                    body: file,
                    method: 'POST',
                    signal: this._signal
                }).pipe(
                    redirectOnUnauthorized(),
                    switchMap(response => {
                        if(response.ok && response.status === 201){
                            return response.json().then(pic => pic.id);
                        } else {
                            return EMPTY;
                        }
                    })
                );
            },
            tag: (tag: WPTag, _database: unknown): Observable<number> => {
                console.warn('creating tag', tag);

                return fromFetch(Constants.proxy + Constants.api + Constants.tags, {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify(tag),
                    method: 'POST',
                    signal: this._signal
                }).pipe(
                    redirectOnUnauthorized(),
                    switchMap(response => {
                        if (response.status === 201) {
                            console.warn('created tag', tag);

                            return EMPTY;
                            /* return from(database.setItem(tag.name.toLowerCase(), tag.name)).pipe(
                                switchMap(async _ => {
                                    const { id } = await response.json();
                                    return id as number;
                                })
                            );*/
                        } else if(response.status === 400){
                            console.warn('Tag exists, re-use', tag);
                            return from(response.json().then(json => json.data.term_id));
                        } else {
                            return EMPTY;
                        }
                    })
                );
            },
            category: (category: WPCreateCategory): Observable<number> => {
                return fromFetch(Constants.proxy + Constants.api + Constants.categories, {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify(category),
                    method: 'POST',
                    signal: this._signal
                }).pipe(
                    redirectOnUnauthorized(),
                    switchMap(response => {
                        if (response.status === 201) {
                            console.warn('created category', category);
                            return response.json().then(json => json.id) as Promise<number>;
                        } else if(response.status === 400){
                            console.warn('Category exists, re-using', category);
                            return response.json().then(json => json.data.term_id) as Promise<number>;
                        } else {
                            return EMPTY;
                        }
                    }),
                    catchError(err => {
                        console.error('error while adding category', err);
                        return EMPTY;
                    })
                );
            }
        };
    }
}