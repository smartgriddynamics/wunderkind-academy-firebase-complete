# Wunderkind Academy — Firebase website

This project uses **real Firebase Authentication and Cloud Firestore**. There are no demo admin credentials or browser-local application records.

## Setup

1. In Firebase Console for `wunderkind-academy`, enable **Authentication → Sign-in method → Email/Password**.
2. Under **Authentication → Users**, create your admin user with a strong unique password. Copy its **UID**.
3. Create a **Cloud Firestore database** (production mode, choose a nearby region). In the `admins` collection create a document whose **document ID is the admin user's UID**, containing the boolean field `active: true`. Do not store the password in Firestore.
4. Deploy the included Firestore rules using Firebase CLI: `firebase login`, `firebase use wunderkind-academy`, `firebase deploy --only firestore:rules`. You may need `firebase init` first to select this existing Firebase project. **Do not deploy without the rules**. Never allow the public to read applications or messages.
5. Run `npm install` and `npm run dev`. Families create an email/password account at `/account` or `/apply`, then submit applications while signed in. Their responsive `/account` dashboard has overview, applications, new application, and account sections. They can see each child's application status and submitted particulars; academic results entered by staff become visible after approval. Admins sign in at `/admin`; the responsive dashboard has overview, applications, applicant accounts, and news & events sections. Admins can approve/reject/delete applications, manage student results, and create/edit/publish/delete announcements.
6. **Deploy to GitHub Pages:** In the GitHub repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**. Push to `main` to run the included deployment workflow. The site is configured for the custom domain in `CNAME` and is published at `https://wunderkindsacademyschool.org/`; the admin page is at `https://wunderkindsacademyschool.org/admin`. In Firebase Console, add `wunderkindsacademyschool.org` to **Authentication → Settings → Authorized domains** so admin sign-in works on the published site. GitHub Pages does not provide Firestore or Firebase services; configure Firebase and its security rules as described above.

   To use Firebase Hosting instead, configure Firebase CLI and run `npm run build` followed by `firebase deploy --only hosting`. Firebase Hosting serves the SPA and `/admin` route.

## Photos

Place your own school photos in `public/images/`, using filenames listed in `public/images/README.md`. Images are **not included** in the source package. Until added, those photo areas will not show school photos.

## Security and operational notes

- The Firebase config in `src/firebase.js` is a public web app identifier, **not** an admin password. Actual authorization is enforced by Firestore security rules and the `admins/{uid}` record.
- The first admin record must be created manually in the Firebase Console by the project owner; the website cannot grant itself administrator privileges.
- Applicant accounts and application submissions require Email/Password Authentication, a functioning Firestore database, and the included Firestore rules deployed with `firebase deploy --only firestore:rules`. Rules restrict each family to reading only applications linked to its authenticated UID; admins can review all accounts and applications. Firebase services cannot be provisioned by this ZIP file alone.
- Consider enabling Firebase App Check, spam protection/rate limiting, backups, privacy policy, and retention/deletion procedures before production launch, especially because student information is sensitive.
- Firestore stores applications and messages; no email is automatically sent to staff. You can add Cloud Functions or an email provider for notifications.
- The contact form stores messages in Firestore. A message review inbox is not included in this version; staff can view them in Firestore Console.
