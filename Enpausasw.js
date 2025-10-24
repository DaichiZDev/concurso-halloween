// sw.js

const CACHE_NAME = 'halloween-vote-cache-v1'; // Cambia 'v1' si actualizas archivos principales
const urlsToCache = [
  '/', // Ruta raíz (asume que index.html está en la raíz)
  '/index.html', // Cachear explícitamente index.html
  // '/style.css', // No necesitamos cachear CSS si está dentro del HTML
  // '/script.js', // No necesitamos cachear JS si está dentro del HTML
  // Íconos y fuentes (opcional pero bueno para offline/velocidad)
  'https://fonts.googleapis.com/css2?family=Creepster&family=Inter:wght@400;700&display=swap',
  'https://img.icons8.com/color/96/000000/jack-o-lantern.png',
  'https://img.icons8.com/color/96/000000/ghost.png',
];

// Evento 'install' - Guarda los archivos en caché
self.addEventListener('install', (event) => {
    console.log('SW: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('SW: Cache abierto, añadiendo archivos principales:', urlsToCache);
                // Usar addAll con precaución, si una URL falla, toda la instalación falla.
                return cache.addAll(urlsToCache)
                    .catch(error => {
                         console.warn('SW: Algunos recursos no se pudieron cachear inicialmente (puede ser normal para fuentes/iconos externos):', error);
                         // Continuar aunque fallen recursos externos opcionales
                         return Promise.resolve();
                    });
            })
            .then(() => {
                console.log('SW: Archivos principales solicitados para caché. Instalación completa.');
                self.skipWaiting(); // Activar nuevo SW inmediatamente
            })
            .catch(error => {
                console.error('SW: Fallo CRÍTICO al abrir/cachear durante install:', error);
            })
    );
});

// Evento 'activate' - Limpia cachés antiguas
self.addEventListener('activate', (event) => {
    console.log('SW: Activando...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('SW: Eliminando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('SW: Activado y controlando clientes.');
            return self.clients.claim();
        })
    );
});

// Evento 'fetch' - Sirve archivos desde caché o red (Cache First para URLs cacheadas)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Solo aplicar estrategia de caché a las URLs que intentamos cachear
    const requestUrl = new URL(event.request.url);
    // Comprobar si la ruta o la URL completa está en nuestra lista (simplificado)
    const shouldCache = urlsToCache.some(url =>
        (url.startsWith('/') && requestUrl.pathname === url) || requestUrl.href === url
    );

    if (shouldCache) {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    // Si está en caché, devolverlo
                    if (response) {
                        return response;
                    }
                    // Si no, ir a la red
                    return fetch(event.request).then((networkResponse) => {
                        // Opcional: Podrías añadirlo al caché aquí si quieres actualizarlo
                        // caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
                        return networkResponse;
                    }).catch(() => {
                        // Opcional: Devolver una página offline genérica si falla la red
                        console.warn(`SW: Fallo al buscar ${event.request.url} en red.`);
                    });
                })
        );
    } else {
        // Para otras peticiones (ej. Firebase), simplemente ir a la red
        return; // Deja que el navegador maneje la petición normalmente
    }
});


// --- Lógica de Notificaciones (Sin cambios) ---
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'show_notification') {
        const { title, body, tag } = event.data;
        const options = {
            body: body,
            icon: 'https://img.icons8.com/color/96/000000/jack-o-lantern.png',
            badge: 'https://img.icons8.com/color/96/000000/ghost.png',
            tag: tag || 'halloween-notification',
            vibrate: [200, 100, 200, 100, 200],
            renotify: true,
        };
        event.waitUntil(self.registration.showNotification(title, options));
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const appUrl = self.location.origin + '/'; // URL base de tu app
            for (const client of clientList) {
                // Comprobar si la URL del cliente empieza con la URL de la app
                if (client.url.startsWith(appUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(appUrl); // Abrir la URL base
            }
        })
    );
});
