# Safe Browsing Guard - Privacy Practices and Justifications

## Single Purpose Description
Safe Browsing Guard is a Chrome extension designed to protect users from potentially suspicious domains and downloads. It alerts users when they visit websites or attempt to download files that may pose security risks, enhancing their browsing safety.

## Permission Justifications

### storage
Storage permissions are used to save user preferences, such as trusted domains and alert frequency settings, and to keep track of which sites have been flagged. This allows the extension to provide a personalized and consistent experience across browsing sessions. All data is stored locally on the user's device.

### downloads
The downloads permission is necessary to monitor and potentially block suspicious file downloads. It allows the extension to check file types and sources before the download completes, enhancing user security. All checks are performed locally on the user's device.

### scripting
Scripting is used to inject warning alerts into web pages when a suspicious domain is detected. This is necessary to provide immediate, visible feedback to the user about potential risks. These scripts only run on the user's device and do not transmit any data.

### tabs
The tabs permission is used to access tab information, check URLs, and update the extension icon accordingly. This is essential for providing real-time protection as users navigate between different websites. All processing is done locally on the user's device.

### host permissions
Host permissions (http://*/* and https://*/*) are required to check all URLs against our list of suspicious domains. This is crucial for the core functionality of warning users about potentially dangerous websites across their entire browsing experience. All checks are performed locally on the user's device using built-in lists of suspicious domains and file extensions.

## Data Usage Compliance
We certify that our data usage complies with the Chrome Web Store developer program policies. The extension:
1. Only collects necessary data for its core functionality of protecting users from suspicious domains and downloads.
2. Does not share or sell user data to any third parties.
3. Processes all data locally on the user's device, enhancing privacy and security.
4. Provides clear options for users to control their data and the extension's behavior through the settings page.
5. Does not transmit any personal data or browsing history to external servers.

