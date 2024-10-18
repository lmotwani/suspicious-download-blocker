document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const downloadId = parseInt(urlParams.get('downloadId'));
    const url = urlParams.get('url');
    const filename = urlParams.get('filename');

    document.getElementById('filename').textContent = filename || 'Unknown';
    document.getElementById('source').textContent = url || 'Unknown';

    const resources = await getEducationalResources();

    const warningContent = document.querySelector('.warning-content');
    if (warningContent && resources.length > 0) {
        const resourcesList = document.createElement('ul');
        resources.forEach(resource => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = resource.url;
            a.textContent = resource.title;
            a.target = '_blank';
            li.appendChild(a);
            resourcesList.appendChild(li);
        });
        warningContent.appendChild(resourcesList);
    }

    const domain = new URL(url).hostname;
    let isTrusted = await isDomainTrusted(domain);
    updateUI(isTrusted);

    document.getElementById('whitelistButton').addEventListener('click', async () => {
        try {
            const { userOptions = { trustedDomains: [] } } = await chrome.storage.sync.get('userOptions');

            if (!isTrusted) {
                userOptions.trustedDomains.push(domain);
                await chrome.storage.sync.set({ userOptions });
                console.log(`${domain} added to trusted domains:`, userOptions.trustedDomains);
            } else {
                userOptions.trustedDomains = userOptions.trustedDomains.filter(d => d !== domain);
                await chrome.storage.sync.set({ userOptions });
                console.log(`${domain} removed from trusted domains:`, userOptions.trustedDomains);
            }

            await chrome.runtime.sendMessage({ action: 'updateUserOptions', options: userOptions });
            isTrusted = !isTrusted;
            updateUI(isTrusted);
        } catch (error) {
            console.error('Error updating trusted domains list:', error);
        }
    });

    document.getElementById('cancelButton').addEventListener('click', async () => {
        try {
            await chrome.runtime.sendMessage({
                action: 'cancelDownload',
                downloadId: downloadId
            });
        } catch (error) {
            console.error('Error canceling download:', error);
        } finally {
            window.close();
        }
    });

    document.getElementById('continueButton').addEventListener('click', async () => {
        try {
            if (document.getElementById('bypassWarnings').checked && url) {
                await chrome.runtime.sendMessage({
                    action: 'bypassWarnings',
                    domain: domain
                });
            }
    
            await chrome.runtime.sendMessage({
                action: 'continueDownload',
                downloadId: downloadId
            });
        } catch (error) {
            console.error('Error continuing download:', error);
        } finally {
            window.close();
        }
    });

    const closeButton = document.getElementById('closeButton');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            window.close();
        });
    }
});

async function getEducationalResources() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getEducationalResources' });
        if (response && response.success) {
            return response.resources;
        } else {
            console.error('Failed to fetch educational resources');
            return [];
        }
    } catch (error) {
        console.error('Error loading educational resources:', error);
        return [];
    }
}

async function isDomainTrusted(domain) {
    try {
        const { userOptions = { trustedDomains: [] } } = await chrome.storage.sync.get('userOptions');
        return userOptions.trustedDomains.includes(domain);
    } catch (error) {
        console.error('Error checking if domain is trusted:', error);
        return false;
    }
}

function updateUI(isTrusted) {
    const whitelistButton = document.getElementById('whitelistButton');
    if (whitelistButton) {
        whitelistButton.textContent = isTrusted ? 'Remove from Trusted Domains' : 'Add to Trusted Domains';
    }
}
