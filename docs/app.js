// dev/view/pages/app.ts
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}
