document.addEventListener('DOMContentLoaded', initializeOptions);

async function initializeOptions() {
    await loadOptions();
    await loadEducationalResources();
    setupEventListeners();
}

async function loadOptions() {
    try {
        const { userOptions } = await chrome.storage.sync.get('userOptions');
        const options = userOptions || getDefaultOptions();
        populateFormFields(options);
    } catch (error) {
        showStatusMessage('Error loading options. Please try again.', 'error');
    }
}

function getDefaultOptions() {
    return {
        alertFrequency: 'daily',
        customDomains: [],
        customExtensions: [],
        trustedDomains: []
    };
}

function populateFormFields(options) {
    document.getElementById('alertFrequency').value = options.alertFrequency;
    document.getElementById('customDomains').value = options.customDomains.join('\n');
    document.getElementById('customExtensions').value = options.customExtensions.join('\n');
    document.getElementById('trustedDomains').value = options.trustedDomains.join('\n');
}

async function loadEducationalResources() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getEducationalResources' });
        if (response && response.success) {
            displayEducationalResources(response.resources);
        } else {
            throw new Error('Failed to fetch educational resources');
        }
    } catch (error) {
        console.error('Error loading educational resources:', error);
    }
}

function displayEducationalResources(resources) {
    const resourcesList = document.getElementById('resourcesList');
    resourcesList.innerHTML = '';
    resources.forEach(resource => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = resource.url;
        a.textContent = resource.title;
        a.target = '_blank';
        li.appendChild(a);
        resourcesList.appendChild(li);
    });
}

function setupEventListeners() {
    document.getElementById('saveButton').addEventListener('click', saveOptions);
    document.getElementById('exportButton').addEventListener('click', exportOptions);
    document.getElementById('importInput').addEventListener('change', importOptions);
}

async function saveOptions() {
    try {
        const options = gatherFormData();
        await validateOptions(options);
        await saveOptionsToStorage(options);
        await updateBackgroundScript(options);
        showStatusMessage('Options saved successfully!', 'success');
    } catch (error) {
        showStatusMessage(error.message, 'error');
    }
}

function gatherFormData() {
    return {
        alertFrequency: document.getElementById('alertFrequency').value,
        customDomains: getCleanedTextareaValues('customDomains'),
        customExtensions: getCleanedTextareaValues('customExtensions'),
        trustedDomains: getCleanedTextareaValues('trustedDomains')
    };
}

function getCleanedTextareaValues(id) {
    return document.getElementById(id).value
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean);
}

async function validateOptions(options) {
    if (!['always', 'daily', 'weekly', 'never'].includes(options.alertFrequency)) {
        throw new Error('Invalid alert frequency selected.');
    }
    // Add more validation as needed
}

async function saveOptionsToStorage(options) {
    await chrome.storage.sync.set({ userOptions: options });
}

async function updateBackgroundScript(options) {
    await chrome.runtime.sendMessage({ action: 'updateUserOptions', options });
}

async function exportOptions() {
    try {
        const { userOptions } = await chrome.storage.sync.get('userOptions');
        const blob = new Blob([JSON.stringify(userOptions, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'safe_browsing_guard_options.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        showStatusMessage('Error exporting options. Please try again.', 'error');
    }
}

function importOptions(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const options = JSON.parse(e.target.result);
                await validateOptions(options);
                await saveOptionsToStorage(options);
                await updateBackgroundScript(options);
                showStatusMessage('Options imported successfully. Reloading...', 'success');
                setTimeout(() => location.reload(), 1500);
            } catch (error) {
                showStatusMessage(`Failed to import options: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    }
}

function showStatusMessage(message, type) {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    statusElement.style.display = 'block';
    setTimeout(() => {
        statusElement.style.display = 'none';
    }, 3000);
}
