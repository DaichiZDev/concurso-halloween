// sw.js

// Evento 'install' - se dispara cuando el SW se instala
self.addEventListener('install', (event) => {
    console.log('Service Worker instalado.');
    // Forzar al nuevo SW a tomar el control inmediatamente
    self.skipWaiting();
});

// Evento 'activate' - se dispara cuando el SW se activa
self.addEventListener('activate', (event) => {
    console.log('Service Worker activado.');
    // Tomar control de todas las pestañas abiertas de esta app
    event.waitUntil(self.clients.claim());
});

// Evento 'message' - escucha los mensajes de la página principal (index.html)
self.addEventListener('message', (event) => {
    // Verificar si el mensaje es del tipo correcto
    if (event.data && event.data.type === 'show_notification') {
        const { title, body, tag } = event.data;
        
        // Opciones para la notificación
        const options = {
            body: body,
            // Icono de calabaza para la notificación
            icon: 'https://img.icons8.com/color/96/000000/jack-o-lantern.png',
            // Icono pequeño (badge) para la barra de estado (en Android)
            badge: 'https://img.icons8.com/color/96/000000/ghost.png',
            // Etiqueta para agrupar o reemplazar notificaciones
            tag: tag || 'halloween-notification',
            // Patrón de vibración: vibra, pausa, vibra, pausa, vibra
            vibrate: [200, 100, 200, 100, 200],
            // Permitir que una nueva notificación con la misma etiqueta vuelva a notificar al usuario
            renotify: true,
        };

        // Mostrar la notificación
        // event.waitUntil asegura que el SW no se "duerma" hasta que la notificación se muestre
        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    }
});

// Evento 'notificationclick' - se dispara cuando el usuario toca la notificación
self.addEventListener('notificationclick', (event) => {
    // Cerrar la notificación que fue tocada
    event.notification.close();

    // Enfocar la ventana de la aplicación si está abierta, o abrirla si está cerrada
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Buscar una ventana ya abierta
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                // Compara la URL (ajusta '/' si tu app no está en la raíz)
                if (client.url.endsWith('/') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no hay ventanas abiertas, abre una nueva
            if (clients.openWindow) {
                return clients.openWindow('/'); // Ajusta '/' a la URL de tu app
            }
        })
    );
});
