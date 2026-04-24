# Project Instructions

This project is deployed on Vercel.

## Vercel Debug Workflow
When debugging deployment or domain issues:
1. Use the Vercel MCP tools first.
2. Check the latest production deployment.
3. Verify:
   - project name
   - production branch
   - deployed commit SHA
   - root directory
   - framework preset
   - output directory
   - domain status
4. If there is a 404:
   - test the default `.vercel.app` URL first
   - then test the custom domain
   - determine whether the issue is deployment-related or DNS/domain-related
5. Never assume Vercel settings are correct without checking them.

## Safety Rules
- Never hardcode secrets or tokens into files.
- Never commit tokens to git.
- If environment variables are needed, tell me exactly which variable to set locally.
