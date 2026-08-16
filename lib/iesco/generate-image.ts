import { chromium } from "playwright";

/**
 * Server-side utility to render PITC bill HTML inside headless Chromium
 * and capture high-resolution PNG screenshot of the bill container.
 */
export async function generateBillImage(html: string): Promise<Buffer> {
  // Ensure relative resources (CSS, images, fonts) resolve against PITC domain
  let processedHtml = html;
  if (!processedHtml.includes("<base ")) {
    if (processedHtml.includes("<head>")) {
      processedHtml = processedHtml.replace(
        "<head>",
        '<head><base href="https://bill.pitc.com.pk/">'
      );
    } else if (processedHtml.includes("<HEAD>")) {
      processedHtml = processedHtml.replace(
        "<HEAD>",
        '<HEAD><base href="https://bill.pitc.com.pk/">'
      );
    } else {
      processedHtml = `<base href="https://bill.pitc.com.pk/">` + processedHtml;
    }
  }

  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1200, height: 1600 },
      deviceScaleFactor: 2, // High DPI / sharp rendering
    });

    const page = await context.newPage();

    // Render HTML and wait until network idle for images/stylesheets to load
    await page.setContent(processedHtml, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Inject CSS to permanently hide PITC's loading overlay modal and unblur content
    await page.addStyleTag({
      content: `
        #loader-container,
        .bill-loader,
        .bill-loader__icon,
        .bill-loader__title,
        .bill-loader__bar,
        .bill-loader__meta,
        #loading-bar,
        #loading-text,
        #loading-percent {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        body, #maincontent-1, .maincontent-1, .gbn-print-root, * {
          filter: none !important;
          backdrop-filter: none !important;
          opacity: 1 !important;
        }
      `,
    });

    // Clean DOM of any leftover loading elements
    await page.evaluate(() => {
      const loader = document.getElementById("loader-container");
      if (loader) loader.remove();
      const loaders = document.querySelectorAll(
        ".bill-loader, .bill-loader__icon, .bill-loader__title, .bill-loader__bar, .bill-loader__meta, #loading-bar, #loading-text, #loading-percent"
      );
      loaders.forEach((el) => el.remove());

      // Ensure all images are loaded
      const images = Array.from(document.querySelectorAll("img"));
      return Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    }).catch(() => {});

    // Wait for fonts to load
    await page.evaluate(() => document.fonts?.ready).catch(() => {});

    // Selectors to search for the bill container in order of preference
    const candidateSelectors = [
      "#maincontent-1",
      ".maincontent-1",
      "#printableArea",
      ".bill-container",
      ".bill-box",
      "#bill-container",
      "table.bill-table",
      "div.bill-main",
    ];

    let targetElement = null;

    for (const selector of candidateSelectors) {
      const locator = page.locator(selector).first();
      const count = await locator.count().catch(() => 0);
      if (count > 0 && (await locator.isVisible().catch(() => false))) {
        targetElement = locator;
        console.log(`Found bill container with selector: ${selector}`);
        break;
      }
    }

    // Fallback if no container selector matched
    if (!targetElement) {
      const bodyLocator = page.locator("body");
      if (await bodyLocator.isVisible().catch(() => false)) {
        targetElement = bodyLocator;
        console.log("Fallback: capturing full body");
      } else {
        throw new Error("Could not locate bill container element in rendered HTML.");
      }
    }

    const pngBuffer = await targetElement.screenshot({
      type: "png",
      animations: "disabled",
    });

    return pngBuffer;
  } finally {
    await browser.close().catch(() => {});
  }
}
