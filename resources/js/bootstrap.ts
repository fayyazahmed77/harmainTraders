import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo;
        broadcastConfig?: {
            driver: 'reverb' | 'pusher';
            pusher?: {
                key?: string;
                cluster?: string;
            };
            reverb?: {
                key?: string;
                host?: string;
                port?: string;
                scheme?: string;
            };
        };
    }
}

window.Pusher = Pusher;

const config = window.broadcastConfig || {
    driver: 'reverb',
    reverb: {
        key: import.meta.env.VITE_REVERB_APP_KEY || 'local',
        host: import.meta.env.VITE_REVERB_HOST ?? '127.0.0.1',
        port: import.meta.env.VITE_REVERB_PORT || '8080',
        scheme: import.meta.env.VITE_REVERB_SCHEME ?? 'http',
    }
};

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (config.driver === 'pusher') {
    const pusherKey = config.pusher?.key || import.meta.env.VITE_PUSHER_APP_KEY;
    const pusherCluster = config.pusher?.cluster || import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1';
    
    if (pusherKey) {
        window.Echo = new Echo({
            broadcaster: 'pusher',
            key: pusherKey,
            cluster: pusherCluster,
            forceTLS: true,
            enabledTransports: ['ws', 'wss'],
        });
    }
} else {
    const host = isLocal 
        ? (config.reverb?.host || import.meta.env.VITE_REVERB_HOST || '127.0.0.1')
        : window.location.hostname;

    const scheme = isLocal 
        ? (config.reverb?.scheme || import.meta.env.VITE_REVERB_SCHEME || 'http')
        : 'https';

    const port = isLocal 
        ? (config.reverb?.port ? parseInt(config.reverb.port) : (import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT) : 8080))
        : 443;

    const reverbKey = config.reverb?.key || import.meta.env.VITE_REVERB_APP_KEY || 'local';

    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: reverbKey,
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS: scheme === 'https',
        enabledTransports: ['ws', 'wss'],
    });
}
