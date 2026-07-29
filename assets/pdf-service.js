(function (root) {
  'use strict';

  function assertLibraries() {
    if (!root.pdfjsLib || !root.PDFLib) throw new Error('PDF libraries did not load. Keep the vendor folder beside index.html.');
  }

  async function loadFile(file) {
    assertLibraries();
    var bytes = new Uint8Array(await file.arrayBuffer());
    root.pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('vendor/pdf.worker.min.js', root.location.href).href;
    var previewDocument = await root.pdfjsLib.getDocument({ data: bytes }).promise;
    return { bytes: bytes, previewDocument: previewDocument };
  }

  async function getPageDetails(previewDocument) {
    var details = [];
    for (var pageNumber = 1; pageNumber <= previewDocument.numPages; pageNumber++) {
      var page = await previewDocument.getPage(pageNumber);
      var viewport = page.getViewport({ scale: 1 });
      details.push(root.PaperSizes.describePage(viewport.width, viewport.height));
    }
    return details;
  }

  async function renderPage(previewDocument, pageNumber, canvas, targetWidth, targetHeight, placement) {
    var page = await previewDocument.getPage(pageNumber);
    var sourceViewport = page.getViewport({ scale: 1 });
    var ctx = canvas.getContext('2d', { alpha: false });
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    var pixelsPerPoint = canvas.width / targetWidth;
    ctx.translate(placement.x * pixelsPerPoint, placement.y * pixelsPerPoint);
    var renderScale = placement.scale * pixelsPerPoint;
    await page.render({ canvasContext: ctx, viewport: page.getViewport({ scale: renderScale }) }).promise;
    ctx.restore();
    return sourceViewport;
  }

  async function createResizedPdf(bytes, pageDetails, getTarget) {
    assertLibraries();
    var source = await root.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: false });
    var output = await root.PDFLib.PDFDocument.create();
    var sourcePages = await output.embedPdf(source, source.getPageIndices());
    for (var index = 0; index < sourcePages.length; index++) {
      var target = getTarget(pageDetails[index]);
      var outputPage = output.addPage([target.widthPoints, target.heightPoints]);
      var placement = root.PaperLayout.fitInside(sourcePages[index].width, sourcePages[index].height, target.widthPoints, target.heightPoints);
      outputPage.drawPage(sourcePages[index], { x: placement.x, y: placement.y, width: placement.width, height: placement.height });
    }
    return output.save();
  }

  async function createPaginatedA4Pdf(bytes, pageDetails, getTarget) {
    assertLibraries();
    var source = await root.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: false });
    var output = await root.PDFLib.PDFDocument.create();
    var sourcePages = await output.embedPdf(source, source.getPageIndices());
    for (var index = 0; index < sourcePages.length; index++) {
      var target = getTarget(pageDetails[index]);
      var sheets = root.PaperLayout.paginateVertically(sourcePages[index].width, sourcePages[index].height, target.widthPoints, target.heightPoints);
      for (var sheetIndex = 0; sheetIndex < sheets.length; sheetIndex++) {
        var sheet = sheets[sheetIndex];
        var outputPage = output.addPage([target.widthPoints, target.heightPoints]);
        outputPage.drawPage(sourcePages[index], { x: 0, y: root.PaperLayout.getPaginationY(sourcePages[index].height, target.heightPoints, sheet), width: sourcePages[index].width * sheet.scale, height: sourcePages[index].height * sheet.scale });
      }
    }
    return output.save();
  }

  root.PdfService = { loadFile: loadFile, getPageDetails: getPageDetails, renderPage: renderPage, createResizedPdf: createResizedPdf, createPaginatedA4Pdf: createPaginatedA4Pdf };
}(this));
