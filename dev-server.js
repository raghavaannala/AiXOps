// Local development API server - serves Gmail OAuth endpoints
import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Dynamically load API endpoints from /api folder and subdirectories
async function loadRoutes() {
    const apiPath = join(__dirname, 'api');
    const subdirs = ['integrations', 'ai', 'cron', 'db', 'notifications'];

    for (const subdir of subdirs) {
        const subdirPath = join(apiPath, subdir);

        try {
            const files = await readdir(subdirPath);

            for (const file of files) {
                if (file.endsWith('.js')) {
                    const routeName = file.replace('.js', '');
                    const modulePath = `./api/${subdir}/${file}`;

                    try {
                        const module = await import(modulePath);
                        const handler = module.default;

                        // Register both GET and POST for each handler
                        app.all(`/api/${subdir}/${routeName}`, async (req, res) => {
                            try {
                                await handler(req, res);
                            } catch (error) {
                                console.error(`Error in ${subdir}/${routeName}:`, error);
                                res.status(500).json({ error: error.message });
                            }
                        });

                        console.log(`✅ Loaded: /api/${subdir}/${routeName}`);
                    } catch (err) {
                        console.error(`❌ Failed to load ${subdir}/${file}:`, err.message);
                    }
                }
            }
        } catch (err) {
            // Directory might not exist, which is fine
            if (err.code !== 'ENOENT') {
                console.error(`Error loading ${subdir} routes:`, err);
            }
        }
    }
}

const PORT = process.env.API_PORT || 3000;

loadRoutes().then(() => {
    app.listen(PORT, () => {
        console.log(`\n🚀 API Server running at http://localhost:${PORT}`);
        console.log(`\n📋 Environment check:`);
        console.log(`   GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
        console.log(`   GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
        console.log(`   GOOGLE_REDIRECT_URI: ${process.env.GOOGLE_REDIRECT_URI || 'Using default'}`);
        console.log(`   CEREBRAS_API_KEY: ${process.env.CEREBRAS_API_KEY ? '✅ Set' : '⚠️ Not set (AI features will not work)'}`);
    });
});
