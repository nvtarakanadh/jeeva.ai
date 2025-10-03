# Development Troubleshooting Guide

## Blank Screen Issues

If you're experiencing blank screens when running the app locally, follow these steps:

### Quick Fix
```bash
# Clean all caches and restart
npm run dev:clean
```

### Manual Steps

1. **Clear Browser Cache**
   - Open DevTools (F12)
   - Right-click refresh button → "Empty Cache and Hard Reload"
   - Or use Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

2. **Clear Service Workers**
   - Open DevTools → Application tab
   - Go to Service Workers section
   - Click "Unregister" for any registered service workers
   - Refresh the page

3. **Clear Vite Cache**
   ```bash
   # Remove Vite cache
   rm -rf node_modules/.vite
   rm -rf .vite
   rm -rf dist
   
   # Restart dev server
   npm run dev
   ```

4. **Clear Browser Storage**
   - DevTools → Application tab
   - Clear all storage (Local Storage, Session Storage, IndexedDB, etc.)

### What We Fixed

1. **Service Worker Management**
   - Development mode now unregisters all service workers
   - Uses a no-cache development service worker
   - Production still uses full caching service worker

2. **Vite Configuration**
   - Added no-cache headers in development
   - Force re-bundling of dependencies
   - Clean build scripts

3. **Cache Prevention**
   - Automatic cache clearing on dev start
   - Development-specific service worker
   - Proper environment detection

### Scripts Available

- `npm run dev` - Start with cache clearing
- `npm run dev:clean` - Extra clean start
- `npm run clean` - Manual cache clearing

### Still Having Issues?

1. Try incognito/private browsing mode
2. Check browser console for errors
3. Verify all dependencies are installed: `npm install`
4. Check if port 8080 is available
5. Try a different browser

### Environment Variables

Make sure you have the required environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OPENAI_API_KEY` (optional)
