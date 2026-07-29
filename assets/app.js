(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var state = { file: null, bytes: null, pdf: null, pages: [], pageIndex: 0, renderId: 0, busy: false };
  var fileInput = $('pdf-file');
  var paperSelect = $('paper-size');
  var orientationSelect = $('orientation');
  var paginateCheckbox = $('a4-paginate');

  function setStatus(message, error) {
    var el = $('status');
    el.textContent = message;
    el.className = error ? 'status error' : 'status';
  }

  function mmToPoints(mm) { return mm * 72 / 25.4; }

  function getSelectedBaseSize() {
    if (paperSelect.value !== 'Custom') return PaperSizes.getTargetSize(paperSelect.value);
    var validation = PaperSizes.validateCustomSize($('custom-width').value, $('custom-height').value);
    if (!validation.valid) throw new Error('自定义宽高必须在 20 至 2000 mm 之间。');
    return validation;
  }

  function getTarget(page) {
    var target = PaperLayout.resolveTargetSize(getSelectedBaseSize(), orientationSelect.value, page.orientation);
    return {
      widthPoints: mmToPoints(target.widthMm),
      heightPoints: mmToPoints(target.heightMm),
      label: target.widthMm + ' x ' + target.heightMm + ' mm'
    };
  }

  function updateControls() {
    var ready = !!state.pdf && !state.busy;
    $('download-pdf').disabled = !ready;
    $('previous-page').disabled = !ready || state.pageIndex === 0;
    $('next-page').disabled = !ready || state.pageIndex >= state.pages.length - 1;
    $('page-indicator').textContent = state.pdf ? (state.pageIndex + 1) + ' / ' + state.pages.length : '0 / 0';
  }

  function isA4Pagination() { return paperSelect.value === 'A4' && paginateCheckbox.checked; }

  function updateA4PaginationControl() {
    $('a4-paginate-field').hidden = paperSelect.value !== 'A4';
    if (paperSelect.value !== 'A4') paginateCheckbox.checked = false;
  }

  function updateDetails() {
    if (!state.pdf) return;
    var page = state.pages[state.pageIndex];
    $('page-count').textContent = state.pages.length + ' 页';
    $('document-paper').textContent = PaperSizes.summarizePages(state.pages);
    $('current-paper').textContent = page.paperName + '，' + page.widthMm + ' x ' + page.heightMm + ' mm，' + (page.orientation === 'landscape' ? '横向' : '纵向');
  }

  function createPreviewCanvases(count) {
    var previewPages = $('preview-pages');
    previewPages.textContent = '';
    for (var index = 0; index < count; index++) {
      var canvas = document.createElement('canvas');
      canvas.id = index === 0 ? 'preview-canvas' : '';
      canvas.setAttribute('aria-label', 'PDF 纸张转换预览，第 ' + (index + 1) + ' 页');
      previewPages.appendChild(canvas);
    }
    previewPages.scrollTop = 0;
    return previewPages.querySelectorAll('canvas');
  }

  function preparePreviewCanvas(canvas, target) {
    var pixelSize = PaperLayout.fitPreviewCanvas(target.widthPoints, target.heightPoints, Math.min(window.devicePixelRatio || 1, 2), 1000);
    canvas.width = pixelSize.width;
    canvas.height = pixelSize.height;
    canvas.style.aspectRatio = target.widthPoints + ' / ' + target.heightPoints;
  }

  async function renderPreview() {
    if (!state.pdf) return;
    var renderId = ++state.renderId;
    var page = state.pages[state.pageIndex];
    var target;
    try {
      target = getTarget(page);
    } catch (error) {
      setStatus(error.message, true);
      return;
    }

    var paginated = isA4Pagination();
    var sheets = paginated ? PaperLayout.paginateVertically(
      page.widthPoints,
      page.heightPoints,
      target.widthPoints,
      target.heightPoints,
      page.textRows
    ) : null;
    var canvases;
    if (paginated) {
      canvases = createPreviewCanvases(sheets.length);
      $('preview-label').textContent = 'A4 分页预览：' + sheets.length + ' 张，可上下滑动';
    } else {
      canvases = createPreviewCanvases(1);
    }

    setStatus('正在渲染预览...');
    for (var index = 0; index < canvases.length; index++) {
      if (renderId !== state.renderId) return;
      preparePreviewCanvas(canvases[index], target);
      var placement = PaperLayout.fitInside(page.widthPoints, page.heightPoints, target.widthPoints, target.heightPoints);
      if (paginated) {
        var sheet = sheets[index];
        placement = {
          x: 0,
          y: -sheet.sourceTop * sheet.scale,
          scale: sheet.scale,
          width: page.widthPoints * sheet.scale,
          height: page.heightPoints * sheet.scale
        };
      }
      await PdfService.renderPage(state.pdf, state.pageIndex + 1, canvases[index], target.widthPoints, target.heightPoints, placement);
    }

    if (renderId !== state.renderId) return;
    if (!paginated) $('preview-label').textContent = target.label;
    setStatus('预览已更新。');
    updateControls();
  }

  async function handleFile() {
    var file = fileInput.files[0];
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      setStatus('请选择 PDF 文件。', true);
      return;
    }

    state.busy = true;
    updateControls();
    setStatus('正在读取 PDF...');
    try {
      if (state.pdf && state.pdf.destroy) await state.pdf.destroy();
      var loaded = await PdfService.loadFile(file);
      state.file = file;
      state.bytes = loaded.bytes;
      state.pdf = loaded.previewDocument;
      state.pages = await PdfService.getPageDetails(state.pdf);
      state.pageIndex = 0;
      $('file-name').textContent = file.name;
      updateDetails();
      await renderPreview();
    } catch (error) {
      setStatus('无法打开此 PDF：' + error.message, true);
    }
    state.busy = false;
    updateControls();
  }

  async function download() {
    if (!state.pdf || state.busy) return;
    state.busy = true;
    updateControls();
    setStatus('正在生成 PDF，请勿关闭页面...');
    try {
      var bytes = isA4Pagination() ? await PdfService.createPaginatedA4Pdf(state.bytes, state.pages, getTarget) : await PdfService.createResizedPdf(state.bytes, state.pages, getTarget);
      var blob = new Blob([bytes], { type: 'application/pdf' });
      var suffix = isA4Pagination() ? 'A4分页' : (paperSelect.value === 'Custom' ? '自定义尺寸' : paperSelect.value);
      var name = state.file.name.replace(/\.pdf$/i, '') + '_' + suffix + '.pdf';
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
      setStatus('已生成 PDF，请在浏览器下载记录中查看。');
    } catch (error) {
      setStatus('生成失败：' + error.message, true);
    }
    state.busy = false;
    updateControls();
  }

  fileInput.addEventListener('change', handleFile);
  paperSelect.addEventListener('change', function () {
    $('custom-fields').hidden = paperSelect.value !== 'Custom';
    updateA4PaginationControl();
    renderPreview();
  });
  orientationSelect.addEventListener('change', renderPreview);
  $('custom-width').addEventListener('input', renderPreview);
  $('custom-height').addEventListener('input', renderPreview);
  paginateCheckbox.addEventListener('change', renderPreview);
  $('previous-page').addEventListener('click', function () {
    state.pageIndex--;
    updateDetails();
    renderPreview();
  });
  $('next-page').addEventListener('click', function () {
    state.pageIndex++;
    updateDetails();
    renderPreview();
  });
  $('download-pdf').addEventListener('click', download);
  updateA4PaginationControl();
  updateControls();
}());
