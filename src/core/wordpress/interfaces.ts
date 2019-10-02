export interface WPTag {
    id?: number;
    description?: string;
    name: string;
    slug: string;
};

export enum WPArticleStatus { 
    publish = 'publish', 
    future = 'future', 
    draft = 'draft', 
    pending = 'pending', 
    private = 'private'
};

export interface WPPost {
    id?: number;
    title: string;
    status: WPArticleStatus;
    content: string;
    categories: number[];
    tags: number[]; // comma-separated
    date: string; // YYYY-MM-DDTHH:MM:SS
    excerpt: string;
    password: string;
    featured_media: number; // id of media
    slug: string;
    // developer.wordpress.org/rest-api/reference/posts/#create-a-post
};

export interface WPSearchPost {
    author: number;
    categories: number[];
    comment_status: string;
    content: {
        rendered: string;
        readmore?: string;
    };
    date: string;
    date_gmt: string;
    excerpt: {rendered: string; protected: boolean};
    featured_media: number;
    format: string;
    guid: {rendered: string};
    id: number;
    jetpack_featured_media_url: string;
    jetpack_shortlink: string;
    link: string;
    meta: {
        spay_email: string;
    };
    modified: string;
    modified_gmt: string;
    ping_status: string;
    slug: string;
    status: WPArticleStatus;
    sticky: boolean;
    tags: number[];
    type: string;
    title: {
        rendered: string;
    };
}

export interface WPCategory {
    childs: WPCategory[];
    count?: number;
    description?: string;
    id: number;
    link: string;
    name: string;
    parent: number;
    slug: string;
    taxonomy: string;
};

export interface WPCreateCategory {
    description: string;
    name: string;
    slug: string;
    parent: number;
};

export interface Metadata {
    isEmbed: boolean;
    description: string;
    icon: string;
    image: string;
    keywords: string;
    language: string;
    provider: string;
    title: string;
    type: string;
    url: string;
    detected: string[];
    error: boolean;
};