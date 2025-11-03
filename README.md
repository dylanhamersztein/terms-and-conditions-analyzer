# AI T&C Analyzer

A browser extension that uses AI to automatically find, analyze, and summarize Terms and Conditions from websites, providing a trustworthiness rating.

## Features

- 🔍 **AI-Powered T&C Detection**: The AI model automatically finds Terms and Conditions within page content
- 🤖 **Intelligent Analysis**: Uses OpenAI to both extract and analyze T&C documents from any webpage
- 📊 **Trustworthiness Score**: Get a score from 1-100 on how trustworthy the T&C are
- 📝 **Easy-to-Read Summary**: Condenses lengthy T&C into brief summaries
- ⚠️ **Concerning Clauses**: Highlights potentially problematic clauses including:
  - User data sharing
  - Automatic subscription renewals
  - User content ownership
  - Liability limitations
  - Mandatory arbitration

## Installation

### Chrome/Edge (Manifest V3)

1. Clone or download this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the extension directory

### Firefox

1. Clone or download this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the extension directory

## Configuration

### OpenAI API Key

The extension requires an OpenAI API key to function. On first use, you'll be prompted to enter your API key:

1. Click the extension icon in your browser toolbar
2. Enter your OpenAI API key in the setup screen
3. Click "Save API Key"
4. Your key is stored securely in your browser's local storage

To get an OpenAI API key:
1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key

**Security Note**: Your API key is stored locally in your browser using the browser's storage API and is never transmitted to any server other than OpenAI's API.

## Usage

1. Navigate to any website (the AI will search for Terms and Conditions on the page)
2. Click the extension icon in your browser toolbar
3. Click the "Analyze Terms and Conditions" button
4. Wait while the extension:
   - Extracts the page content
   - Sends it to the AI model
   - AI finds and extracts T&C from the page
   - AI analyzes the T&C content
5. View the results:
   - **Trustworthiness Score**: A rating from 1-100
   - **Summary**: A brief overview of the T&C
   - **Detailed Analysis**: List of concerning clauses found

## File Structure

```
terms-and-conditions-analyzer/
├── manifest.json          # Extension configuration (Manifest V3)
├── popup.html            # Extension popup UI
├── popup.js              # Main logic and API integration
├── popup.css             # Styling for the popup
├── content.js            # Script to extract page DOM content
├── icons/
│   ├── icon48.png       # 48x48 extension icon
│   └── icon128.png      # 128x128 extension icon
└── README.md            # This file
```

## Technical Details

### Permissions

The extension requires the following permissions:
- `activeTab`: To access the current webpage
- `scripting`: To inject the content script that extracts page content
- `storage`: To securely store your OpenAI API key locally
- `https://api.openai.com/*`: To call the OpenAI API
- `<all_urls>`: To access content on any website (required for reading page content)

### Cross-Browser Compatibility

The extension uses browser-agnostic APIs for maximum compatibility:
- Works with Chrome, Edge, Firefox, and other modern browsers
- Automatically detects and uses the appropriate browser API (`browser` or `chrome`)
- Manifest V3 compliant

### How It Works

1. **API Key Setup**: On first use, you enter your OpenAI API key which is stored securely in browser local storage
2. **Content Script Injection**: When you click analyze, `content.js` is injected into the active tab
3. **DOM Extraction**: The script extracts the page's DOM content (HTML and text), removing scripts and styles
4. **AI Processing**: The **entire page content** is sent to OpenAI's GPT-3.5-turbo model with instructions to:
   - Find and extract Terms and Conditions from the page
   - Analyze the T&C content for concerning clauses
   - Generate a summary and trustworthiness score
5. **Result Display**: The JSON response from OpenAI is parsed and displayed in the popup

**Key Advantages**: 
- The AI model handles both T&C detection and analysis
- No content truncation - full page content is analyzed
- Secure API key storage in browser local storage

### Limitations

- **AI-Dependent**: T&C detection relies entirely on the AI model's ability to find T&C within page content
- **API Costs**: Each analysis uses OpenAI API credits
- **Detection Accuracy**: The AI model determines what constitutes T&C, which may vary in accuracy
- **Token Limits**: OpenAI has token limits, but the extension sends full page content for best results

## Privacy

This extension:
- Does NOT collect or store any user data
- Stores your OpenAI API key locally in your browser's secure storage
- Only sends page content to OpenAI for T&C extraction and analysis
- API key is never transmitted to any server other than OpenAI
- All processing happens between your browser and OpenAI's servers
- Requires your own OpenAI API key
- All processing happens between your browser and OpenAI's servers

## License

MIT License - Feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
