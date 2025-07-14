// @ts-check
const replace = require('replace-in-file');
const { join } = require('path');
const { renameSync, writeFileSync } = require('fs');
const { exec } = require('child_process');

console.warn('deploying php into html');

const distFolder = join(__dirname, 'dist');

const configFile = join(distFolder, 'config.json');
const htmlFile = join(distFolder, 'index.html');
const htaccessFile = join(distFolder, '.htaccess');

try {
  exec('git rev-parse --short HEAD', (_err, stdout) => {
    const rev = stdout.replace('\n', '');
    writeFileSync(
      configFile,
      JSON.stringify(
        {
          name: 'Dobrunia Design',
          revision: 'dobrunia-' + rev,
          domain: 'dobruniadesign.com',
        },
        null,
        2,
      ),
    );
    console.log('config ok');

    const options = {
      files: htmlFile,
      from: '<!-- SSRFunctions -->',
      to: `
          <?php
          function get(){
            $request = $_SERVER['REQUEST_URI'];

            if($request == '/home' || $request == '/blog'){
              $request = '/';
            }

            $request = rtrim($request, '/');

            if(strpos($request, '/page') !== false || strpos($request, '/projet') !== false){
              $request .= '/';
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

          $title = isset($response->title) ? $response->title : 'Dobrunia Design';
          $description = isset($response->description) ? $response->description : "Décoration d'intérieur, création d'objet - les créations de Dobromila Golowacz";
          $image = isset($response->image) ? $response->image : 'https://base.dobruniadesign.com/wp-content/uploads/2025/03/logo-orginalne-czekolada.jpg';
          $url = isset($response->url) ? $response->url : 'https://www.dobruniadesign.com' . $_SERVER['REQUEST_URI'];

          if(isset($response->title) && strpos($title, '404') !== false){
            header($_SERVER["SERVER_PROTOCOL"]." 404 Not Found");
          }    

          if($response == null){
            $title = 'Dobrunia Design';
            $description = "Décoration d'intérieur, création d'objet - les créations de Dobromila Golowacz";
            $image = 'https://base.dobruniadesign.com/wp-content/uploads/2025/03/logo-orginalne-czekolada.jpg';
            $url = 'https://www.dobruniadesign.com' . $_SERVER['REQUEST_URI'];
          }
          ?>
          `,
    };
    replace.replaceInFileSync(options);
    console.log('replaced functions');

    options.from = '<!-- SSRHead -->';
    options.to = '<?= ogFor($title, $url, $description, $image); ?>';
    replace.replaceInFileSync(options);
    console.log('replaced head');

    options.from = '<!-- SSRPayload -->';
    options.to = '';
    replace.replaceInFileSync(options);
    console.log('replaced payload');

    const newFile = htmlFile.replace('.html', '.php');
    renameSync(htmlFile, newFile);
    console.log('Rename ok');
  });

  /*writeFileSync(
    htaccessFile,
    `
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
    `,
  );
  console.log('htaccess ok');*/
} catch (err) {
  throw new Error('error during deploy' + err ? err.message : err);
}
