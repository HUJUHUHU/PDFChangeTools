# PDF 纸张转换（Android 离线版）

这是一个完全在浏览器本地处理 PDF 的工具。它能识别 PDF 每页的纸张类型，预览缩放到目标纸张后的效果，并下载新的 PDF。

## 手机离线使用

1. 下载 `pdf-paper-tool-offline.zip` 并完整解压到 Android 手机存储。
2. 在文件管理器中点开解压目录内的 `index.html`，使用 Chrome 打开。
3. 点击“从手机选择 PDF”，选择需要转换的 PDF。
4. 查看识别到的纸张尺寸，选择目标纸张及页面方向。
5. 在预览区确认效果，点击“生成并下载 PDF”。

网页、预览、转换和下载都不需要网络。不要只复制 `index.html`，必须保留同级的 `assets` 和 `vendor` 文件夹。

## 转换规则

- 支持 A0、A1、A2、A3、A4、A5 和 20 至 2000 mm 的自定义尺寸。
- 默认等比例缩放、居中，不裁剪也不拉伸页面内容。
- 可选择保持每页原方向、统一纵向或统一横向。
- 混合纸张尺寸的 PDF 会逐页识别；导出时统一使用所选目标纸张。

## 已知限制

- 加密且需要密码的 PDF 不能处理。
- 页面非常多或含大量高清图片的 PDF 可能超过手机可用内存。
- 最终应在 Android Chrome 的飞行模式下打开 `index.html` 验证离线流程。

## 开发检查

在 Windows PowerShell 中运行：

```powershell
cscript.exe //nologo tests\run-tests.js
.\scripts\verify-offline-package.ps1
.\scripts\build-release.ps1
```
