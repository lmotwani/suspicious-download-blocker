import { suspiciousDomains, suspiciousExtensions, defaultUserOptions } from './config.js';
import { getWeekNumber, isSuspiciousDomain, isSuspiciousExtension, showSubtleAlert } from './utils.js';

let userOptions = { ...defaultUserOptions };
const shownDownloadWarnings = new Set();

async function loadUserOptions() {
    try {
        const data = await chrome.storage.sync.get(['userOptions']);
        userOptions = data.userOptions || { ...defaultUserOptions };
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
                await showSubtleAlert(
                    `This website (${domain}) is flagged as potentially suspicious. Proceed with caution.`,
                    tabId
                );

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

async function updateAllTabIcons() {
    try {
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            if (tab.url) {
                const iconPath = !isSuspiciousDomain(tab.url, userOptions, suspiciousDomains) 
                    ? {
                        "16": "icons/icon-svg.png",
                        "48": "icons/icon-svg.png",
                        "128": "icons/icon-svg.png"
                      }
                    : {
                        "16": "icons/icon-warning-svg.png",
                        "48": "icons/icon-warning-svg.png",
                        "128": "icons/icon-warning-svg.png"
                      };

                await chrome.action.setIcon({
                    tabId: tab.id,
                    path: iconPath
                });
            }
        }
    } catch (error) {
        console.error("Error updating all tab icons:", error);
    }
}

(async () => {
    await loadUserOptions();
    await updateAllTabIcons();

    chrome.downloads.onCreated.addListener(async (downloadItem) => {
        if (isSuspiciousDomain(downloadItem.url, userOptions, suspiciousDomains) && 
            isSuspiciousExtension(downloadItem.filename, userOptions, suspiciousExtensions)) {
            try {
                await chrome.downloads.pause(downloadItem.id);
                await showWarningPopup(downloadItem);
            } catch (error) {
                console.error("Error handling download:", error);
                await chrome.downloads.resume(downloadItem.id).catch(console.error);
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
                try {
                    const domain = request.domain;
                    userOptions.bypassWarningsUntil[domain] = Date.now() + (24 * 60 * 60 * 1000);
                    await saveUserOptions();
                    sendResponse({ success: true });
                } catch (error) {
                    console.error("Error setting bypass:", error);
                    sendResponse({ success: false, error: error.message });
                }
            },
            async updateUserOptions() {
                try {
                    userOptions = request.options;
                    await saveUserOptions();
                    await updateAllTabIcons();
                    sendResponse({ success: true });
                } catch (error) {
                    console.error("Error updating options:", error);
                    sendResponse({ success: false, error: error.message });
                }
            }
        };

        const handler = handlers[request.action];
        if (handler) {
            handler();
            return true; // Keep the message channel open for async response
        }
    });

    chrome.alarms.create('resetDailyData', { periodInMinutes: 24 * 60 });

    chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === 'resetDailyData') {
            chrome.storage.local.clear();
            shownDownloadWarnings.clear();

            Object.keys(userOptions.bypassWarningsUntil).forEach(domain => {
                if (userOptions.bypassWarningsUntil[domain] < Date.now()) {
                    delete userOptions.bypassWarningsUntil[domain];
                }
            });
            
            saveUserOptions();
        }
    });

    chrome.webRequest.onCompleted.addListener(
        async (details) => {
            if (details.tabId > -1 && isSuspiciousDomain(details.url, userOptions, suspiciousDomains)) {
                try {
                    await chrome.action.setIcon({
                        tabId: details.tabId,
                        path: {
                            "16": "icons/icon-warning-svg.png",
                            "48": "icons/icon-warning-svg.png",
                            "128": "icons/icon-warning-svg.png"
                        }
                    });
                    await checkUrlAndShowAlert(details.url, details.tabId);
                } catch (error) {
                    console.error("Error updating icon:", error);
                }
            }
        },
        { urls: ["<all_urls>"] }
    );

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (changeInfo.url) {
            try {
                const iconPath = !isSuspiciousDomain(changeInfo.url, userOptions, suspiciousDomains) 
                    ? {
                        "16": "icons/icon-svg.png",
                        "48": "icons/icon-svg.png",
                        "128": "icons/icon-svg.png"
                      }
                    : {
                        "16": "icons/icon-warning-svg.png",
                        "48": "icons/icon-warning-svg.png",
                        "128": "icons/icon-warning-svg.png"
                      };

                await chrome.action.setIcon({
                    tabId: tabId,
                    path: iconPath
                });
            } catch (error) {
                console.error("Error updating tab icon:", error);
            }
        }
    });

    chrome.action.onClicked.addListener((tab) => {
        if (isSuspiciousDomain(tab.url, userOptions, suspiciousDomains)) {
            const domain = new URL(tab.url).hostname;
            const transparencyReportUrl = 
                `https://transparencyreport.google.com/safe-browsing/search?url=${encodeURIComponent(domain)}`;
            chrome.tabs.create({ url: transparencyReportUrl });
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
