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

  function paginateVertically(sourceWidth, sourceHeight, targetWidth, targetHeight) {
    var scale = targetWidth / sourceWidth;
    var sourceSheetHeight = targetHeight / scale;
    var sheets = [];
    for (var sourceTop = 0; sourceTop < sourceHeight; sourceTop += sourceSheetHeight) {
      sheets.push({ sourceTop: sourceTop, sourceHeight: Math.min(sourceSheetHeight, sourceHeight - sourceTop), scale: scale });
    }
    return sheets;
  }

  var api = { fitInside: fitInside, resolveTargetSize: resolveTargetSize, fitPreviewCanvas: fitPreviewCanvas, paginateVertically: paginateVertically };
  root.PaperLayout = api;
  if (typeof module !== 'undefined') module.exports = api;
}(this));
