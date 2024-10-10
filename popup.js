document.addEventListener('DOMContentLoaded', () => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const downloadId = parseInt(urlParams.get('downloadId'));
    const url = urlParams.get('url');
    const filename = urlParams.get('filename');

    // Display file information
    document.getElementById('filename').textContent = filename || 'Unknown';
    document.getElementById('source').textContent = url || 'Unknown';

    // Handle cancel button click
    document.getElementById('cancelButton').addEventListener('click', async () => {
        try {
            await chrome.runtime.sendMessage({
                action: 'cancelDownload',
                downloadId: downloadId
            });
            window.close();
        } catch (error) {
            console.error('Error canceling download:', error);
        }
    });

    // Handle continue button click
    document.getElementById('continueButton').addEventListener('click', async () => {
        try {
            // If bypass checkbox is checked, send bypass message
            if (document.getElementById('bypassWarnings').checked && url) {
                const domain = new URL(url).hostname;
                await chrome.runtime.sendMessage({
                    action: 'bypassWarnings',
                    domain: domain
                });
            }

            // Continue the download
            await chrome.runtime.sendMessage({
                action: 'continueDownload',
                downloadId: downloadId
            });
            
            window.close();
        } catch (error) {
            console.error('Error continuing download:', error);
        }
    });
});