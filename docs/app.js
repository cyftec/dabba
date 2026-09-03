// dev/view/pages/app.ts
if ("serviceWorker" in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController)
      return;
    location.reload();
  });
  navigator.serviceWorker.register("/service-worker.js", { updateViaCache: "none" }).then((registration) => {
    registration.update();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        registration.update();
      }
    });
  });
}
