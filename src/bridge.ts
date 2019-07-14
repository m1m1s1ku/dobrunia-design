export interface Link {
	idx: number;
	name: string;
	route: string;
}

export interface SocialLink {
	id: string;
	name: string;
	url: string;
}

export interface APICategories {
	id: string;
	name: string;
	slug: string;
}

export interface Article {
    id: string;
    title: string;
    content: string;
    slug: string;
    categoryId: string;
    category: Category;
    images: ReadonlyArray<Image>;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
};

export interface Image {
    filename: string;
    id: string;
    isRaw: number;
    path: string;
    projectId: string;
    size: string;
    userOrder: number;
};

export interface Project {
    bigOrder: number;
    category: Category;
    categoryId: string;
    content: string; // unsafe html
    description: string;
    images: ReadonlyArray<Image>;
    slug: string;
    title: string;
    userOrder: number;
};