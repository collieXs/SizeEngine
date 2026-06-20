const vaultName = "size-engine-v1";
const filesToSave = [
  "/",                 
  "/app.html",       
  "/style.css",
  "/assets/fonts/orbitron-black.otf",
  "/manifest.json",
  "/sw.js",
  "/js/main.js",
  "/js/register_sw.js"
];

// --- EVENT 1: INSTALL ---
self.addEventListener('install', (event) => {
  console.log('Guard: Building the secret vault...');
  
  event.waitUntil((async () => {
    try {
      const vault = await caches.open(vaultName);
      console.log('Guard: Saving files for offline use...');
      await vault.addAll(filesToSave);
    } catch (error) {
      console.error('Guard failed to save initial files:', error);
    }
  })());
});

// --- EVENT 2: ACTIVATE ---
self.addEventListener('activate', (event) => {
  console.log('Guard: Checking for old dusty vaults...');
  
  event.waitUntil((async () => {
    try {
      const allVaultNames = await caches.keys();
      
      const deletePromises = allVaultNames.map(async (name) => {
        if (name !== vaultName) {
          console.log('Guard: Deleting old vault:', name);
          return await caches.delete(name);
        }
      });
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Guard failed to clean old vaults:', error);
    }
  })());
});

// --- EVENT 3: FETCH ---
self.addEventListener('fetch', (event) => {
  event.respondWith(handleFetch(event.request));
});

async function handleFetch(request) {
  try {
    const savedFile = await caches.match(request);
    
    if (savedFile) {
      console.log('Guard: Grabbed from vault:', request.url);
      return savedFile;
    }

    console.log('Guard: Fetching from web:', request.url);
    return await fetch(request);
    
  } catch (error) {
    console.error('Guard encountered an error fetching asset:', error);
  }
}