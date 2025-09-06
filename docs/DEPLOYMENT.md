# Web Data Extractor - Deployment Guide

This document describes the deployment system for the Web Data Extractor bookmarklet.

## Overview

The Web Data Extractor uses a sophisticated deployment system that includes:

- **Bookmarklet Wrapper**: A JavaScript loader that injects the main application
- **Script Caching**: Intelligent caching to avoid repeated downloads
- **Version Checking**: Automatic update detection
- **GitHub Pages Hosting**: Automated deployment via GitHub Actions
- **Development Server**: Local testing environment

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Bookmarklet   │───▶│   Loader Script  │───▶│   Main App      │
│   (Browser)     │    │   (Cached)       │    │   (Downloaded)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Version Check  │
                       │   (Auto-update)  │
                       └──────────────────┘
```

## Files Structure

```
dist/
├── web-data-extractor.min.js    # Main application script
├── web-data-extractor.min.css   # Application styles
├── bookmarklet.html             # Installation page
├── bookmarklet.js               # Bookmarklet loader code
├── bookmarklet-url.txt          # Raw bookmarklet URL
├── version.json                 # Version information
├── index.html                   # Redirect to installation
└── README.md                    # Deployment documentation
```

## Development Workflow

### 1. Local Development

Start the development server:

```bash
npm run dev
```

This will:
- Generate placeholder scripts for testing
- Start a local server at `http://localhost:3000`
- Serve the bookmarklet installation page
- Watch for changes and regenerate files

### 2. Testing the Bookmarklet

1. Visit `http://localhost:3000/bookmarklet.html`
2. Drag the bookmarklet to your browser's bookmark bar
3. Visit any webpage (e.g., `https://example.com`)
4. Click the bookmarklet to test the loader
5. The placeholder script will show notifications confirming it works

### 3. Building for Production

Generate production files:

```bash
npm run build:bookmarklet
```

Or build everything including the main app:

```bash
npm run build:all
```

## Deployment Options

### Option 1: GitHub Pages (Recommended)

The repository includes a GitHub Actions workflow that automatically:

1. **Builds** the application on every push to main/master
2. **Tests** the bookmarklet generation
3. **Deploys** to GitHub Pages
4. **Updates** the version information

**Setup:**

1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. Push to main/master branch
4. The site will be available at: `https://username.github.io/repository-name`

**Configuration:**

The workflow automatically sets the base URL based on your repository:
```
https://[username].github.io/[repository-name]
```

### Option 2: Custom Hosting

For custom hosting (CDN, own server, etc.):

1. Build the files:
   ```bash
   BASE_URL=https://your-domain.com/path npm run build:bookmarklet
   ```

2. Upload the `dist/` folder contents to your server

3. Ensure the following files are accessible:
   - `web-data-extractor.min.js`
   - `web-data-extractor.min.css`
   - `version.json`
   - `bookmarklet.html`

### Option 3: Manual Deployment

1. Generate files with your base URL:
   ```bash
   node src/bookmarklet/generator.js https://your-domain.com/extractor
   ```

2. Upload files to your hosting provider

3. Test the installation page

## Version Management

### Automatic Updates

The bookmarklet includes automatic update checking:

- **Cache Duration**: 24 hours by default
- **Version Check**: Compares local cache with `version.json`
- **Smart Loading**: Uses cache when possible, downloads when needed
- **Fallback**: Works offline with cached version

### Version File Format

```json
{
  "version": "commit-hash-or-version",
  "timestamp": "2024-01-01T00:00:00Z",
  "buildDate": "01/01/2024",
  "files": {
    "script": "web-data-extractor.min.js",
    "css": "web-data-extractor.min.css",
    "bookmarklet": "bookmarklet.html"
  },
  "changelog": [
    {
      "version": "1.0.0",
      "date": "01/01/2024",
      "changes": [
        "Initial release",
        "Contact extraction functionality",
        "CSV export feature"
      ]
    }
  ]
}
```

## Configuration

### Environment Variables

- `BASE_URL`: Base URL for hosted files
- `PORT`: Development server port (default: 3000)
- `GITHUB_PAGES`: Enable GitHub Pages deployment

### Build Configuration

The build system supports:

- **Custom Base URLs**: Set via environment variable or CLI argument
- **Minification**: Automatic code minification for bookmarklets
- **Cache Busting**: Timestamp-based cache invalidation
- **Error Handling**: Comprehensive error handling and user feedback

## Security Considerations

### Content Security Policy (CSP)

The bookmarklet may be blocked by strict CSP policies. Common issues:

- `script-src 'unsafe-inline'` required for bookmarklet execution
- `connect-src` must allow the hosting domain
- `style-src 'unsafe-inline'` needed for injected styles

### Cross-Origin Requests

The loader makes CORS requests to:
- Load the main script
- Load CSS files
- Check version information

Ensure your hosting supports CORS or serves appropriate headers.

### Browser Compatibility

Tested browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Known limitations:
- Some corporate firewalls may block external script loading
- Very old browsers may not support modern JavaScript features

## Troubleshooting

### Common Issues

**Bookmarklet doesn't work:**
- Check browser console for errors
- Verify the hosting URL is accessible
- Test with a simple webpage first

**Scripts fail to load:**
- Check CORS headers on hosting server
- Verify file paths and URLs
- Test the version.json endpoint

**Cache issues:**
- Clear browser cache and localStorage
- Check if version.json is updating
- Verify cache duration settings

### Debug Mode

Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('web-data-extractor-debug', 'true');
```

### Testing Checklist

- [ ] Bookmarklet installs correctly
- [ ] Loader script executes without errors
- [ ] Main application loads and initializes
- [ ] Version checking works
- [ ] Cache system functions properly
- [ ] Error handling displays user-friendly messages
- [ ] Installation page renders correctly
- [ ] All file paths resolve correctly

## Performance Optimization

### Bookmarklet Size

Current optimizations:
- **Minification**: Removes comments and unnecessary whitespace
- **String Protection**: Preserves string contents during minification
- **Compression**: URL encoding for browser compatibility

Target size: < 10KB (current: ~10KB)

### Caching Strategy

- **Local Storage**: Caches scripts for 24 hours
- **Version Checking**: Only downloads when version changes
- **Fallback**: Uses cache if version check fails
- **Cleanup**: Removes old cache entries automatically

### Loading Performance

- **Parallel Loading**: Scripts and CSS load simultaneously
- **Timeout Handling**: 10-second timeout for downloads
- **Progress Feedback**: Loading notifications for users
- **Error Recovery**: Graceful fallback on network issues

## Monitoring and Analytics

### Error Tracking

The system logs errors to browser console:
- Network failures
- Script execution errors
- Version check failures
- Cache operation errors

### Usage Metrics

Consider adding analytics to track:
- Bookmarklet installation rates
- Script load success/failure rates
- Version update frequency
- Browser compatibility issues

## Future Enhancements

Planned improvements:
- **Smaller Bookmarklet**: Further size optimization
- **Progressive Loading**: Load features on demand
- **Offline Support**: Service worker for offline functionality
- **A/B Testing**: Multiple bookmarklet versions
- **Analytics Integration**: Usage tracking and metrics
- **Auto-update Notifications**: User notifications for updates

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Test with the development server
4. Verify hosting configuration
5. Check GitHub Actions logs (for GitHub Pages)

For development questions:
- Review the source code in `src/bookmarklet/`
- Check the test files in `src/test/bookmarklet.test.ts`
- Run the development server for local testing