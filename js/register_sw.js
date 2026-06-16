async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await new Promise(resolve => window.addEventListener('load', resolve));
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Security Guard hired!', registration.scope);
    } catch (error) {
      console.log('Failed to hire the Security Guard:', error);
    }
  }
}

registerServiceWorker();