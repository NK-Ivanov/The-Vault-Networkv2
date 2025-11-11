# Local Development Options

## Option 1: Use npx (No Installation Needed)
Instead of installing globally, use npx:
```bash
npx netlify-cli dev
```

This will:
- Start your Vite dev server on port 8080
- Start Netlify Functions proxy on port 8888
- Handle CORS automatically
- Use your local `.env` file

## Option 2: Deploy Functions First (Recommended)
Since you're calling the production URL (`https://vaultnet.work`), deploy the functions:

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add CORS headers to Netlify functions"
   git push
   ```

2. **Netlify will auto-deploy** (if connected to GitHub)
   - Or manually trigger deploy in Netlify dashboard

3. **Once deployed**, the CORS headers will allow requests from localhost
   - Your `npm run dev` will work with the production functions

## Option 3: Fix PowerShell PATH (If you want global install)
If you want to use `netlify dev` globally, you may need to restart PowerShell or add npm global bin to PATH:

```powershell
# Check where npm installs global packages
npm config get prefix

# Add to PATH (replace with your actual path)
$env:Path += ";C:\Users\YourUser\AppData\Roaming\npm"
```

## Quick Test
After deploying, try syncing an automation in Admin Dashboard - the CORS error should be gone!

