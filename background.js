import { suspiciousDomains, suspiciousExtensions, defaultUserOptions } from './config.js';
import { getWeekNumber, isSuspiciousDomain, isSuspiciousExtension, showSubtleAlert } from './utils.js';

let userOptions = { ...defaultUserOptions };
const shownDownloadWarnings = new Set();

const educationalResources = [
    {
        title: "Understanding Phishing Attacks",
        url: "https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams"
    },
    {
        title: "Malware Prevention Tips",
        url: "https://consumer.ftc.gov/articles/malware-how-protect-against-detect-and-remove-it"
    },
    {
        title: "Safe Browsing Practices",
        url: "https://www.techtarget.com/searchsecurity/definition/malware"
    },
    {
        title: "Scan files with VirusTotal",
        url: "https://www.virustotal.com/gui/home/upload"
    }
];

async function loadUserOptions() {
    try {
        const data = await chrome.storage.sync.get(['userOptions']);
        userOptions = data.userOptions || { ...defaultUserOptions };
        if (!userOptions.bypassWarningsUntil) {
            userOptions.bypassWarningsUntil = {};
        }
    } catch (error) {
        console.error("Error loading user options:", error);
    }
}

async function saveUserOptions() {
    try {
        await chrome.storage.sync.set({ userOptions });
    } catch (error) {
        console.error("Error saving user options:", error);
    }
}

async function isDismissedToday(domain) {
    try {
        const data = await chrome.storage.local.get(['dismissedWarnings']);
        const dismissedWarnings = data.dismissedWarnings || {};
        const dismissedTime = dismissedWarnings[domain];
        if (dismissedTime) {
            const now = new Date();
            const dismissedDate = new Date(dismissedTime);
            return now.toDateString() === dismissedDate.toDateString();
        }
        return false;
    } catch (error) {
        console.error("Error checking dismissed warnings:", error);
        return false;
    }
}

async function setDismissedWarning(domain) {
    try {
        const data = await chrome.storage.local.get(['dismissedWarnings']);
        const dismissedWarnings = data.dismissedWarnings || {};
        dismissedWarnings[domain] = Date.now();
        await chrome.storage.local.set({ dismissedWarnings });
    } catch (error) {
        console.error("Error setting dismissed warning:", error);
    }
}

async function checkUrlAndShowAlert(url, tabId) {
    if (!userOptions || userOptions.alertFrequency === 'never') return;

    try {
        const parsedUrl = new URL(url);
        const domain = parsedUrl.hostname;

        if (domain === 'chrome.google.com' && parsedUrl.pathname.startsWith('/webstore')) {
            return;
        }

        if (!userOptions.bypassWarningsUntil) {
            userOptions.bypassWarningsUntil = {};
        }

        const bypassUntil = userOptions.bypassWarningsUntil[domain];
        if (bypassUntil && bypassUntil > Date.now()) return;

        if (!userOptions.trustedDomains) {
            userOptions.trustedDomains = [];
        }

        const suspiciousDomainResult = isSuspiciousDomain(url, userOptions, suspiciousDomains);

        if (!userOptions.trustedDomains.includes(domain) && suspiciousDomainResult && !(await isDismissedToday(domain))) {
            const alertMessage = `Warning: This website (${domain}) or one of its subdomains is flagged as potentially suspicious. Attackers may use it for phishing or malware distribution. Proceed with caution.`;
            await showSubtleAlert(alertMessage, tabId);
        }
    } catch (error) {
        console.error("Error in checkUrlAndShowAlert:", error);
    }
}

async function updateTabIcon(tabId) {
    try {
        const tab = await chrome.tabs.get(tabId);
        if (tab && tab.url) {
            const domain = new URL(tab.url).hostname;
            const suspiciousDomainResult = isSuspiciousDomain(tab.url, userOptions, suspiciousDomains);
            const iconPath = suspiciousDomainResult
                ? {
                    "16": "icons/icon-warning-svg.png",
                    "48": "icons/icon-warning-svg.png",
                    "128": "icons/icon-warning-svg.png"
                }
                : {
                    "16": "icons/icon16.png",
                    "48": "icons/icon48.png",
                    "128": "icons/icon128.png"
                };

            await chrome.action.setIcon({
                tabId: tabId,
                path: iconPath
            });
        }
    } catch (error) {
        console.error("Error updating tab icon:", error);
    }
}

async function showWarningPopup(downloadItem) {
    const uniqueDownloadId = `${downloadItem.url}-${downloadItem.filename}`;

    if (shownDownloadWarnings.has(uniqueDownloadId)) return;

    shownDownloadWarnings.add(uniqueDownloadId);

    let url, domain;
    if (downloadItem.url.startsWith('blob:')) {
        url = new URL(downloadItem.referrer);
        domain = url.hostname;
    } else {
        url = new URL(downloadItem.url);
        domain = url.hostname;
    }

    const fileExtension = downloadItem.filename.split('.').pop().toLowerCase();
    
    const isDomainSuspicious = isSuspiciousDomain(url.href, userOptions, suspiciousDomains);
    const isExtensionSuspicious = isSuspiciousExtension(fileExtension, userOptions, suspiciousExtensions);

    const urlParams = new URLSearchParams({
        url: downloadItem.url,
        referrer: downloadItem.referrer,
        filename: downloadItem.filename,
        downloadId: downloadItem.id.toString(),
        suspiciousDomain: isDomainSuspicious.toString(),
        suspiciousExtension: isExtensionSuspicious.toString()
    });

    try {
        await chrome.tabs.create({
            url: `popup.html?${urlParams.toString()}`,
            active: true
        });
    } catch (error) {
        console.error("Error showing warning popup:", error);
    }
}

