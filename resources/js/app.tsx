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

// Global session keepalive to prevent timeouts during long sales/purchase entries
function initSessionKeepalive() {
    const INTERVAL_MS = 3 * 60 * 1000; // Ping every 3 minutes
    let lastPing = Date.now();

    const sendHeartbeat = () => {
        // Only ping if not on login or landing page
        if (window.location.pathname.startsWith('/login') || window.location.pathname === '/') {
            return;
        }

        fetch('/api/ping', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin',
        })
            .then((res) => {
                if (res.status === 401) {
                    console.warn('Session has ended on server');
                }
            })
            .catch(() => {});
        lastPing = Date.now();
    };

    // Periodic ping
    setInterval(sendHeartbeat, INTERVAL_MS);

    // Ping when browser tab comes into focus after being backgrounded
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && Date.now() - lastPing > INTERVAL_MS) {
            sendHeartbeat();
        }
    });

    // Ping on active user interaction if more than 3 minutes have elapsed
    ['click', 'keydown'].forEach((eventType) => {
        window.addEventListener(
            eventType,
            () => {
                if (Date.now() - lastPing > INTERVAL_MS) {
                    sendHeartbeat();
                }
            },
            { passive: true }
        );
    });
}

initSessionKeepalive();

