# Safe Browsing Guard

A Chrome extension that protects users from suspicious domains and potentially harmful downloads. This extension helps users make informed decisions about the websites they visit and the files they download.

This Chrome extension is based on data from the LOTS Project (https://lots-project.com/) and FileSec (https://filesec.io). Stay up-to-date with the latest file extensions being used by attackers to ensure the safety of your downloads.

![Safe Browsing Guard](./docs/images/banner.png)

## Features

- 🛡️ Monitors suspicious domains and file downloads
- ⚡ Real-time website safety checks
- 🔔 Configurable alert frequency
- 🎯 Custom domain and extension filtering
- 🔒 Privacy-focused with local processing
- 📋 Detailed download warnings
- ⚙️ Customizable settings

## Installation

### From Chrome Web Store
1. Visit the [Chrome Web Store page](https://chrome.google.com/webstore/detail/[extension-id])
2. Click "Add to Chrome"
3. Confirm the installation

### From Source (Developer Mode)
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/safe-browsing-guard.git
   ```
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the cloned repository folder

## Usage

After installation:
1. The extension icon ✅ will appear in your Chrome toolbar.
2. ✅ A green tick icon indicates normal browsing, meaning the domain does not belong to our list of suspicious domains.
3. 🛡️ An orange shield icon indicates a suspicious domain.
4. ✅ Click the icon for more information on educational resources about safe browsing and to access extension options for adding or removing the current site from the trusted or suspicious domains list.
5. ☕ Use the "Buy Me a Coffee" link on the options page to support future development. 

## Data Sources
This Chrome extension is based on data from the following sources:

- **Living Off Trusted Sites (LOTS) Project:** The LOTS Project is a research project that aims to understand the threat landscape of the web. The project maintains a list of suspicious domains that are often used by attackers to host malicious content.
- **FileSec:** FileSec is a project that aims to provide information about file extensions and their associated risks. The project maintains a list of file extensions that are commonly used by attackers to distribute malware.

Stay up-to-date with the latest data by regularly checking these sources.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support the Project

If you find this extension helpful, consider supporting its development:

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/lokeshmotwani)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Privacy Policy

This extension does not collect or transmit any user data. All processing is done locally on your device. The only external requests made are to check domain safety using Google's Safe Browsing API through the transparency report.

## Credits

- Icons based on [Lucide Icons](https://lucide.dev/)
- Created by Lokesh Motwani