function exportOptions() {
    const exportData = JSON.stringify(userOptions);
    const blob = new Blob([exportData], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({
        url: url,
        filename: 'safe_browsing_guard_options.json'
    });
}

async function importOptions(fileContent) {
    try {
        const importedOptions = JSON.parse(fileContent);
        userOptions = { ...defaultUserOptions, ...importedOptions };
        await saveUserOptions();
        return { success: true, message: "Options imported successfully" };
    } catch (error) {
        console.error("Error importing options:", error);
        return { success: false, message: "Failed to import options" };
    }
}

(async () => {
    await loadUserOptions();

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
            updateTabIcon(tabId).catch(console.error);
            checkUrlAndShowAlert(tab.url, tabId).catch(console.error);
        }
    });

    chrome.tabs.onActivated.addListener((activeInfo) => {
        chrome.tabs.get(activeInfo.tabId).then(tab => {
            if (tab.url && tab.url.startsWith('http')) {
                updateTabIcon(activeInfo.tabId).catch(console.error);
                checkUrlAndShowAlert(tab.url, activeInfo.tabId).catch(console.error);
            }
        }).catch(console.error);
    });

    chrome.downloads.onCreated.addListener((downloadItem) => {
        try {
            if (downloadItem.url.startsWith('blob:')) {
                const referrerUrl = new URL(downloadItem.referrer);
                const domain = referrerUrl.hostname;
                const fileExtension = downloadItem.filename.split('.').pop().toLowerCase();
                
                const isDomainSuspicious = isSuspiciousDomain(referrerUrl.href, userOptions, suspiciousDomains);
                const isExtensionSuspicious = isSuspiciousExtension(fileExtension, userOptions, suspiciousExtensions);

                if (isDomainSuspicious || isExtensionSuspicious) {
                    chrome.downloads.pause(downloadItem.id).then(() => {
                        showWarningPopup(downloadItem).catch(console.error);
                    }).catch(console.error);
                }
            } else {
                const url = new URL(downloadItem.url);
                const domain = url.hostname;
                const fileExtension = downloadItem.filename.split('.').pop().toLowerCase();
                
                const isDomainSuspicious = isSuspiciousDomain(downloadItem.url, userOptions, suspiciousDomains);
                const isExtensionSuspicious = isSuspiciousExtension(fileExtension, userOptions, suspiciousExtensions);

                if (isDomainSuspicious || isExtensionSuspicious) {
                    chrome.downloads.pause(downloadItem.id).then(() => {
                        showWarningPopup(downloadItem).catch(console.error);
                    }).catch(console.error);
                }
            }
        } catch (error) {
            console.error("Error handling download:", error);
        }
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        const handlers = {
            async continueDownload() {
                try {
                    await chrome.downloads.resume(request.downloadId);
                    sendResponse({ success: true });
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
            },
            async cancelDownload() {
                try {
                    const downloadItem = await chrome.downloads.search({id: request.downloadId});
                    if (downloadItem.length > 0) {
                        await chrome.downloads.cancel(request.downloadId);
                        if (downloadItem[0].filename) {
                            await chrome.downloads.removeFile(request.downloadId);
                        }
                        sendResponse({ success: true });
                    } else {
                        sendResponse({ success: false, error: "Download not found" });
                    }
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
            },
            async bypassWarnings() {
                const domain = request.domain;
                userOptions.bypassWarningsUntil[domain] = Date.now() + (24 * 60 * 60 * 1000);
                await saveUserOptions();
                sendResponse({ success: true });
            },
            async updateUserOptions() {
                userOptions = request.options;
                await saveUserOptions();
                chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
                    if (tabs.length > 0) {
                        updateTabIcon(tabs[0].id).catch(console.error);
                        checkUrlAndShowAlert(tabs[0].url, tabs[0].id).catch(console.error);
                    }
                }).catch(console.error);
                sendResponse({ success: true });
            },
            async openOptionsPage() {
                await chrome.runtime.openOptionsPage();
                sendResponse({ success: true });
            },
            getEducationalResources() {
                sendResponse({ success: true, resources: educationalResources });
            },
            exportOptions() {
                exportOptions();
                sendResponse({ success: true });
            },
            async importOptions() {
                const result = await importOptions(request.fileContent);
                sendResponse(result);
            },
            async dismissWarning() {
                if (sender.tab && sender.tab.url) {
                    const domain = new URL(sender.tab.url).hostname;
                    await setDismissedWarning(domain);
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: "Unable to determine the domain" });
                }
            }
        };

        const handler = handlers[request.action];
        if (handler) {
            handler();
            return true; // Keep the message channel open for async response
        }
    });
})();

chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setIcon({
        path: {
            "16": "icons/icon16.png",
            "48": "icons/icon48.png",
            "128": "icons/icon128.png"
        }
    }).catch(console.error);
});

chrome.action.onClicked.addListener((tab) => {
    chrome.runtime.openOptionsPage().catch(console.error);
});
