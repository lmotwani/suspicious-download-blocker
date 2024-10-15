document.addEventListener('DOMContentLoaded', async () => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const downloadId = parseInt(urlParams.get('downloadId'));
    const url = urlParams.get('url');
    const filename = urlParams.get('filename');

    // Display file information
    document.getElementById('filename').textContent = filename || 'Unknown';
    document.getElementById('source').textContent = url || 'Unknown';

    // Fetch educational resources
    const resources = await getEducationalResources();

    // Update warning message
    const warningContent = document.querySelector('.warning-content');
    warningContent.innerHTML = `
        <p>Warning: This download may be unsafe. The file is from a potentially suspicious domain and could contain malware or other malicious content.</p>
        
        <div class="file-info">
            <p><strong>File:</strong> <span id="filename">${filename || 'Unknown'}</span></p>
            <p><strong>Source:</strong> <span id="source">${url || 'Unknown'}</span></p>
        </div>
        
        <p>Attackers often use legitimate-looking files to distribute malware. Proceed with caution.</p>
        <p>Are you sure you want to continue with this download?</p>
        <p><a href="#" id="learnMore">Learn More about online safety</a></p>
        ${resources.length > 0 ? `<p><a href="${resources[0].url}" target="_blank" id="learnMoreResource">${resources[0].title}</a></p>` : ''}
    `;

    // Handle "Learn More" link click
    document.getElementById('learnMore').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await chrome.runtime.sendMessage({ action: 'openOptionsPage' });
            window.close();
        } catch (error) {
            console.error('Error opening options page:', error);
            showError("Failed to open options page.");
        }
    });

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
            showError("Failed to cancel download.");
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
            showError("Failed to continue download.");
        }
    });
});

// Function to show error messages
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

async function getEducationalResources() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getEducationalResources' });
        if (response.success) {
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
