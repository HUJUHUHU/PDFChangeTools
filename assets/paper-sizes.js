(function (root) {
  'use strict';

  var PAPER_SIZES = {
    A0: { widthMm: 841, heightMm: 1189 },
    A1: { widthMm: 594, heightMm: 841 },
    A2: { widthMm: 420, heightMm: 594 },
    A3: { widthMm: 297, heightMm: 420 },
    A4: { widthMm: 210, heightMm: 297 },
    A5: { widthMm: 148, heightMm: 210 }
  };
  var TOLERANCE_MM = 3;

  function round(value, decimals) {
    var factor = Math.pow(10, decimals || 1);
    return Math.round(value * factor) / factor;
  }

  function pointsToMillimeters(points) {
    return round(points * 25.4 / 72, 2);
  }

  function getOrientation(width, height) {
    if (Math.abs(width - height) < 0.1) return 'square';
    return width > height ? 'landscape' : 'portrait';
  }

  function findPaper(shortEdge, longEdge) {
    var name;
    for (name in PAPER_SIZES) {
      if (Math.abs(PAPER_SIZES[name].widthMm - shortEdge) <= TOLERANCE_MM &&
          Math.abs(PAPER_SIZES[name].heightMm - longEdge) <= TOLERANCE_MM) {
        return name;
      }
    }
    return 'Custom';
  }

  function describePage(widthPoints, heightPoints) {
    var widthMm = pointsToMillimeters(widthPoints);
    var heightMm = pointsToMillimeters(heightPoints);
    var shortEdge = Math.min(widthMm, heightMm);
    var longEdge = Math.max(widthMm, heightMm);
    return {
      widthPoints: widthPoints,
      heightPoints: heightPoints,
      widthMm: widthMm,
      heightMm: heightMm,
      paperName: findPaper(shortEdge, longEdge),
      orientation: getOrientation(widthMm, heightMm)
    };
  }

  function summarizePages(pages) {
    if (!pages.length) return '';
    var first = pages[0].paperName;
    for (var i = 1; i < pages.length; i++) {
      if (pages[i].paperName !== first) return 'Mixed sizes';
    }
    return first;
  }

  function getTargetSize(name) {
    return PAPER_SIZES[name] ? { widthMm: PAPER_SIZES[name].widthMm, heightMm: PAPER_SIZES[name].heightMm } : null;
  }

  function validateCustomSize(widthMm, heightMm) {
    var width = Number(widthMm);
    var height = Number(heightMm);
    if (!isFinite(width) || !isFinite(height) || width < 20 || width > 2000 || height < 20 || height > 2000) {
      return { valid: false, message: 'Custom width and height must be between 20 and 2000 mm.' };
    }
    return { valid: true, widthMm: width, heightMm: height };
  }

  var api = { PAPER_SIZES: PAPER_SIZES, pointsToMillimeters: pointsToMillimeters, describePage: describePage, summarizePages: summarizePages, getTargetSize: getTargetSize, validateCustomSize: validateCustomSize };
  root.PaperSizes = api;
  if (typeof module !== 'undefined') module.exports = api;
}(this));
