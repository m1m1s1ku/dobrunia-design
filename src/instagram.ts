import { EMPTY, Observable } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { switchMap, reduce, catchError } from 'rxjs/operators';

export interface InstagramThumbs {
  src: string;
  shortcode: string;
}

/**
 * Load instagram feed using partially public api
 *
 * NOTE : HACK ahead.
 */
export function instaLoad$(): Observable<ReadonlyArray<InstagramThumbs>> {
  return fromFetch(
    'https://www.instagram.com/graphql/query/?query_id=17888483320059182&query_hash=472f257a40c653c64c666ce877d59d2b&variables=%7B%22id%22:%228130742951%22,%22first%22:%2212%22%7D',
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
        referer: 'https://www.instagram.com/dobruniadesignatelier/',
      },
    }
  ).pipe(
    switchMap((response) => response.json()),
    reduce((acc, response) => {
      const userData = response.data.user;
      const timeline = userData.edge_owner_to_timeline_media.edges.slice(0, 4);

      for (const latestPost of timeline) {
        const resources = latestPost.node.thumbnail_resources;
        const thumbnail = resources.find(
          (resource) => resource.config_height === 240
        );
        if (thumbnail) {
          acc.push({
            shortcode: latestPost.node.shortcode,
            src: thumbnail.src,
          });
        }
      }

      return acc;
    }, []),
    catchError((err) => {
      console.log('Instagram can\'t load.', err);
      // do nothing.
      return EMPTY;
    })
  );
}
