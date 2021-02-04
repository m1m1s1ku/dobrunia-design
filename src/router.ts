import crayon from 'crayon';
import { ElaraApp } from './elara-app';

export function bindCrayon(element: ElaraApp): crayon.Router {
    const router = crayon.create();

    router.path('/', () => {
        return element.load('home');
    });
    router.path('/home', () => {
        return element.load('home');
    });
    router.path('/revendeurs', () => {
        return element.load('revendeurs');
    });
    router.path('/page/:page', (req) => {
        return element.load('page/'+req.params.page);
    });
    router.path('/blog', () => {
        return element.load('blog');
    });
    router.path('/projet/:slug', req => {
        return element.load('projet/'+req.params.slug);
    });
    router.path('/post/:slug', (req) => {
        return element.load('post/'+req.params.slug);
    });
    router.path('/**', (req) => {
        return element.load(req.pathname.replace('/', ''));
    });

    return router;
}