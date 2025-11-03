// ============================================
// CONFIGURATION
// ============================================
// TODO: Replace with your own OpenAI API key
// NOTE: For production use, consider implementing secure storage using chrome.storage.sync
// to allow users to input their API key through the extension's settings UI
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE';
const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

// ============================================
// DOM ELEMENTS
// ============================================
const analyzeBtn = document.getElementById('analyze-btn');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const resultsDiv = document.getElementById('results');
const summaryContent = document.getElementById('summary-content');
const analysisContent = document.getElementById('analysis-content');
const scoreContent = document.getElementById('score-content');

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Show/hide UI elements
 */
function showLoading() {
  loadingDiv.style.display = 'block';
  errorDiv.style.display = 'none';
  resultsDiv.style.display = 'none';
  analyzeBtn.disabled = true;
}

function hideLoading() {
  loadingDiv.style.display = 'none';
  analyzeBtn.disabled = false;
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  resultsDiv.style.display = 'none';
  hideLoading();
}

function showResults() {
  resultsDiv.style.display = 'block';
  errorDiv.style.display = 'none';
  hideLoading();
}

/**
 * Convert HTML to plain text
 */
function htmlToPlainText(html) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}

/**
 * Get rating class for styling
 */
function getRatingClass(rating) {
  const ratingLower = rating.toLowerCase();
  if (ratingLower.includes('excellent')) return 'excellent';
  if (ratingLower.includes('good')) return 'good';
  if (ratingLower.includes('fair')) return 'fair';
  if (ratingLower.includes('very poor')) return 'very-poor';
  if (ratingLower.includes('poor')) return 'poor';
  return 'fair';
}

// ============================================
// MAIN FUNCTIONALITY
// ============================================

/**
 * Extract page DOM content
 */
async function extractPageDOM() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    if (results && results[0] && results[0].result) {
      return results[0].result;
    }
    return null;
  } catch (error) {
    console.error('Error executing content script:', error);
    throw new Error('Could not access the current page. Please make sure you have permission to view this page.');
  }
}

/**
 * Call OpenAI API to analyze T&C from page DOM
 */
async function analyzeWithAI(pageData) {
  // Validate API key
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
    throw new Error('Please set your OpenAI API key in popup.js');
  }
  
  // Use text version for analysis (more token-efficient than HTML)
  // Truncate if too long (OpenAI has token limits)
  const maxLength = 12000; // Approximately 3000-4000 tokens depending on complexity
  const pageContent = pageData.text.length > maxLength 
    ? pageData.text.substring(0, maxLength) + '...' 
    : pageData.text;
  
  const prompt = `You are analyzing a webpage to find and evaluate Terms and Conditions. 

I'm providing you with the text content from a webpage. Your task is to:
1. FIND and EXTRACT the Terms and Conditions text from this page content
2. ANALYZE the Terms and Conditions you found
3. Provide a comprehensive evaluation

Page URL: ${pageData.url}
Page Title: ${pageData.title}

Page Content:
${pageContent}

Please respond in STRICT JSON format with this exact structure:
{
  "found": true,
  "summary": "A brief, easy-to-understand summary of the T&C in 150 words or less",
  "analysis": [
    "Description of concerning clause 1",
    "Description of concerning clause 2"
  ],
  "score": 85,
  "rating": "Good"
}

If you cannot find Terms and Conditions on this page, respond with:
{
  "found": false,
  "summary": "No Terms and Conditions found on this page.",
  "analysis": [],
  "score": 0,
  "rating": "N/A"
}

When analyzing, look for these concerning clauses:
1. User data sharing with third parties
2. Automatic subscription renewals
3. User content ownership (does the company claim ownership of user content?)
4. Liability limitations (is the company limiting their liability excessively?)
5. Mandatory arbitration (are users forced into arbitration instead of court?)

Trustworthiness Score: 1-100 (where 100 is most trustworthy)
Rating: "Excellent", "Good", "Fair", "Poor", or "Very Poor"`;

  try {
    const response = await fetch(OPENAI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a legal analyst specializing in finding and analyzing Terms and Conditions from webpages. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Try to parse the JSON response
    try {
      // Sometimes the AI wraps JSON in markdown code blocks, so let's handle that
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```\n?/g, '').replace(/```\n?$/g, '');
      }
      
      const parsedResult = JSON.parse(jsonContent);
      
      // Check if T&C was found
      if (parsedResult.found === false) {
        throw new Error('No Terms and Conditions found on this page. Please navigate to a page that displays Terms and Conditions.');
      }
      
      // Validate the response structure
      if (!parsedResult.summary || !parsedResult.analysis || 
          typeof parsedResult.score !== 'number' || !parsedResult.rating) {
        throw new Error('Invalid response structure from AI');
      }
      
      return parsedResult;
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response. The AI did not return valid JSON.');
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

/**
 * Display the analysis results
 */
function displayResults(results) {
  // Display score
  const scoreHtml = `
    <div class="score-number">${results.score}</div>
    <div class="score-details">
      <div class="score-rating ${getRatingClass(results.rating)}">${results.rating}</div>
      <div class="score-label">out of 100</div>
    </div>
  `;
  scoreContent.innerHTML = scoreHtml;
  
  // Display summary - use textContent to prevent XSS
  summaryContent.textContent = results.summary;
  
  // Display analysis - sanitize by using textContent for each item
  if (results.analysis && results.analysis.length > 0) {
    const ul = document.createElement('ul');
    results.analysis.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item; // Safe: uses textContent instead of innerHTML
      ul.appendChild(li);
    });
    analysisContent.innerHTML = ''; // Clear previous content
    analysisContent.appendChild(ul);
  } else {
    const p = document.createElement('p');
    p.textContent = 'No concerning clauses found. This appears to be a fair agreement.';
    analysisContent.innerHTML = ''; // Clear previous content
    analysisContent.appendChild(p);
  }
  
  showResults();
}

/**
 * Main analysis workflow
 */
async function analyzeTermsAndConditions() {
  try {
    showLoading();
    
    // Step 1: Extract page DOM content
    const pageData = await extractPageDOM();
    if (!pageData || !pageData.text) {
      showError('Could not extract content from this page. Please make sure you have permission to access the page.');
      return;
    }
    
    console.log('Extracted page data:', {
      url: pageData.url,
      title: pageData.title,
      textLength: pageData.text.length,
      htmlLength: pageData.html.length
    });
    
    // Step 2: Validate content
    if (pageData.text.trim().length < 100) {
      showError('Could not extract meaningful content from this page.');
      return;
    }
    
    console.log('Page content length:', pageData.text.length);
    
    // Step 3: Send to AI for T&C extraction and analysis
    const results = await analyzeWithAI(pageData);
    
    console.log('AI analysis results:', results);
    
    // Step 4: Display results
    displayResults(results);
    
  } catch (error) {
    console.error('Error during analysis:', error);
    showError(error.message || 'An unexpected error occurred. Please try again.');
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
analyzeBtn.addEventListener('click', analyzeTermsAndConditions);

// Initial state
hideLoading();
