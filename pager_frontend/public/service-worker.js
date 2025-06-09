self.addEventListener("install",(event)=>{
    console.log("service worker installed")
    self.skipWaiting();
})
self.addEventListener("activate",(event)=>{
    console.log("service worker activated")
})
self.addEventListener("push",(event)=>{
    const data=event.data;
    self.registration.showNotification(data.title,{
        body : data.body,
        icon: "/icon.png",
        badge: "/badge.png"
    })
})
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow("http://localhost:5173")
    );
});
