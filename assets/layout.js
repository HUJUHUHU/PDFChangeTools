(function (root) {
  'use strict';

  function round(value, decimals) {
    var factor = Math.pow(10, decimals || 4);
    return Math.round(value * factor) / factor;
  }

  function fitInside(sourceWidth, sourceHeight, targetWidth, targetHeight) {
    var scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
    var width = sourceWidth * scale;
    var height = sourceHeight * scale;
    return { scale: scale, width: width, height: height, x: (targetWidth - width) / 2, y: (targetHeight - height) / 2 };
  }

  function resolveTargetSize(size, orientation, sourceOrientation) {
    var shouldLandscape = orientation === 'landscape' || (orientation === 'keep' && sourceOrientation === 'landscape');
    var shortEdge = Math.min(size.widthMm, size.heightMm);
    var longEdge = Math.max(size.widthMm, size.heightMm);
    return shouldLandscape ? { widthMm: longEdge, heightMm: shortEdge, orientation: 'landscape' } : { widthMm: shortEdge, heightMm: longEdge, orientation: 'portrait' };
  }

  function fitPreviewCanvas(width, height, pixelRatio, maxEdge) {
    var scale = Math.min(pixelRatio, maxEdge / Math.max(width, height));
    return { width: Math.round(width * scale), height: Math.round(height * scale), scale: round(scale, 4) };
  }

  function paginateVertically(sourceWidth, sourceHeight, targetWidth, targetHeight, textRows) {
    var scale = targetWidth / sourceWidth;
    var sourceSheetHeight = targetHeight / scale;
    var sheets = [];
    var sourceTop = 0;
    while (sourceTop < sourceHeight) {
      var idealBottom = Math.min(sourceTop + sourceSheetHeight, sourceHeight);
      var sourceBottom = chooseSafeBreak(sourceTop, idealBottom, sourceHeight, textRows || []);
      sheets.push({ sourceTop: sourceTop, sourceHeight: sourceBottom - sourceTop, scale: scale });
      sourceTop = sourceBottom;
    }
    return sheets;
  }

  function chooseSafeBreak(sourceTop, idealBottom, sourceHeight, textRows) {
    if (idealBottom >= sourceHeight || !textRows.length) return idealBottom;
    var lastRow = null;
    var previousBottom = sourceTop;
    for (var index = 0; index < textRows.length; index++) {
      var row = textRows[index];
      if (row.bottom <= sourceTop + 1) continue;
      var gapStart = Math.max(previousBottom, sourceTop);
      var gapEnd = row.top;
      if (row.bottom <= idealBottom) lastRow = { top: row.top, bottom: row.bottom };
      if (row.top > idealBottom) break;
      previousBottom = Math.max(previousBottom, row.bottom);
    }
    return lastRow ? lastRow.bottom : idealBottom;
  }

  function getPaginationY(sourceHeight, targetHeight, sheet) {
    return targetHeight - sourceHeight * sheet.scale + sheet.sourceTop * sheet.scale;
  }

  var api = { fitInside: fitInside, resolveTargetSize: resolveTargetSize, fitPreviewCanvas: fitPreviewCanvas, paginateVertically: paginateVertically, getPaginationY: getPaginationY };
  root.PaperLayout = api;
  if (typeof module !== 'undefined') module.exports = api;
}(this));
