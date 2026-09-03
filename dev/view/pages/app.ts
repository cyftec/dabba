if ("serviceWorker" in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) return;
    location.reload();
  });

  void navigator.serviceWorker
    .register("/service-worker.js", { updateViaCache: "none" })
    .then((registration) => {
      void registration.update();

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          void registration.update();
        }
      });
    });
}
