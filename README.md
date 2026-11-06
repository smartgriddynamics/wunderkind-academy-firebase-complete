# Wunderkind Academy — Firebase website

This project uses **real Firebase Authentication and Cloud Firestore**. There are no demo admin credentials or browser-local application records.

## Setup

1. The main Wunderkind Academy site uses Firebase project `analyticsbook-c4e8f`. Enable **Authentication → Sign-in method → Email/Password** and add `wunderkindsacademyschool.org` under **Authentication → Settings → Authorized domains**.
2. Create a **Cloud Firestore database** in production mode. The site explicitly connects to the `(default)` Firestore database, matching the database selected by its original `getFirestore(app)` configuration. The Admin SDK setup script also targets `(default)` and prints the database ID; it does not select or create another database. Enable Cloud Storage and create its bucket. Confirm billing is enabled on the project's pay-as-you-go plan.
3. Use the private Admin SDK script to grant/revoke an administrator. Install dependencies with `npm install`, install the Google Cloud CLI, and authenticate an account that has Firebase Authentication and Firestore permissions in `analyticsbook-c4e8f`:
   ```powershell
   gcloud auth application-default login
   $env:FIREBASE_BOOTSTRAP_CONFIRM = "analyticsbook-c4e8f"
   $env:FIREBASE_ADMIN_EMAIL = "your-admin@example.com"
   $env:FIREBASE_ADMIN_ACTION = "grant"
   npm run firebase:admin
   ```
   The command creates the Auth user without a password if needed and creates `admins/{uid}` with `active: true`; it does not overwrite existing admin metadata. For a newly created Auth account, use **Forgot password?** at `/account` to set its password. To revoke access, set `FIREBASE_ADMIN_ACTION` to `"revoke"` and rerun. The script requires the explicit project confirmation and must never be shipped in the public website or run with credentials exposed.
4. Deploy the Firestore and Storage rules: `firebase login`, then `firebase deploy --project analyticsbook-c4e8f --only firestore:rules,storage`. **Do not deploy without these rules**. Never allow the public to read applications, messages, or uploaded documents. No composite indexes are required by the current queries; Firestore supplies the required single-field indexes automatically.
5. Configure bucket CORS so the admin dashboard can securely download documents through the authenticated Firebase SDK: `gcloud storage buckets update gs://analyticsbook-c4e8f.firebasestorage.app --cors-file=storage.cors.json`. The supplied CORS file allows the school domain and local Vite development origins on ports 5173 and 5175, and allows the Firebase SDK's auth and upload headers/methods.
6. Run `npm run dev`. Families create an email/password account at `/account` or `/apply`; their UID-keyed `applicantAccounts` profile is created on registration/sign-in. Each application requires the student's passport document, both sides of the birth certificate, and passport-size image photos of the mother and father. Documents may be images or PDFs up to 10 MB; parent photos must be images, and mobile users can take photos. Admins sign in at `/admin`, add a separate payment control number to each student's application, and download each application as a student-named ZIP containing `application-info.pdf` and an `images` folder with the uploaded documents. Applicants can see the number saved for their own application in their account. Admins can also review applications and publish school news and events.
7. **Deploy to GitHub Pages:** In the GitHub repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**. Push to `main` to run the included deployment workflow. The site is configured for the custom domain in `CNAME` and is published at `https://wunderkindsacademyschool.org/`; the admin page is at `https://wunderkindsacademyschool.org/admin`. GitHub Pages does not provide Firestore or Firebase services; configure Firebase and its security rules as described above.

## Firestore data model

Firestore creates a collection when the first legitimate document is written; empty collection names cannot be created independently. This site uses:

| Collection | Created by | Purpose |
| --- | --- | --- |
| `admins` | Private `npm run firebase:admin` grant action | UID-keyed admin access; only an authorized Admin SDK process can grant or revoke access. |
| `applicantAccounts` | Applicant registration/sign-in | UID-keyed profile with email, creation time, and the non-privileged `user` role. Existing profiles are not overwritten. |
| `applications` | Signed-in application form | Applicant-owned application details, status, and private passport/birth-certificate front/back Storage paths. |
| `messages` | Public contact form | Messages submitted to the school. |
| `news`, `events` | Admin dashboard | School content; drafts and published records are created only when staff actually save them. |

The site does not use generic `users`, `settings`, `notifications`, or `activityLogs` collections. It does not generate fake applicants, messages, news, or events to make Firestore look populated. There are no composite indexes currently required; Firestore's default single-field indexes cover the site's queries.

The separate static `public/ibebank/` mini-app uses a different Firebase project (`minibank-b76d6`) and its own finance-related collections. The Academy setup script intentionally does not touch that project or its data.

To use Firebase Hosting instead, configure Firebase CLI and run `npm run build` followed by `firebase deploy --only hosting`. Firebase Hosting serves the SPA and `/admin` route.

## Photos

Place your own school photos in `public/images/`, using filenames listed in `public/images/README.md`. Images are **not included** in the source package. Until added, those photo areas will not show school photos.

## Security and operational notes

- The Firebase config in `src/firebase.js` is a public web app identifier, **not** an admin password. Actual authorization is enforced by Firestore and Storage rules and the `admins/{uid}` record.
- The Admin SDK script requires trusted Google Cloud Application Default Credentials from a project administrator. Never deploy or expose Admin SDK credentials to the browser or commit them to the repository.
- Applicant accounts and applications require Email/Password Authentication, Firestore, Cloud Storage, and both included rulesets deployed to `analyticsbook-c4e8f`. Rules restrict families to their own applications and documents; administrators must have an active `admins/{uid}` record to review documents. Firebase services cannot be provisioned by this ZIP file alone.
- If an upload reports `storage/unauthorized`, deploy the Storage rules with `firebase deploy --project analyticsbook-c4e8f --only storage` and confirm that the project's Cloud Storage bucket has been created.
- Passport and birth-certificate files contain sensitive personal information. Restrict administrator accounts, use the rules as written, and establish an appropriate retention/deletion policy before collecting real applicants' files.
- Consider enabling Firebase App Check, spam protection/rate limiting, backups, privacy policy, and retention/deletion procedures before production launch, especially because student information is sensitive.
- Firestore stores applications and messages; no email is automatically sent to staff. You can add Cloud Functions or an email provider for notifications.
- The contact form stores messages in Firestore. A message review inbox is not included in this version; staff can view them in Firestore Console.
