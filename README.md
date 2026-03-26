# MergeCanvas

在线无损拼图工具 —— 纯前端、本地处理、快速导出。

## 功能

- **多图拼接**：上传多张图片，支持纵向/横向拼接
- **拖拽排序**：上下移动调整图片顺序
- **缩略图预览**：图片列表显示缩略图
- **自动统一尺寸**：纵向拼接时自动对齐宽度，横向拼接时自动对齐高度
- **逐图缩放**：单独调整每张图的缩放比例，双击重置
- **逐图裁切**：百分比裁切四边，支持可视化拖拽裁切（双击退出）
- **间距控制**：预设 + 滑条调整图片间距
- **对齐方式**：起始/居中/末端对齐
- **背景色**：自定义画布背景色
- **多行文字**：添加多组文字，支持换行、拖拽定位、边缘吸附
- **文字样式**：字号、颜色、边距（吸附偏移量）
- **预览质量**：可调节预览分辨率，不影响导出
- **导出 PNG / JPEG**：支持 JPEG 质量调节、1x/2x 导出倍率
- **数值拖拽**：所有数值输入支持双击+上下拖拽快速调整

## 技术栈

- React + TypeScript + Vite
- HTML5 Canvas 渲染与导出
- 纯前端，无后端依赖

## 快速开始

```bash
# 安装依赖
npm install

# 开发
npm run dev

# 构建
npm run build
```

## 部署

### GitHub Pages

推送到 `main` 分支后自动通过 GitHub Actions 构建部署。

需在仓库 Settings → Pages 中将 Source 设为 **GitHub Actions**。

### Docker

```bash
docker build -t mergecanvas .
docker run -d -p 8080:80 mergecanvas
```

访问 http://localhost:8080

## License

MIT
