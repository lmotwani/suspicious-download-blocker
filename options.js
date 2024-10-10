// Load saved options when the page is opened
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await chrome.storage.sync.get(['userOptions']);
        const options = data.userOptions || {
            alertFrequency: 'daily',
            customDomains: [],
            customExtensions: [],
            trustedDomains: [],
            bypassWarningsUntil: {}
        };

        // Populate form fields
        document.getElementById('alertFrequency').value = options.alertFrequency;
        document.getElementById('customDomains').value = options.customDomains.join('\n');
        document.getElementById('customExtensions').value = options.customExtensions.join('\n');
        document.getElementById('trustedDomains').value = options.trustedDomains.join('\n');
    } catch (error) {
        console.error('Error loading options:', error);
        showError();
    }
});

// Save options when the save button is clicked
document.getElementById('saveButton').addEventListener('click', async () => {
    try {
        const options = {
            alertFrequency: document.getElementById('alertFrequency').value,
            customDomains: document.getElementById('customDomains').value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line),
            customExtensions: document.getElementById('customExtensions').value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line),
            trustedDomains: document.getElementById('trustedDomains').value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line),
            bypassWarningsUntil: {} // Reset bypass warnings when saving options
        };

        await chrome.storage.sync.set({ userOptions: options });
        
        // Notify background script of the update
        await chrome.runtime.sendMessage({
            action: 'updateUserOptions',
            options: options
        });

        showSuccess();
    } catch (error) {
        console.error('Error saving options:', error);
        showError();
    }
});

function showSuccess() {
    const message = document.getElementById('saveMessage');
    const error = document.getElementById('errorMessage');
    
    error.style.display = 'none';
    message.style.display = 'block';
    
    setTimeout(() => {
        message.style.display = 'none';
    }, 3000);
}

function showError() {
    const message = document.getElementById('saveMessage');
    const error = document.getElementById('errorMessage');
    
    message.style.display = 'none';
    error.style.display = 'block';
    
    setTimeout(() => {
        error.style.display = 'none';
    }, 3000);
}