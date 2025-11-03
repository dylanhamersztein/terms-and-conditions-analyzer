// This script extracts the DOM content from the current page
(function() {
  /**
   * Get cleaned HTML content from the page
   * Removes scripts, styles, and other non-content elements
   */
  function getCleanedDOM() {
    // Clone the document body to avoid modifying the actual page
    const clone = document.body.cloneNode(true);
    
    // Remove script, style, noscript, and other non-content elements
    const elementsToRemove = clone.querySelectorAll('script, style, noscript, iframe, object, embed');
    elementsToRemove.forEach(el => el.remove());
    
    // Get the inner HTML
    const html = clone.innerHTML;
    
    return html;
  }
  
  /**
   * Get text-only version as fallback (for very large pages)
   */
  function getCleanedText() {
    const clone = document.body.cloneNode(true);
    const elementsToRemove = clone.querySelectorAll('script, style, noscript, iframe, object, embed');
    elementsToRemove.forEach(el => el.remove());
    return clone.textContent || clone.innerText || '';
  }
  
  try {
    const html = getCleanedDOM();
    const text = getCleanedText();
    
    return {
      html: html,
      text: text,
      url: window.location.href,
      title: document.title
    };
  } catch (error) {
    console.error('Error extracting DOM:', error);
    return null;
  }
})();
