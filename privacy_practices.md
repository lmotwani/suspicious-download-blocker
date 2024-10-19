# Safe Browsing Guard - Privacy Practices and Justifications

## Single Purpose Description
Safe Browsing Guard is a Chrome extension designed to protect users from potentially suspicious domains and downloads. It alerts users when they visit websites or attempt to download files that may pose security risks, enhancing their browsing safety.

## Permission Justifications

### activeTab
This permission is used to access the current tab's URL and show alerts to the user when they visit a suspicious domain. It's essential for real-time protection as the extension needs to know which site the user is currently visiting.

### alarms
Alarms are used to schedule periodic checks of the user's browsing activity and to manage the frequency of alerts. This ensures that the extension can provide timely warnings without overwhelming the user.

### downloads
The downloads permission is necessary to monitor and potentially block suspicious file downloads. It allows the extension to check file types and sources before the download completes, enhancing user security.

### host permission
Host permissions are required to check URLs against our list of suspicious domains. This is crucial for the core functionality of warning users about potentially dangerous websites.

### remote code
The extension does not execute remote code. All functionality is contained within the extension package.

### scripting
Scripting is used to inject the warning alerts into web pages when a suspicious domain is detected. This is necessary to provide immediate, visible feedback to the user about potential risks.

### storage
Storage permissions are used to save user preferences, such as trusted domains and alert frequency settings. This allows the extension to provide a personalized and consistent experience across browsing sessions.

### tabs
The tabs permission is used in conjunction with activeTab to monitor URL changes and update the extension icon accordingly. This is essential for providing real-time protection as users navigate between different websites.

### webRequest
WebRequest is used to intercept and analyze web requests, allowing the extension to check URLs against the suspicious domain list before the page loads. This is crucial for proactive protection against potentially harmful websites.

## Data Usage Compliance
We certify that our data usage complies with the Chrome Web Store developer program policies. The extension:
1. Only collects necessary data for its core functionality of protecting users from suspicious domains and downloads.
2. Does not share or sell user data to any third parties.
3. Processes all data locally on the user's device, enhancing privacy and security.
4. Provides clear options for users to control their data and the extension's behavior through the settings page.

## Screenshots
[Note: At least one screenshot or video demonstrating the extension's functionality needs to be added to the Chrome Web Store listing.]
