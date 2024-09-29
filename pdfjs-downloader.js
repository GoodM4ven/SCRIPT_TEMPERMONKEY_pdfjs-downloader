// ==UserScript==
// @name         PDF.js Downloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Intercept PDF.js initialization and download the captured PDF file
// @run-at       document-start
// @grant        none
// ==/UserScript==

(
  function() {
    'use strict';

    function downloadPDF(pdfDocument) {
      pdfDocument.getData().then(function(data) {
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        // * Create an anchor element to click and download the blob
        const a = document.createElement('a');
        a.href = url;
        a.download = 'downloaded.pdf'; // * The file name
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // * Handle the object URL after downloading
        URL.revokeObjectURL(url);
      });
    }

    function waitForPDFViewerApplication() {
      if (typeof window.PDFViewerApplication !== 'undefined' &&
        typeof window.PDFViewerApplication.pdfDocument !== 'undefined' &&
        window.PDFViewerApplication.pdfDocument !== null) {
        downloadPDF(window.PDFViewerApplication.pdfDocument);
      } else {
        setTimeout(waitForPDFViewerApplication, 1000); // * Repeat every second
      }
    }

    // * Utilize a MutationObserver to detect loading the document by PDF.js
    function observeDocumentLoad() {
      const viewerContainer = document.getElementById('viewerContainer');

      if (!viewerContainer) return;

      const observer = new MutationObserver(function(mutationsList, observer) {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList' && window.PDFViewerApplication.pdfDocument) {
            observer.disconnect();

            downloadPDF(window.PDFViewerApplication.pdfDocument);
          }
        }
      });

      observer.observe(viewerContainer, { childList: true, subtree: true });
    }

    // * Start observing
    waitForPDFViewerApplication();
    observeDocumentLoad();
  }
)();
