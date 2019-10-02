// @ts-check
const replace = require('replace-in-file');
const {join} = require('path');
const {renameSync, writeFileSync} = require('fs');
const { exec } = require('child_process');

console.warn('deploying php into html');

const distFolder = join(__dirname, 'dist');

const configFile = join(distFolder, 'config.json');
const htmlFile = join(distFolder, 'index.html');
const htaccessFile = join(distFolder, '.htaccess');
const serviceWorkerFile = join(distFolder, 'elara-worker.js');

const options = {
  files: htmlFile,
  from: '<!-- {{SSRFunctions}} -->',
  to: `<?php    
    function prepare($endpoint, $type, $term, $catID = null){
        $api = 'https://base.dobruniadesign.com';
        $protocol = '/wp-json/wp/v2/';
        if($type && $term){
            $url="$api$protocol$endpoint?$type=$term";
            if($catID){
                $url .= "&categories=$catID";
            }
        } else if($catID) {
            $url="$api$protocol$endpoint?categories=$catID";
        } else {
            $url="$api$protocol$endpoint";
        }

        $url .= '&per_page=100';

        $ch = curl_init();
        $headers = [];

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_URL,$url);

        curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) use (&$headers){
            $len = strlen($header);
            $header = explode(':', $header, 2);
             // ignore invalid headers
            if (count($header) < 2){
                return $len;
            }

            $headers[strtolower(trim($header[0]))][] = trim($header[1]);

            return $len;
        });

        $response = curl_exec($ch);

        return ['response' => json_decode($response, true), 'total' => intval($headers['x-wp-total'][0], 10), 'totalPages' => intval($headers['x-wp-totalpages'][0], 10) ];
    }

    function getPosts($term, $catID = null){
        return prepare('posts', 'slug', urlencode($term), $catID);
    }

    function getCats($term){
        return prepare('categories', 'slug', urlencode($term));
    }

    function searchPost($term, $catID = null){
        return prepare('posts', 'search', urlencode($term), $catID);
    }
    
    function initialPayload($posts, $term, $total, $totalPages, $last){
        $tagStart = "<script id='elara'>";
        $tagEnd =  "</script>";

        $payload = "window.state =";
        if(isset($posts)){
          $payload .= json_encode($posts);
        } else { 
          $payload .= "[]";
        }
        $payload .= ";";

        if(isset($total)){
            $payload .= "window.total = $total;";
        }

        if(isset($totalPages)){
            $payload .= "window.totalPages = $totalPages;";
        }

        $payload = $tagStart . $payload . $tagEnd;
        return $payload;
    }

    function OGFor($payload){
        $current = $payload['current'];
        $posts = $payload['posts'];
        $term = $payload['term'];
        $cats = $payload['cats'];

        if(isset($current['title'])){
            $title = $current['title']['rendered'];
        }

        if(isset($current['jetpack_featured_media_url'])){
            $image = $current['jetpack_featured_media_url'];
        }

        if(empty($title) && !empty($posts)){
            $title = $cats[0]['name'];
            $image = $posts[0]['jetpack_featured_media_url'];
        }

        if(empty($image)){
            $image = 'https://dobruniadesign.com/assets/assets/facebook_cover_photo_2.png';
        }

        if($title){
            return <<<EOD
            <title>$title | Dobrunia Design</title><meta property='og:title' content="$title | Dobrunia Design" /><meta property='og:type' content="website" /><meta property='og:image' content="$image" />
            EOD;
        } else {
            return <<<EOD
            <title>Dobrunia</title><meta property='og:title' content="Dobrunia Design" /><meta property='og:url' content="https://dobruniadesign.com" /><meta name='description' content="" /><meta property='og:type' content="website" /><meta property='og:image' content="$image" />
            EOD;
        }
    }

    function load(){
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $last = basename($path);
    
        $isCat = strpos($path, 'category');
        if(isset($_GET['s'])){
            $search = urldecode($_GET["s"]);
        } else {
            $search = '';
        }
    
        if($path === '/' && empty($search)){
            return;
        }

        if($last === 'toutes' || empty($last)){
            $last = null;
            $isCat = false;
        }

        $request = null;
    
        // Last is a search query
        if(!empty($search) && !$isCat) {
            $request = searchPost($search);
            $posts = $request['response'];
            $current = ['title' => ['rendered' => ucfirst($search) ]];
        // not in a category, but post (slug direct access)
        } else if($isCat == false && !empty($last)){
            $request = getPosts($last);
            $posts = $request['response'];
            $current = isset($posts) ? $posts[0] : null;
        // category only
        } else if(!empty($last) && $isCat && empty($search)){
            $request = getCats($last);
            $cats = $request['response'];
            if(!empty($cats) && (count($cats) >= 1)){
                $request = getPosts(null, $cats[0]['id']);
                $posts = $request['response'];
                $current = ['title' => ['rendered' => $cats[0]['name']]];
            }
        // Category + search
        } else if($isCat && !empty($search) && !empty($last)){
            $request = getCats($last);
            $cats = $request['response'];
            if(!empty($cats) && (count($cats) >= 1)){
                $request = searchPost($search, $cats[0]['id']);
                $posts = $request['response'];
                $current = ['title' => ['rendered' => ucfirst($search) . ' - ' . $cats[0]['name']]];
            }
        }

        return [
            'cats'    =>  isset($cats) ? $cats : null,
            'current' => $current, 
            'posts' => $posts, 
            'term' => $search,
            'last' => $last,
            'total' => isset($request['total']) ? $request['total'] : -1,
            'totalPages' => isset($request['totalPages']) ? $request['totalPages'] : -1
        ];
    }

    $payload = load();
    $current = $payload['current'];
    $posts = $payload['posts'];
    $term = $payload['term'];
    $last = $payload['last'];
    $total = $payload['total'];
    $totalPages = $payload['totalPages'];

?>`
};
try {
    exec('git rev-parse --short HEAD', (_err, stdout) => {
        const rev = stdout.replace('\n', '');
        writeFileSync(configFile, JSON.stringify({
          name: 'Dobrunia Design',
          revision: 'dobrunia-' + rev,
          domain: 'dobruniadesign.com',
          api: 'https://base.dobruniadesign.com/wp-json/',
          proxy: '',
          login: 'jwt-auth/v1/token',
          media: 'wp/v2/media',
          posts: 'wp/v2/posts',
          tags: 'wp/v2/tags',
          validate: 'jwt-auth/v1/token/validate',
          categories: 'wp/v2/categories',
          modes: {
              default: 'day'
          },
          defaults: {
              route: 'home'
          }
        }, null, 2));
        console.log('config ok');

        const oldName = 'elara-worker.js';
        const newFileName = 'dobrunia-worker-'+rev+'.js';
        renameSync(serviceWorkerFile, serviceWorkerFile.replace(oldName, newFileName));
        console.log('renamed elara service worker to', newFileName);

        options.from = oldName;
        options.to = newFileName;
        replace.sync(options);
        console.log('replaced sw in html');

        const newFile = htmlFile.replace('.html', '.php');
        renameSync(htmlFile, newFile);
        console.log('Rename ok');    
    });

    replace.sync(options);
    console.log('replaced functions');

    options.from = '<!-- {{SSRHead}} -->';
    options.to = '<?= OGFor($payload); ?>';
    replace.sync(options);
    console.log('replaced head');

    options.from = '<!-- {{SSRPayload}} -->';
    options.to = '<?= initialPayload($posts, $term, $total, $totalPages, $last); ?>';
    replace.sync(options);
    console.log('replaced payload');

    writeFileSync(htaccessFile, `
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^(.+)$ index.php [QSA,L]
    
    ## EXPIRES HEADER CACHING ##

    ExpiresActive On
    ExpiresByType image/jpg "access 1 year"
    ExpiresByType image/jpeg "access 1 year"
    ExpiresByType image/gif "access 1 year"
    ExpiresByType image/png "access 1 year"
    ExpiresByType image/svg "access 1 year"
    ExpiresByType text/css "access 1 month"
    ExpiresByType application/pdf "access 1 month"
    ExpiresByType application/javascript "access 1 month"
    ExpiresByType application/x-javascript "access 1 month"
    ExpiresByType application/x-shockwave-flash "access 1 month"
    ExpiresByType image/x-icon "access 1 year"
    ExpiresDefault "access 2 days"

    ## EXPIRES HEADER CACHING ##
    `);
    console.log('htaccess ok');
} catch (err) {
    throw new Error('error during deploy' + err ? err.message : err);
}