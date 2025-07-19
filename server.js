// Step 1: Dependencies ko import karna
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

// Step 2: Express app ko initialize karna
const app = express();
const port = 3000;

// Step 3: Homepage (/) ke liye route
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="hi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ad-Blocking Proxy</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; }
                .container { background: white; padding: 2rem 3rem; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
                h1 { color: #333; }
                p { color: #666; }
                input[type="url"] { width: 100%; padding: 12px; margin-top: 1rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; }
                button { width: 100%; padding: 12px; border: none; background: linear-gradient(45deg, #007bff, #0056b3); color: white; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; }
                button:hover { opacity: 0.9; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Proxy Server</h1>
                <p>Yahan woh website URL daalein jiske ads aap block karna chahte hain.</p>
                <form action="/proxy" method="get" target="_blank">
                    <input type="url" name="url" value="https://movearnpre.com/embed/mrchmq892z9h" required>
                    <button type="submit">Website Kholein</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

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
