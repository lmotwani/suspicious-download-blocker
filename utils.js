export function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  }
  
  export function isSuspiciousDomain(url, userOptions, suspiciousDomains) {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
  
      if (!hostname || /[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/.test(hostname)) {
        return false;
      }
  
      if (userOptions.trustedDomains.some(domain => 
        hostname === domain || (domain.startsWith('*.') && hostname.endsWith(domain.substring(2))))) {
        return false;
      }
  
      if (userOptions.customDomains.some(domain => 
        hostname === domain || (domain.startsWith('*.') && hostname.endsWith(domain.substring(2))))) {
        return true;
      }
  
      return suspiciousDomains.some(domain => 
        hostname === domain || (domain.startsWith('*.') && hostname.endsWith(domain.substring(2))));
  
    } catch (error) {
      console.error("Error parsing URL:", error, url);
      return false;
    }
  }
  
  export function isSuspiciousExtension(filename, userOptions, suspiciousExtensions) {
    const lowerFilename = filename.toLowerCase();
    return userOptions.customExtensions.some(ext => lowerFilename.endsWith(ext)) ||
           suspiciousExtensions.some(ext => lowerFilename.endsWith(ext));
  }
  
  export async function showSubtleAlert(message, tabId) {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (message) => {
        const alertElement = document.createElement('div');
        alertElement.innerHTML = `
          ${message}
          <a href="https://www.google.com/about/company/google-safe-browsing/" 
             target="_blank" 
             style="margin-left: 10px; color: #0066cc; text-decoration: underline;">
            Learn More
          </a>
        `;
        
        alertElement.style.cssText = `
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          background-color: #ffeeba;
          padding: 10px 20px;
          border: 1px solid #c3e6cb;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          font-size: 14px;
          color: #333;
          opacity: 0;
          transition: opacity 0.5s ease-in-out;
        `;
  
        document.body.appendChild(alertElement);
        
        requestAnimationFrame(() => {
          alertElement.style.opacity = '1';
        });
  
        setTimeout(() => {
          alertElement.style.opacity = '0';
          setTimeout(() => alertElement.remove(), 500);
        }, 5000);
      },
      args: [message]
    });
  }