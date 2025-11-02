// This script searches the current DOM for Terms and Conditions text
(function() {
  // Keywords to identify T&C content
  const termsKeywords = [
    'terms of service',
    'terms and conditions',
    'terms & conditions',
    'terms of use',
    'user agreement'
  ];
  
  const otherKeywords = [
    'privacy policy',
    'legal notice',
    'legal information'
  ];
  
  /**
   * Check if text contains T&C keywords
   */
  function containsKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  }
  
  /**
   * Get text content from an element and its children
   */
  function getTextContent(element) {
    // Filter out script and style elements
    const clone = element.cloneNode(true);
    const scripts = clone.querySelectorAll('script, style, noscript');
    scripts.forEach(el => el.remove());
    return clone.textContent || clone.innerText || '';
  }
  
  /**
   * Calculate relevance score for an element
   */
  function calculateRelevance(element, text) {
    let score = 0;
    const lowerText = text.toLowerCase();
    
    // Check for keyword matches (higher weight)
    termsKeywords.forEach(keyword => {
      const count = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
      score += count * 10;
    });
    
    // Check for common T&C phrases
    const tcPhrases = [
      'you agree',
      'by using',
      'these terms',
      'this agreement',
      'user obligations',
      'intellectual property',
      'disclaimer',
      'limitation of liability',
      'termination',
      'governing law'
    ];
    
    tcPhrases.forEach(phrase => {
      if (lowerText.includes(phrase)) {
        score += 5;
      }
    });
    
    // Prefer longer content (but with diminishing returns)
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount > 100) {
      score += Math.min(wordCount / 10, 50);
    }
    
    // Check element attributes for hints
    const id = element.id?.toLowerCase() || '';
    const className = element.className?.toString().toLowerCase() || '';
    const role = element.getAttribute('role')?.toLowerCase() || '';
    
    if (id.includes('terms') || id.includes('tos') || id.includes('legal')) score += 20;
    if (className.includes('terms') || className.includes('tos') || className.includes('legal')) score += 20;
    if (className.includes('modal') || role === 'dialog') score += 10;
    
    return score;
  }
  
  // Search strategy: Look for T&C content in various locations
  const candidates = [];
  
  // 1. Check for modals/dialogs (highest priority)
  const modals = document.querySelectorAll('[role="dialog"], .modal, .popup, [id*="modal"], [class*="modal"]');
  modals.forEach(modal => {
    // Only consider visible modals
    const style = window.getComputedStyle(modal);
    if (style.display !== 'none' && style.visibility !== 'hidden') {
      const text = getTextContent(modal);
      if (containsKeywords(text, termsKeywords.concat(otherKeywords))) {
        candidates.push({
          element: modal,
          text: text,
          score: calculateRelevance(modal, text) + 30 // Bonus for being in a modal
        });
      }
    }
  });
  
  // 2. Check for dedicated T&C containers
  const containers = document.querySelectorAll('[id*="terms"], [id*="tos"], [id*="legal"], [class*="terms"], [class*="tos"], [class*="legal"]');
  containers.forEach(container => {
    const text = getTextContent(container);
    if (text.trim().split(/\s+/).length > 100 && containsKeywords(text, termsKeywords.concat(otherKeywords))) {
      candidates.push({
        element: container,
        text: text,
        score: calculateRelevance(container, text)
      });
    }
  });
  
  // 3. Check main content areas
  const mainElements = document.querySelectorAll('main, article, [role="main"], .content, #content');
  mainElements.forEach(main => {
    const text = getTextContent(main);
    if (containsKeywords(text, termsKeywords)) {
      candidates.push({
        element: main,
        text: text,
        score: calculateRelevance(main, text)
      });
    }
  });
  
  // 4. Fallback: Check the entire body if no specific containers found
  if (candidates.length === 0) {
    const bodyText = getTextContent(document.body);
    if (containsKeywords(bodyText, termsKeywords)) {
      candidates.push({
        element: document.body,
        text: bodyText,
        score: calculateRelevance(document.body, bodyText) - 20 // Penalty for being too broad
      });
    }
  }
  
  // Sort by relevance score and return the best match
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    
    // Return the text content if it's substantial enough
    if (best.text.trim().split(/\s+/).length > 50) {
      return {
        text: best.text.trim(),
        source: 'current_page',
        elementType: best.element.tagName.toLowerCase(),
        score: best.score
      };
    }
  }
  
  return null;
})();
