export function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

export function isSuspiciousDomain(url, userOptions, suspiciousDomains) {
    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname;

        console.log(`Checking domain in isSuspiciousDomain: ${hostname}`);

        if (!hostname || /[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/.test(hostname)) {
            console.log(`Domain ${hostname} is an IP address or invalid, not suspicious`);
            return false;
        }

        if (userOptions && userOptions.trustedDomains) {
            if (userOptions.trustedDomains.some(domain => 
                hostname === domain || (domain.startsWith('*.') && hostname.endsWith(domain.substring(2))))) {
                console.log(`Domain ${hostname} is in trusted domains, not suspicious`);
                return false;
            }
        }

        if (userOptions && userOptions.customDomains) {
            if (userOptions.customDomains.some(domain => 
                hostname === domain || (domain.startsWith('*.') && hostname.endsWith(domain.substring(2))))) {
                console.log(`Domain ${hostname} is in custom suspicious domains`);
                return true;
            }
        }

        // Convert Set to Array for .some() method
        const isSuspicious = Array.from(suspiciousDomains).some(domain => {
            let match = false;
            if (domain.startsWith('.')) {
                // For domains starting with a dot, check if it's a subdomain or exact match
                match = hostname.endsWith(domain) && hostname.split('.').length >= domain.split('.').length;
            } else {
                // For full domain names, check for exact match or subdomain
                match = hostname === domain || hostname.endsWith('.' + domain);
            }
            if (match) {
                console.log(`Domain ${hostname} matched suspicious domain ${domain}`);
            }
            return match;
        });

        console.log(`Domain ${hostname} suspicious: ${isSuspicious}`);
        return isSuspicious;
    } catch (error) {
        console.error("Error parsing URL:", error, url);
        return false;
    }
}

export function isSuspiciousExtension(filename, userOptions, suspiciousExtensions) {
    if (typeof filename !== 'string') {
        console.error("Invalid filename:", filename);
        return false;
    }
    const fileExtension = filename.split('.').pop().toLowerCase();
    return (userOptions && userOptions.customExtensions ? 
        userOptions.customExtensions.some(ext => ext.toLowerCase() === fileExtension) : false) ||
           Array.from(suspiciousExtensions).some(ext => ext.toLowerCase() === fileExtension);
}

export async function showSubtleAlert(message, tabId, onDismiss) {
    await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (message, onDismissString) => {
            const alertElement = document.createElement('div');
            alertElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="flex-grow: 1;">${message}</span>
                    <button id="closeAlertBtn" style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; cursor: pointer; font-size: 16px; color: #721c24; padding: 5px 10px; margin-left: 10px;">Close</button>
                </div>
                <button id="changeOptionsBtn" 
                   style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                Change Options
                </button>
            `;
            
            alertElement.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background-color: #fff3cd;
                padding: 15px;
                border: 1px solid #ffeeba;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                z-index: 2147483647;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
                font-size: 14px;
                color: #856404;
                opacity: 0;
                transition: opacity 0.5s ease-in-out;
                max-width: 300px;
            `;

            (document.body || document.documentElement).appendChild(alertElement);
            
            requestAnimationFrame(() => {
                alertElement.style.opacity = '1';
            });

            const closeBtn = alertElement.querySelector('#closeAlertBtn');
            closeBtn.addEventListener('click', () => {
                alertElement.style.opacity = '0';
                setTimeout(() => alertElement.remove(), 500);
                chrome.runtime.sendMessage({ action: 'dismissWarning' });
            });

            const changeOptionsBtn = alertElement.querySelector('#changeOptionsBtn');
            changeOptionsBtn.addEventListener('click', () => {
                chrome.runtime.sendMessage({ action: 'openOptionsPage' });
            });

            setTimeout(() => {
                alertElement.style.opacity = '0';
                setTimeout(() => alertElement.remove(), 500);
            }, 60000); // 60 seconds
        },
        args: [message]
    });
}
