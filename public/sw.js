const staticCacheName = 'site-static-v2';
const dynamicCache = 'site-dynamic-v2';
const assets = [
    '/',
    '/index.html',
    '/js/app.js',
    '/js/ui.js',
    '/js/materialize.min.js',
    '/css/style.css',
    '/css/materialize.min.css',
    '/img/dish.png',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://fonts.gstatic.com/s/materialicons/v51/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2',
    '/pages/fallback.html'
];
// install service Worker

self.addEventListener('install',evt=>{
    // console.log('service worker has been installed');
    evt.waitUntil(
    caches.open(staticCacheName).then(cache =>{
        console.log('caching');
        cache.addAll(assets);
    })
    );
});

// activate ServiceWorker

self.addEventListener('activate',evt=>{
    evt.waitUntil(
        caches.keys().then(keys=>{
            // console.log(keys);
            return Promise.all(keys
                .filter(key =>key !==staticCacheName && key !== dynamicCache)
                .map(key =>caches.delete(key))
                )
        })
    );
    // console.log('service worker has been activated');
});
// cachesize limit function

const limitCacheSize = (name,size) =>{
    caches.open(name).then(cache =>{
        cache.keys().then(keys =>{
            if(keys.length >size){
                cache.delete(keys[0]).then(limitCacheSize(name,size));
            }
        })
    })

}

// fetch event

self.addEventListener('fetch',evt=>{
    if(evt.request.url.indexOf('firestore.googleapis.com') === -1){
        evt.respondWith(
            caches.match(evt.request).then(cacheRes =>{
                return cacheRes || fetch(evt.request).then(fetchRes=>{
                    return caches.open(dynamicCache).then(cache =>{
                        cache.put(evt.request.url, fetchRes.clone());
                        limitCacheSize(dynamicCache, 15);
                        return fetchRes;
                    })
                });
            }).catch(()=> {
                if(evt.request.url.indexOf('.html')>-1)
                return caches.match('/pages/fallback.html');
            })
    
        );
    }
});

