# JubaOne — Static site + Admin panel (Firebase-ready)

This repository is a lightweight responsive site plus an admin panel that connects to Firebase (Firestore, Storage, Auth). The public site uses the bundled seed data (data/initial_data.json). The admin panel lets you manage articles, authors, legal pages, and site settings.

## What you get
- Public site: index.html, article.html, category.html
- Admin panel: admin.html (requires Firebase config)
- Seed data: data/initial_data.json (10 articles, each >= 800 words)
- Legal pages (Privacy, Terms, Cookie, DMCA, About)
- Instructions to connect to Firebase

## Firebase setup (quick)
1. Create a Firebase project at https://console.firebase.google.com/.
2. Enable Firestore (native mode).
3. Enable Firebase Storage.
4. Enable Authentication (Email/Password or Google).
5. Create at least one user (your admin).
6. To set roles (admin/moderator/author) you must set custom claims. You can do this with the Firebase Admin SDK or via Cloud Functions. Example (Node.js Admin SDK):
   - Initialize the Admin SDK with a service account and run:
     ```
     admin.auth().setCustomUserClaims(uid, { role: 'admin' });
     ```
7. In the admin panel (open admin.html), paste your Firebase config (found in Project Settings → SDK) into the Firebase Config textarea and click Save Config.
8. Sign in with your admin user in the admin panel.
9. Optionally click "Load seed data" to write the bundled articles into Firestore's `articles` collection.

## Firestore structure (recommended)
- collection: articles
  - doc-id: slug or uuid
  - fields: title, slug, author, date, categories (array), flags (array), excerpt, content (HTML), featuredImage (url), views (number)
- collection: authors
  - name, email, role, bio, avatar
- collection: site -> document: settings
  - topBanner, footerText
- collection: legal -> document: privacy|terms|cookie|dmca|about -> { content }

## Storage
- uploads/ - uploaded images and files. Admin UI stores uploaded files and saves download URL in article.featuredImage or in content.

## AdSense-ready legal pages
- Privacy Policy, Terms, Cookie Policy and DMCA are included in `legal/` and can be edited in Admin.

## Next steps
- Host static files (Netlify, Vercel, GitHub Pages). If you use Firebase Hosting, follow Firebase docs and deploy.
- Use Cloud Functions to automate custom claims or an admin-only UI for role assignment.
- Replace local data-based client logic in `app.js` with Firestore queries once hosted and seeded.

If you want, I can:
- Convert this scaffold into a GitHub repository and open a PR (provide repo owner/name).
- Implement server-side role assignment automation (Cloud Functions) so you can create users in-app.
- Add optional React/Vue frontend if you prefer an SPA.
