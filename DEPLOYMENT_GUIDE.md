# Deployment Guide for CJR Survey on Netlify

## Prerequisites
- GitHub repository connected to Netlify
- Netlify account with the site deployed

## Setup Steps

### 1. Deploy to Netlify
Push all the changes to your GitHub repository:
```bash
git add .
git commit -m "Add Netlify Functions for server-side authentication"
git push origin main
```

### 2. Configure Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Select your site (cjr-survey9925)
3. Navigate to **Site configuration** → **Environment variables**
4. Click **Add a variable**
5. Add the following variable:
   - **Key**: `SURVEY_PASSWORDS`
   - **Value**: Your comma-separated passwords (e.g., `SecurePass123,AnotherPass456,ThirdPass789`)
   - **Scopes**: Select all deployment contexts

### 3. Verify Functions are Enabled

1. In Netlify dashboard, go to **Site configuration** → **Functions**
2. Ensure the functions directory is set to `netlify/functions`
3. After deployment, you should see `authenticate` function listed

### 4. Test the Deployment

1. Visit your site: https://cjr-survey9925.netlify.app/
2. Try logging in with one of your configured passwords
3. Check the **Functions** tab in Netlify dashboard to see function logs

## File Structure Required

```
/
├── index.html
├── script.js
├── styles.css
├── package.json
├── netlify.toml
└── netlify/
    └── functions/
        └── authenticate.js
```

## Troubleshooting

### Function not working?
1. Check **Functions** logs in Netlify dashboard
2. Ensure environment variable `SURVEY_PASSWORDS` is set
3. Verify the function shows up in the Functions tab
4. Check browser console for specific error messages

### CORS errors?
- The netlify.toml file includes CORS headers
- The function also handles OPTIONS requests for preflight

### Authentication failing?
1. If no environment variable is set, the default password is: `DefaultPassword2025`
2. Passwords are case-sensitive
3. Make sure there are no extra spaces in the environment variable

## Security Notes

- Never commit passwords to the repository
- Use strong, unique passwords
- Regularly rotate passwords by updating the environment variable
- Consider implementing rate limiting for production use
- Monitor function logs for unauthorized access attempts

## Default Behavior

If `SURVEY_PASSWORDS` environment variable is not set, the function will use `DefaultPassword2025` as the default password. This is only for testing - always set proper passwords in production!