# Deploys the static Astro build to Cloudflare Pages.
# Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment.
$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

if (-not $env:CLOUDFLARE_API_TOKEN) {
  throw 'CLOUDFLARE_API_TOKEN is not set in the environment.'
}

Write-Output '--- building ---'
npm run build
if ($LASTEXITCODE -ne 0) { throw 'build failed' }

Write-Output '--- deploying to Cloudflare Pages ---'
npx wrangler pages deploy dist --project-name sliding-puzzle-solver --branch master --commit-dirty true
if ($LASTEXITCODE -ne 0) { throw 'deploy failed' }
Write-Output '--- deploy complete ---'
