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

        // Fetch and display educational resources
        await loadEducationalResources();
    } catch (error) {
        console.error('Error loading options:', error);
        showError();
    }
});

// Save options when the save button is clicked
document.getElementById('saveButton').addEventListener('click', async () => {
    try {
        const customDomains = document.getElementById('customDomains').value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line);
        const customExtensions = document.getElementById('customExtensions').value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line);
        const trustedDomains = document.getElementById('trustedDomains').value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line);

        // Validate inputs
        if (!validateDomains(customDomains) || !validateDomains(trustedDomains)) {
            showError("Please enter valid domains.");
            return;
        }
        if (!validateExtensions(customExtensions)) {
            showError("Please enter valid extensions.");
            return;
        }

        const options = {
            alertFrequency: document.getElementById('alertFrequency').value,
            customDomains: customDomains,
            customExtensions: customExtensions,
            trustedDomains: trustedDomains,
            bypassWarningsUntil: {}
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

// Validate domain format
function validateDomains(domains) {
    const domainPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Basic domain validation
    return domains.every(domain => domainPattern.test(domain));
}

// Validate extension format
function validateExtensions(extensions) {
    const extensionPattern = /^\.[a-zA-Z0-9]+$/; // Basic extension validation
    return extensions.every(ext => extensionPattern.test(ext));
}

// Load educational resources
async function loadEducationalResources() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getEducationalResources' });
        if (response.success) {
            const resourcesList = document.getElementById('resourcesList');
            resourcesList.innerHTML = ''; // Clear existing content
            response.resources.forEach(resource => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = resource.url;
                a.textContent = resource.title;
                a.target = '_blank'; // Open in new tab
                li.appendChild(a);
                resourcesList.appendChild(li);
            });
        } else {
            console.error('Failed to fetch educational resources');
        }
    } catch (error) {
        console.error('Error loading educational resources:', error);
    }
}

function showSuccess() {
    const message = document.getElementById('saveMessage');
    const error = document.getElementById('errorMessage');
    
    error.style.display = 'none';
    message.style.display = 'block';
    
    setTimeout(() => {
        message.style.display = 'none';
    }, 3000);
}

function showError(message = "An error occurred while saving options.") {
    const errorMessage = document.getElementById('errorMessage');
    const saveMessage = document.getElementById('saveMessage');
    
    saveMessage.style.display = 'none';
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}
