# Supabase Configuration for Email Verification

## Problem
When users click the email verification link, they get redirected to `localhost:3000` instead of your Replit app URL.

## Solution
You need to update your Supabase project's redirect URLs to use your Replit app URL.

## Steps to Fix:

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/projects
   - Click on your project

2. **Navigate to Authentication Settings**
   - Click "Authentication" in the left sidebar
   - Click "URL Configuration" 

3. **Update Site URL**
   - Set "Site URL" to your Replit app URL (something like: `https://YOUR-REPL-NAME.YOUR-USERNAME.repl.co`)
   - This should be the main URL where your app is hosted

4. **Add Redirect URLs**
   - In "Redirect URLs" section, add your Replit app URL
   - Format: `https://YOUR-REPL-NAME.YOUR-USERNAME.repl.co/**`
   - The `/**` allows all paths under your domain

5. **Save Changes**
   - Click "Save" to apply the changes

## Finding Your Replit App URL:
- Look at the address bar when viewing your app
- It should look like: `https://something.replit.app` or `https://something.YOUR-USERNAME.repl.co`

After making these changes, new signup confirmation emails will redirect to your Replit app instead of localhost.