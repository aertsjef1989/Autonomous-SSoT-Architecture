set -euo pipefail

# 1. Move Next.js Vercel app files into dedicated sibling directory
mkdir -p ../portfolio-vercel-hub/supabase
for item in src next.config.mjs API_KEYS_SETUP_GUIDE.md; do
  [ -e "$item" ] && mv "$item" ../portfolio-vercel-hub/
done
[ -d supabase ] && cp -r supabase/* ../portfolio-vercel-hub/supabase/ && rm -rf supabase
[ -f .env.example ] && mv .env.example ../portfolio-vercel-hub/

# Create clean Next.js package.json in ../portfolio-vercel-hub
cat << 'PKG' > ../portfolio-vercel-hub/package.json
{
  "name": "portfolio-vercel-hub",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  }
}
PKG

# 2. Restore HonKit package.json from last clean HonKit commit
CLEAN_HASH=$(git log --grep="Step 5 & 6" -n 1 --format="%H")
if [ -n "$CLEAN_HASH" ]; then
  git checkout "$CLEAN_HASH" -- package.json
fi
rm -rf .next node_modules/next

# 3. Strip .html prototype entries from SUMMARY.md so HonKit stops mangling standalone HTML scripts
if [ -f SUMMARY.md ]; then
  grep -v '\.html)' SUMMARY.md > SUMMARY.md.tmp && mv SUMMARY.md.tmp SUMMARY.md
fi

# 4. Verify Leak Gate and HonKit Build
python3 scripts/leak_gate.py
npx honkit build
echo "HonKit repo restored and built with 0 errors."
