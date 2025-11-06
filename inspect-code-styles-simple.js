const { chromium } = require('playwright');

async function inspectCodeStyles() {
  console.log('Starting Playwright script to inspect code element styles...');
  
  // Launch browser
  const browser = await chromium.launch({ headless: true }); // Run in headless mode for automation
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Create a simple HTML page with code elements to test
    const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Code Elements</title>
      <style>
        /* Basic styles for testing */
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        
        /* Code block styles similar to the project */
        .code-block {
          position: relative;
          margin: 1rem 0;
          border-radius: 0.375rem;
          overflow: hidden;
          display: inline-block;
          max-width: 100%;
        }
        
        .code-block pre {
          margin: 0;
          padding: 0.5rem 1rem 1rem 1rem;
          overflow-x: auto;
          background-color: #f5f5f5;
          border: 1px solid #e0e0e0;
          border-radius: 0.375rem;
          color: #333333;
          display: inline-block;
        }
        
        .code-block code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.875rem;
          line-height: 1.5;
          white-space: pre;
          padding: 0;
          background-color: transparent;
          border: none;
        }
        
        /* Inline code */
        code:not(pre code) {
          background-color: #f0f0f0;
          color: #333;
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-size: 0.9em;
        }
        
        /* Language-specific styles */
        .language-javascript {
          color: #f8f8f2;
          background-color: #272822;
        }
        
        .language-python {
          color: #f8f8f2;
          background-color: #272822;
        }
        
        .language-css {
          color: #f8f8f2;
          background-color: #272822;
        }
      </style>
    </head>
    <body>
      <h1>Test Page for Code Element Styles</h1>
      
      <p>This is a paragraph with <code>inline code</code> in it.</p>
      
      <div class="code-block">
        <pre><code class="language-javascript">function helloWorld() {
  console.log("Hello, world!");
  return true;
}</code></pre>
      </div>
      
      <div class="code-block">
        <pre><code class="language-python">def hello_world():
    print("Hello, world!")
    return True</code></pre>
      </div>
      
      <div class="code-block">
        <pre><code class="language-css">.code-block {
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 0.375rem;
}</code></pre>
      </div>
    </body>
    </html>
    `;
    
    // Set the content directly
    await page.setContent(testHtml);
    
    // Inspect code elements on the page
    console.log('Inspecting code elements...');
    
    // Look for code blocks
    const codeBlocks = await page.$$('pre code');
    console.log(`Found ${codeBlocks.length} code blocks`);
    
    for (let i = 0; i < codeBlocks.length; i++) {
      const block = codeBlocks[i];
      const textContent = await block.textContent();
      console.log(`Code block ${i + 1}:`, textContent.substring(0, 50) + '...');
      
      // Get computed styles
      const styles = await page.evaluate(el => {
        const computedStyles = window.getComputedStyle(el.parentElement);
        return {
          backgroundColor: computedStyles.backgroundColor,
          color: computedStyles.color,
          fontFamily: computedStyles.fontFamily,
          fontSize: computedStyles.fontSize,
          padding: computedStyles.padding,
          border: computedStyles.border,
          borderRadius: computedStyles.borderRadius,
          overflowX: computedStyles.overflowX,
          margin: computedStyles.margin
        };
      }, block);
      
      console.log(`Styles for code block ${i + 1}:`, JSON.stringify(styles, null, 2));
    }
    
    // Look for inline code elements
    const inlineCodes = await page.$$('code:not(pre code)');
    console.log(`Found ${inlineCodes.length} inline code elements`);
    
    for (let i = 0; i < inlineCodes.length; i++) {
      const inlineCode = inlineCodes[i];
      const textContent = await inlineCode.textContent();
      console.log(`Inline code ${i + 1}:`, textContent);
      
      // Get computed styles
      const styles = await page.evaluate(el => {
        const computedStyles = window.getComputedStyle(el);
        return {
          backgroundColor: computedStyles.backgroundColor,
          color: computedStyles.color,
          fontFamily: computedStyles.fontFamily,
          fontSize: computedStyles.fontSize,
          padding: computedStyles.padding,
          border: computedStyles.border,
          borderRadius: computedStyles.borderRadius,
          display: computedStyles.display
        };
      }, inlineCode);
      
      console.log(`Styles for inline code ${i + 1}:`, JSON.stringify(styles, null, 2));
    }
    
    // Check for any conflicting styles
    console.log('Checking for potential style conflicts...');
    
    // Look for elements with class names related to code
    const codeRelatedElements = await page.$$('.code-block, pre, code');
    console.log(`Found ${codeRelatedElements.length} code-related elements`);
    
    // Check specificity of CSS rules
    for (let i = 0; i < Math.min(3, codeRelatedElements.length); i++) {
      const element = codeRelatedElements[i];
      const tagName = await element.evaluate(el => el.tagName);
      const className = await element.getAttribute('class');
      
      console.log(`Element ${i + 1}: ${tagName} with classes: ${className}`);
    }
    
    console.log('Script completed successfully!');
    
  } catch (error) {
    console.error('Error during script execution:', error);
  } finally {
    await browser.close();
  }
}

// Run the script
inspectCodeStyles().catch(console.error);