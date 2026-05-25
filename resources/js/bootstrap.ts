import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo;
    }
}

window.Pusher = Pusher;

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const host = isLocal 
    ? (import.meta.env.VITE_REVERB_HOST ?? '127.0.0.1')
    : window.location.hostname;

const scheme = isLocal 
    ? (import.meta.env.VITE_REVERB_SCHEME ?? 'http')
    : 'https';

const port = isLocal 
    ? (import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT) : 8080)
    : 443;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'local',
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
});
