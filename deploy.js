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

try {
    exec('git rev-parse --short HEAD', (_err, stdout) => {
        const rev = stdout.replace('\n', '');
        writeFileSync(configFile, JSON.stringify({
          name: 'Dobrunia Design',
          revision: 'dobrunia-' + rev,
          domain: 'dobruniadesign.com'
        }, null, 2));
        console.log('config ok');

        const options = {
          files: htmlFile,
          from: '<!-- {{SSRFunctions}} -->',
          to: `
          <?php
          function get(){
            $request = $_SERVER['REQUEST_URI'];

            if($request == '/home'){
              $request = '/';
            } else if($request != '/'){
              $request = $request . '/';
            }

            $url = "https://base.dobruniadesign.com" . $request;
            $ch = curl_init();
        
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_URL, $url);
        
            $response = curl_exec($ch);
        
            return json_decode($response);
          }
        
          function ogFor($title, $url, $description, $image){
            return <<<EOD
            <title>$title</title>
            <meta property='og:title' content="$title" />
            <meta property='og:url' content="$url" />
            <meta name='description' content="$description" />
            <meta property='og:type' content="website" />
            <meta property='og:image' content="$image" />
            EOD;
          }
        
          $response = get();

          $title = $response->title;
          $description = $response->description;
          $image = $response->image;
          $url = $response->url;

          if($response == null || $url == false){
            $title = 'Dobrunia Design';
            $description = '';
            $image = 'https://base.dobruniadesign.com/wp-content/uploads/2019/10/cropped-logo-fasada-bis.jpg';
            $url = 'https://www.dobruniadesign.com' . $_SERVER['REQUEST_URI'];
          }
          ?>
          `
        };

        replace.sync(options);
        console.log('replaced functions');
    
        options.from = '<!-- {{SSRHead}} -->';
        options.to = '<?= ogFor($title, $url, $description, $image); ?>';
        replace.sync(options);
        console.log('replaced head');
    
        options.from = '<!-- {{SSRPayload}} -->';
        options.to = '';
        replace.sync(options);
        console.log('replaced payload');

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