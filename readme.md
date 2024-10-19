# Safe Browsing Guard 🛡️

A Chrome extension that provides an additional layer of security by protecting users from suspicious domains and potentially harmful downloads. This extension helps users make informed decisions about the websites they visit and the files they download.

Safe Browsing Guard is designed to complement existing security systems by focusing on sites that are normally considered safe but may be used by attackers for phishing, command and control, data exfiltration, and malware distribution.

## Key Features
- 🛡️ Monitors suspicious domains and file downloads
- ⚡ Real-time website safety checks
- 🔔 Configurable alert frequency
- 🎯 Custom domain and extension filtering
- 🔒 Privacy-focused with local processing
- 📋 Detailed download warnings
- ⚙️ Customizable settings
- ✅ Whitelist trusted domains
- 💾 Import/Export options for easy backup and transfer

## Installation

### From Chrome Web Store
1. Visit the Chrome Web Store page
2. Click "Add to Chrome"
3. Confirm the installation
4. Pin the extension to your toolbar for easy access and visibility of warning icons

### From Source (Developer Mode)
Clone this repository:

```bash
git clone https://github.com/yourusername/safe-browsing-guard.git
```

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the cloned repository folder
5. Pin the extension to your toolbar for easy access and visibility of warning icons

## Usage

After installation:
1. The extension icon ✅ will appear in your Chrome toolbar. Make sure to pin it for better visibility of warning icons.
2. ✅ A green tick icon indicates normal browsing, meaning the domain does not belong to our list of suspicious domains.
3. 🛡️ An orange shield icon indicates a suspicious domain.
4. When visiting a suspicious domain, you'll receive an alert with an option to whitelist the domain if you trust it.
5. ✅ Click the extension icon for more information on educational resources about safe browsing and to access extension options.
6. 💾 Use the Import/Export options in the settings to backup your configuration or transfer it to another device.
7. ☕ Use the "Buy Me a Coffee" link on the options page to support future development.

## Data Sources

This Chrome extension is based on data from the following sources:
- **[Living Off Trusted Sites (LOTS) Project](https://lots-project.com/)**: The LOTS Project is a research project that aims to understand the threat landscape of the web. The project maintains a list of suspicious domains that are often used by attackers to host malicious content.
- **[FileSec](https://filesec.io/)**: FileSec is a project that aims to provide information about file extensions and their associated risks. The project maintains a list of file extensions that are commonly used by attackers to distribute malware.

Stay up-to-date with the latest data by regularly checking these sources.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

## Support the Project

If you find this extension helpful, consider supporting its development:

<a href="https://www.buymeacoffee.com/lokeshmotwani" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

## Privacy Policy

This extension does not collect or transmit any user data. All processing is done locally on your device.

## Credits
- Icons based on [Lucide Icons](https://lucide.dev/)
- Created by Lokesh Motwani

## Important Note
For the best protection, please pin this extension to your toolbar for easy access and visibility of warning icons. This ensures that you can quickly see the status of the current website and access the extension's features.
