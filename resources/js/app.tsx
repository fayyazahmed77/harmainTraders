import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Handle Vite dynamic import / chunk loading errors (stale build cache on live deployments)
window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    window.location.reload();
});

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ).catch((err) => {
            console.error('Inertia page resolve error:', err);
            if (err?.message?.includes('Failed to fetch dynamically imported module') || err?.name === 'TypeError') {
                window.location.reload();
            }
            throw err;
        }),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#FCA13A',
    },
});

// This will set light / dark mode on load...
initializeTheme();
