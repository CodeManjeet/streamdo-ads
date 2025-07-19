// Step 1: Dependencies ko import karna
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

// Step 2: Express app ko initialize karna
const app = express();
const port = 3000;

// Step 4: Asli proxy logic ke liye route (/proxy)
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('Error: URL parameter zaroori hai.');
    }

    try {
        // Step 5: Target URL se HTML content fetch karna
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = response.data;

        // Step 6: Cheerio se HTML ko load karna
        const $ = cheerio.load(html);

        // Step 7: Unwanted scripts ko hatana (block karna)
        const blockedScriptSources = [
            '/assets/jquery/css.js',  // Yeh wala script add kiya
            '/assets/jquery/css100.js',
            'bvtpk.com',  // Yeh pehle se tha
            'media.dalyio.com',
            'imasdk.googleapis.com',
            'cz.dyedmurders.com',  // Yeh pehle se tha
            'dyedmurders.com',  // Domain ko bhi block karne ke liye add kiya
            'tag.min.js',  // Specific file ko block karne ke liye
            'gpPTLMM0BJiUY6TQ',  // Specific path ko block karne ke liye
            'paupsoborofoow.net/tag.min.js',  // Naya script block kiya
            '/assets/jquery/p1anime.js?v=1'
        ];
        blockedScriptSources.push('paupsoborofoow.net');

        $('script').each((index, element) => {
            const scriptSrc = $(element).attr('src');
            const scriptContent = $(element).html();

            // Script ko uske 'src' attribute se block karna
            if (scriptSrc) {
                // Check if script src matches any blocked pattern
                const shouldBlock = blockedScriptSources.some(blocked => {
                    // Exact match for paths
                    if (scriptSrc.includes(blocked)) {
                        return true;
                    }
                    // Match query parameters version (like ?v=1.2)
                    if (blocked.startsWith('/') && scriptSrc.split('?')[0].includes(blocked)) {
                        return true;
                    }
                    return false;
                });

                if (shouldBlock) {
                    console.log(`Blocking script by src: ${scriptSrc}`);
                    $(element).remove();
                    return;
                }
            }

            // Inline script ko uske content se block karna
            if (!scriptSrc && scriptContent) {
                const shouldBlockInline = blockedScriptSources.some(blocked => {
                    return scriptContent.includes(blocked);
                });

                if (shouldBlockInline || scriptContent.includes('function(w,a)')) {
                    console.log('Blocking inline ad script.');
                    $(element).remove();
                }
            }
        });

        // Step 8: Relative paths ko fix karne ke liye <base> tag add karna
        const pageUrl = new URL(targetUrl);
        $('head').prepend(`<base href="${pageUrl.href}">`);

        // CSP sandbox header lagana (popups/new-tabs ko block karne ke liye)

        // Client-side script inject karna to override window.open and block <a target="_blank">
        $('head').prepend(`
          <script>
            // new tab/popup ki har call ko no-op bana do
            window.open = () => null;

            // Agar kahin <a target="_blank"> bach bhi gaya ho, use bhi rok do
            document.addEventListener('click', function(e) {
              let el = e.target;
              while (el && el !== document) {
                if (el.tagName === 'A' && el.target === '_blank') {
                  e.preventDefault();
                  // Agar chaho to usi tab mein navigate karwa sakte ho:
                  // window.location.href = el.href;
                  break;
                }
                el = el.parentElement;
              }
            }, true);
          </script>
        `);

        // Step 9: Saaf kiya hua HTML browser ko bhejna
        res.send($.html());

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send(`URL fetch karne me error aaya. Details: ${error.message}`);
    }
});

// Step 10: Server ko start karna
app.listen(port, () => {
    console.log(`Proxy server http://localhost:${port} par chal raha hai`);
});
// Team Mantecion Dev 
