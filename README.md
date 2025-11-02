# AI T&C Analyzer

A browser extension that uses AI to automatically find, analyze, and summarize Terms and Conditions from websites, providing a trustworthiness rating.

## Features

- 🔍 **Automatic T&C Detection**: Searches the current page for Terms and Conditions text (in modals, dialogs, or page content)
- 🤖 **AI-Powered Analysis**: Uses OpenAI to analyze T&C documents
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

Before using the extension, you need to configure your OpenAI API key:

1. Open the file `popup.js` in a text editor
2. Find the line: `const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE';`
3. Replace `YOUR_OPENAI_API_KEY_HERE` with your actual OpenAI API key
4. Save the file and reload the extension

To get an OpenAI API key:
1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key

## Usage

1. Navigate to any website that displays Terms and Conditions (in a modal, dialog, or on the page itself)
2. Click the extension icon in your browser toolbar
3. Click the "Analyze Terms and Conditions" button
4. Wait while the extension:
   - Searches the current page for T&C text
   - Extracts the content from modals, dialogs, or page elements
   - Sends it to OpenAI for analysis
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
├── content.js            # Script to find T&C links on pages
├── icons/
│   ├── icon48.png       # 48x48 extension icon
│   └── icon128.png      # 128x128 extension icon
└── README.md            # This file
```

## Technical Details

### Permissions

The extension requires the following permissions:
- `activeTab`: To access the current webpage
- `scripting`: To inject the content script that extracts T&C text
- `https://api.openai.com/*`: To call the OpenAI API
- `<all_urls>`: To access content on any website (required for reading page content)

### How It Works

1. **Content Script Injection**: When you click analyze, `content.js` is injected into the active tab
2. **Text Detection**: The script searches the DOM for T&C content using:
   - Modals and dialogs (highest priority)
   - Elements with T&C-related IDs/classes
   - Main content areas containing T&C keywords
   - Relevance scoring based on keywords and content length
3. **Text Extraction**: The extension extracts the text content directly from the page
4. **AI Analysis**: Text is sent to OpenAI's GPT-3.5-turbo model with a structured prompt
5. **Result Display**: The JSON response from OpenAI is parsed and displayed in the popup

### Limitations

- **Content Detection**: Works best when T&C text is directly visible on the page or in modals
- **Token Limits**: Very long T&C documents are truncated to ~12,000 characters
- **API Costs**: Each analysis uses OpenAI API credits
- **Detection Accuracy**: May not detect T&C if they're not displayed using standard patterns or keywords

## Privacy

This extension:
- Does NOT collect or store any user data
- Only sends T&C text to OpenAI for analysis
- Requires your own OpenAI API key
- All processing happens between your browser and OpenAI's servers

## License

MIT License - Feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
