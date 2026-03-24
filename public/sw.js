const CACHE_NAME = "goldenlist-v2";

// Install: skip pre-caching auth-protected routes
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate: clean old caches, register periodic sync
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),
      // Register periodic background sync (daily badge update)
      self.registration.periodicSync
        ? self.registration.periodicSync.register("update-badge", {
            minInterval: 24 * 60 * 60 * 1000, // 24 hours
          }).catch(() => {})
        : Promise.resolve(),
    ])
  );
  self.clients.claim();
});

// Fetch: network-first, cache successful responses for offline use
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.url.includes("/api/") || request.url.includes("supabase")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          return new Response("Offline", { status: 503 });
        });
      })
  );
});

// Update badge count by calling the badge API
async function updateBadge() {
  try {
    const response = await fetch("/api/badge", { credentials: "include" });
    if (!response.ok) return;
    const { count } = await response.json();
    if (navigator.setAppBadge) {
      if (count > 0) {
        await navigator.setAppBadge(count);
      } else {
        await navigator.clearAppBadge();
      }
    }
  } catch {}
}

// Periodic background sync handler
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "update-badge") {
    event.waitUntil(updateBadge());
  }
});

// Update badge on push notification
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Golden List";
  const options = {
    body: data.body || "Time to reach out to someone!",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/dashboard" },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      updateBadge(),
    ])
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Message handler — allows the app to trigger badge updates
self.addEventListener("message", (event) => {
  if (event.data === "update-badge") {
    event.waitUntil(updateBadge());
  }
});
