# 在线无损拼图工具项目文档

## 1. 项目定位

你要做的是一个**纯前端在线图片拼图工具**，核心目标是：

- **无损拼图**：上传后的图片在导出时不做额外压缩，尽量保持原始质量。
- **支持文字输入**：可在拼图画布中添加标题、标签、注释、水印说明等。
- **浏览器本地处理**：尽量在前端完成，不依赖后端，降低维护成本。
- **快速部署**：直接部署到 GitHub Pages。
- **低成本维护**：通过 GitHub Actions 自动构建和发布。

这类工具很适合做成静态站点，因为 GitHub Pages 原生支持托管 HTML / CSS / JS 静态内容。citeturn598847search8turn598847search1

---

## 2. 名字建议

下面是一些适合这个工具的名字，按风格分组。

### 2.1 偏产品化、适合上线

1. **拼字板**
   - 含义：既能拼图，也能加字。
   - 优点：中文好记，直观。

2. **图拼字**
   - 含义：图片拼接 + 文字编辑。
   - 优点：功能表达直接。

3. **拼图工坊**
   - 含义：更像一个轻量创作工具。
   - 优点：有一点品牌感。

4. **无损拼图**
   - 含义：直接突出核心卖点。
   - 优点：SEO 友好，用户一眼能懂。

### 2.2 偏英文品牌化

1. **MergeCanvas**
   - Merge：拼接
   - Canvas：画布
   - 适合做成独立产品名。

2. **PicWeave**
   - Pic + Weave（编织、拼接）
   - 更偏轻盈设计工具风格。

3. **LosslessLayup**
   - 强调无损拼接
   - 更技术向。

4. **PatchBoard**
   - 像把图块贴到板子上
   - 简洁、好记。

### 2.3 我最推荐的组合

如果你想要一个既能长期用、又适合 GitHub 仓库命名的方案，我建议：

- **中文名：拼字板**
- **英文名：MergeCanvas**
- **仓库名：mergecanvas**

原因：

- 中文名容易给中文用户理解。
- 英文名适合做网址、仓库名、logo。
- `mergecanvas` 简单，适合后续扩展，不会把产品限制死在“只拼图”。

---

## 3. 功能建议

## 3.1 第一版最小可用功能（MVP）

建议第一版只做这些：

- 上传多张图片
- 拖拽排序
- 横向 / 纵向拼接
- 自定义间距
- 自定义背景色
- 设置对齐方式（左对齐 / 居中 / 右对齐）
- 添加文字
- 设置字体大小、颜色、位置
- 导出 PNG
- 导出 JPEG（可选质量）
- 导出时支持原始分辨率或自定义倍率

## 3.2 第二版可增强功能

- 画布自由布局
- 支持给每张图单独加边框
- 支持阴影、圆角
- 支持模板（长图、九宫格、横版封面）
- 支持多文本框
- 支持撤销 / 重做
- 支持保存工程 JSON
- 支持重新打开编辑

## 3.3 “无损”要怎么理解

严格来说：

- 如果输出格式是 **PNG**，通常更容易保持无损。
- 如果输出格式是 **JPEG**，天然是有损压缩。
- 如果原图本身是 JPEG，那么“无损拼图”更准确的表达应该是：
  - **尽量不做额外缩放**
  - **尽量不重复压缩**
  - **优先导出 PNG 或原始像素画布**

所以产品文案建议写成：

> 本工具默认在浏览器本地处理图片，尽量保留原始尺寸与清晰度，推荐导出 PNG 以获得最佳无损效果。

---

## 4. 技术方案建议

## 4.1 推荐技术栈

如果你想后续维护轻松，我建议：

- **前端框架**：React + Vite
- **样式**：Tailwind CSS 或普通 CSS
- **画布处理**：HTML5 Canvas
- **拖拽排序**：dnd-kit 或原生拖拽
- **文本编辑**：基于 Canvas 自绘，或者 DOM 覆盖层 + 导出时合成
- **部署**：GitHub Pages
- **自动发布**：GitHub Actions

## 4.2 为什么适合 GitHub Pages

GitHub Pages 是静态网站托管服务，适合直接托管前端生成的 HTML / CSS / JavaScript 文件。citeturn598847search8

你的项目如果是：

- 无登录
- 无数据库
- 无服务端 API
- 所有图片都在用户浏览器本地处理

那就非常适合 GitHub Pages。

---

## 5. 部署到 GitHub 用户域名

GitHub 官方的用户站点仓库命名规则是：

- 仓库名必须是：`username.github.io`

也就是说，如果你的 GitHub 用户名是 `robotlab`，那么用户域名仓库应该叫：

- `robotlab.github.io`

这样站点会直接发布到：

- `https://robotlab.github.io/`

这是 GitHub Pages 的官方用户站点方式。citeturn598847search1

## 5.1 两种部署方式的区别

### 方案 A：直接部署到用户主页根域名

仓库：`username.github.io`

访问地址：

- `https://username.github.io/`

优点：

- 地址最短
- 品牌感最好
- 适合作为主站

缺点：

- 这个仓库通常只能承载一个主站项目

### 方案 B：部署到项目子路径

仓库：`mergecanvas`

访问地址：

- `https://username.github.io/mergecanvas/`

优点：

- 不占用用户主站仓库
- 适合做单独工具项目

缺点：

- URL 会多一层路径

## 5.2 我对你的建议

如果这个拼图工具是你未来重点维护的产品：

- 直接用 **`username.github.io`** 仓库部署

如果你只是想先快速试做一个工具：

