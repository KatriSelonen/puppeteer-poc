var fs = require('fs');

require.extensions['.html'] = function(module, filename) {
  module.exports = fs.readFileSync(filename, 'utf8');
};

// Create pdf part from html
const puppeteer = require('puppeteer');
const html = require('./part.html');

async function createPDFfromHTML() {
  console.log('Creating pdf from html...');

  const browser = await puppeteer.launch({ args: ['--disable-web-security'] });
  const page = await browser.newPage();

  await page.goto(`data:text/html,${html}`, { waitUntil: 'networkidle0' });
  await page.emulateMedia('screen');
  await page._emulationManager._client.send(
    'Emulation.setDefaultBackgroundColorOverride',
    { color: { r: 0, g: 0, b: 0, a: 0 } }
  );
  await page.pdf({
    path: 'part.pdf',
    width: '155mm',
    height: '97mm',
    pageRanges: '1',
    printBackground: true
  });

  await browser.close();

  console.log('Done! Saved content from part.html to part.pdf');
}

// Overlay pdf part to base pdf to create complete pdf
const hummus = require('hummus');

async function overlayPDFFromFiles(pdfWriter, templateFile, partFile) {
  const templateReader = hummus.createReader(templateFile);
  const templateDimensions = templateReader.parsePage(0).getMediaBox();
  const pages = templateReader.getPagesCount();

  console.log('template dimensions', templateDimensions, 'pages', pages);

  for (let pagenum = 0; pagenum < pages; pagenum++) {
    console.log(`Writing page ${pagenum}...`);
    const page = pdfWriter.createPage(...templateDimensions);

    const context = pdfWriter.startPageContentContext(page);

    pdfWriter.mergePDFPagesToPage(page, templateFile, {
      type: hummus.eRangeTypeSpecific,
      specificRanges: [[pagenum, pagenum]]
    });
    console.log('Merged template to page');

    // Put part on second page
    if (pagenum === 1) {
      const formIDs = pdfWriter.createFormXObjectsFromPDF(
        partFile,
        hummus.ePDFPageBoxMediaBox
      );
      context
        .q()
        .cm(1, 0, 0, 1, 20, 20) // relative width, rotation ,rotation, relative height, left, bottom
        .doXObject(
          page.getResourcesDictionary().addFormXObjectMapping(formIDs[0])
        )
        .Q();
      console.log('Merged part to page');
    }

    pdfWriter.writePage(page);
  }

  console.log('Merging complete');
  return pdfWriter;
}

async function writeLayersToPDF() {
  const pdfWriter = hummus.createWriter('./complete.pdf');
  try {
    await overlayPDFFromFiles(pdfWriter, './base.pdf', './part.pdf');
    pdfWriter.end();
  } catch (e) {
    throw e;
  }
}

(async () => {
  await createPDFfromHTML();
  await writeLayersToPDF();
})();
