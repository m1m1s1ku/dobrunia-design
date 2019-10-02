import { WPCategory } from './interfaces';

/**
 * Give a tree representation of wordpress categories
 * 
 * @param list WPCategory list with childs
 */
export function flatTree(list: WPCategory[]){
    const map = {};
    const roots = [];

    let node: WPCategory;
    let i: number;

    for (i = 0; i < list.length; i += 1) {
        map[list[i].id] = i;
        list[i].childs = [];
    }

    for (i = 0; i < list.length; i += 1) {
        node = list[i];
        if (node.parent !== 0) {
            list[map[node.parent]].childs.push(node);
        } else {
            roots.push(node);
        }
    }
    return roots;
}

export function parseAndReplaceUrls(content: string) {
    if(!content){
        return '';
    }

    return content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>');
}