import { suspiciousDomains, suspiciousExtensions, defaultUserOptions } from './config.js';
import { getWeekNumber, isSuspiciousDomain, isSuspiciousExtension, showSubtleAlert } from './utils.js';

let userOptions = { ...defaultUserOptions };
const shownDownloadWarnings = new Set();

// Load user options from storage
async function loadUserOptions() {
    try {
        const data = await chrome.storage.sync.get(['userOptions']);
        userOptions = data.userOptions || { ...defaultUserOptions };
    } catch (error) {
        console.error("Error loading user options:", error);
    }
}

// Save user options to storage
async function saveUserOptions() {
    try {
        await chrome.storage.sync.set({ userOptions });
    } catch (error) {
        console.error("Error saving user options:", error);
    }
}

// Mark site as visited
async function markSiteVisited(domain) {
    try {
        await chrome.storage.local.set({
            [domain]: {
                lastVisited: Date.now(),
                date: new Date().getDate()
            }
        });
    } catch (error) {
        console.error("Error marking site visited:", error);
    }
}

// Check if site has been flagged today
async function hasSiteBeenFlaggedToday(domain) {
    try {
        const data = await chrome.storage.local.get([domain]);
        const visitData = data[domain];
        return visitData && visitData.date === new Date().getDate();
    } catch (error) {
        console.error("Error checking site flags:", error);
        return false;
    }
}

// Mark site as visited this week
async function markSiteVisitedThisWeek(domain) {
    try {
        const thisWeek = getWeekNumber(new Date());
        await chrome.storage.local.set({
            [`${domain}_week`]: {
                week: thisWeek,
                timestamp: Date.now()
            }
        });
    } catch (error) {
        console.error("Error marking weekly visit:", error);
    }
}

// Check if site has been flagged this week
async function hasSiteBeenFlaggedThisWeek(domain) {
    try {
        const data = await chrome.storage.local.get([`${domain}_week`]);
        const weekData = data[`${domain}_week`];
        return weekData && weekData.week === getWeekNumber(new Date());
    } catch (error) {
        console.error("Error checking weekly flags:", error);
        return false;
    }
}

// Check URL and show alert if necessary
async function checkUrlAndShowAlert(url, tabId) {
    if (userOptions.alertFrequency === 'never') return;

    try {
        const parsedUrl = new URL(url);
        const domain = parsedUrl.hostname;

        const bypassUntil = userOptions.bypassWarningsUntil[domain];
        if (bypassUntil && bypassUntil > Date.now()) return;

        if (isSuspiciousDomain(url, userOptions, suspiciousDomains)) {
            const shouldShow = userOptions.alertFrequency === 'always' ||
                (userOptions.alertFrequency === 'daily' && !(await hasSiteBeenFlaggedToday(domain))) ||
                (userOptions.alertFrequency === 'weekly' && !(await hasSiteBeenFlaggedThisWeek(domain)));

            if (shouldShow) {
                const alertMessage = `Warning: This website (${domain}) is flagged as potentially suspicious. Attackers are using popular legitimate domains for phishing, C&C, exfiltration, and downloading malicious tools to evade detection. Proceed with caution.`;
                await showSubtleAlert(alertMessage, tabId);

                if (userOptions.alertFrequency === 'daily') {
                    await markSiteVisited(domain);
                } else if (userOptions.alertFrequency === 'weekly') {
                    await markSiteVisitedThisWeek(domain);
                }
            }
        }
    } catch (error) {
        console.error("Error in checkUrlAndShowAlert:", error);
    }
}

// Update the icon for a specific tab
async function updateTabIcon(tabId) {
    try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.url) {
            const isSuspicious = isSuspiciousDomain(tab.url, userOptions, suspiciousDomains);
            const iconPath = isSuspicious
                ? {
                    "16": "icons/icon-warning-svg.png",
                    "48": "icons/icon-warning-svg.png",
                    "128": "icons/icon-warning-svg.png"
                }
                : {
                    "16": "icons/icon-svg.png",
                    "48": "icons/icon-svg.png",
                    "128": "icons/icon-svg.png"
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

// Show warning popup for downloads
async function showWarningPopup(downloadItem) {
    const uniqueDownloadId = `${downloadItem.url}-${downloadItem.filename}`;

    if (shownDownloadWarnings.has(uniqueDownloadId)) return;

    shownDownloadWarnings.add(uniqueDownloadId);

    const urlParams = new URLSearchParams({
        url: downloadItem.url,
        filename: downloadItem.filename,
        downloadId: downloadItem.id.toString()
    });

    try {
        await chrome.tabs.create({
            url: `popup.html?${urlParams.toString()}`,
            active: true
        });
    } catch (error) {
        console.error("Error showing warning popup:", error);
        await chrome.downloads.resume(downloadItem.id).catch(console.error);
    }
}

// Main extension logic
(async () => {
    await loadUserOptions();

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url) {
            await updateTabIcon(tabId);
            await checkUrlAndShowAlert(tab.url, tabId);
        }
    });

    chrome.tabs.onActivated.addListener(async (activeInfo) => {
        await updateTabIcon(activeInfo.tabId);
    });

    chrome.downloads.onCreated.addListener(async (downloadItem) => {
        if (isSuspiciousDomain(downloadItem.url, userOptions, suspiciousDomains) || 
            isSuspiciousExtension(downloadItem.filename, userOptions, suspiciousExtensions)) {
            try {
                await chrome.downloads.pause(downloadItem.id);
                await showWarningPopup(downloadItem);
            } catch (error) {
                console.error("Error handling suspicious download:", error);
            }
        }
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        const handlers = {
            async continueDownload() {
                try {
                    await chrome.downloads.resume(request.downloadId);
                    sendResponse({ success: true });
                } catch (error) {
                    console.error("Error continuing download:", error);
                    sendResponse({ success: false, error: error.message });
                }
            },
            async cancelDownload() {
                try {
                    await chrome.downloads.cancel(request.downloadId);
                    sendResponse({ success: true });
                } catch (error) {
                    console.error("Error canceling download:", error);
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
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs.length > 0) {
                    await updateTabIcon(tabs[0].id);
                }
                sendResponse({ success: true });
            },
            async openOptionsPage() {
                await chrome.runtime.openOptionsPage();
                sendResponse({ success: true });
            }
        };

        const handler = handlers[request.action];
        if (handler) {
            handler();
            return true; // Keep the message channel open for async response
        }
    });
})();

chrome.runtime.onInstalled.addListener(async () => {
    try {
        await chrome.action.setIcon({
            path: {
                "16": "icons/icon-svg.png",
                "48": "icons/icon-svg.png",
                "128": "icons/icon-svg.png"
            }
        });
    } catch (error) {
        console.error("Error setting default icon:", error);
    }
});