- 先用 **`mergecanvas`** 仓库部署到子路径
- 后续成熟了再迁到 `username.github.io`

---

## 6. GitHub Actions 自动发布方案

GitHub 官方说明，GitHub Pages 可以从分支发布，也可以使用 **GitHub Actions 工作流** 进行发布；当你需要自定义构建流程时，推荐使用 GitHub Actions。citeturn598847search0turn598847search12

这正适合 Vite / React 项目。

### 6.1 你要的维护效果

理想流程：

1. 你把代码 push 到 `main`
2. GitHub Actions 自动安装依赖
3. 自动执行 `npm run build`
4. 自动发布到 GitHub Pages
5. 几十秒内网页更新

这就是最省事的维护方式。

---

## 7. 推荐仓库结构

```text
mergecanvas/
├─ public/
├─ src/
│  ├─ components/
│  ├─ hooks/
│  ├─ utils/
│  ├─ App.tsx
│  └─ main.tsx
├─ .github/
│  └─ workflows/
│     └─ deploy.yml
├─ index.html
├─ package.json
├─ vite.config.ts
└─ README.md
```

---

## 8. GitHub Actions 工作流示例

下面这份适用于 Vite 项目，可直接作为基础版本：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```
```

GitHub 官方支持通过自定义 Actions 工作流来发布 Pages 站点。citeturn598847search0

---

## 9. Vite 配置注意事项

如果你部署在项目子路径，例如：

- `https://username.github.io/mergecanvas/`

那么 `vite.config.ts` 里要配置：

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/mergecanvas/',
})
```

如果你部署在用户根域名：

- `https://username.github.io/`

那么可以用：

```ts
base: '/'
```

这是 Pages 项目最容易踩坑的点之一。路径不对，通常就会出现资源 404。GitHub 官方也专门列出 Pages 常见 404 问题和入口文件、构建产物顶层结构等要求。citeturn598847search14turn598847search2

---

## 10. GitHub Pages 配置步骤

### 10.1 创建仓库

如果用用户主页：

- 新建仓库：`username.github.io`

如果用项目页：

- 新建仓库：`mergecanvas`

### 10.2 推送项目代码

把前端代码推送到 `main` 分支。

### 10.3 开启 Pages

进入仓库：

- `Settings`
- `Pages`
- `Build and deployment`
- `Source` 选择 **GitHub Actions**

GitHub 官方明确支持把 GitHub Actions 作为 GitHub Pages 的发布来源。citeturn598847search0

### 10.4 自动发布

当你 push 到 `main` 后，Actions 会自动构建并部署。

---

## 11. 自定义域名（可选）

以后如果你想让网址更像产品，可以绑定自己的域名，比如：

- `mergecanvas.com`
- `pinziban.com`
- `joinpic.tools`

GitHub Pages 支持自定义域名。citeturn598847search6turn598847search11

要注意两点：

1. 如果你使用的是 **自定义 GitHub Actions 工作流** 发布 Pages，GitHub 不会自动帮你创建 `CNAME` 文件，也不会依赖仓库里的旧 `CNAME` 文件。自定义域名建议在仓库的 Pages 设置中直接填写。citeturn598847search4
2. 最好做域名验证，防止域名被接管风险。citeturn598847search13

此外，GitHub Pages 支持 HTTPS；使用 `github.io` 域名时会自动启用 HTTPS。citeturn598847search9

---

## 12. README 可以怎么写

建议首页 README 结构：

```md
# MergeCanvas

一个在线无损拼图工具，支持多图拼接、文字输入、浏览器本地处理与快速导出。

## Features
- 多图拼接
- 支持文字输入
- 本地处理，保护隐私
- 导出高清 PNG
- GitHub Pages 在线访问

## Tech Stack
- React
- Vite
- Canvas
- GitHub Pages
- GitHub Actions

## Development
npm install
npm run dev

## Build
npm run build

## Deploy
Push 到 main 分支后自动部署到 GitHub Pages。
```

---

## 13. 维护建议

## 13.1 最省心的更新模式

以后你只要：

- 本地改代码
- `git add .`
- `git commit -m "update layout"`
- `git push`

剩下的构建和部署都交给 Actions。

GitHub Actions 本身就是 GitHub 官方提供的 CI/CD 自动化平台，很适合做这种自动构建与自动发布。citeturn598847search7turn598847search10

## 13.2 建议加的质量保障

后续可以在 Actions 里加入：

- `npm run lint`
- `npm run type-check`
- `npm run build`

这样每次提交都能自动检查项目有没有明显问题。

---

## 14. 最终推荐方案

如果让我直接替你定一个可落地方案，我会这样建议：

### 产品命名

- 中文名：**拼字板**
- 英文名：**MergeCanvas**
- 仓库名：**mergecanvas**

### 技术路线

- React + Vite
- Canvas 做拼图和文字渲染
- GitHub Pages 部署
- GitHub Actions 自动发布

### 部署路线

初期：

- 先部署到 `https://username.github.io/mergecanvas/`

成熟后：

- 再迁移到 `https://username.github.io/`
- 或者绑定独立域名

### 核心卖点文案

> 一个浏览器本地处理的在线拼图工具，支持多图无损拼接与文字输入，打开即用，无需安装。

---

## 15. 一句话总结

这个项目非常适合用 **GitHub Pages + GitHub Actions** 来做：

- 不需要服务器
- 成本低
- 维护轻
- 更新快
- 非常适合前端工具站

而从产品命名上，**拼字板 / MergeCanvas** 是我认为最平衡、最适合长期使用的一组方案。

# MergeCanvas
