# 代码、素材与第三方许可

本项目原创代码及开发文档按根目录 [MIT License](LICENSE) 提供；第三方内容保留原许可。MIT 代码许可不自动授权使用品牌标识、字体或其他非代码素材，也不包含生产服务、账号、数据库、密钥及用户上传内容。

## 字体

| 文件 | 作者与许可 |
| --- | --- |
| `public/fonts/Fredoka-Variable.ttf` | Copyright 2016 The Fredoka Project Authors；[SIL OFL 1.1](public/fonts/OFL-Fredoka.txt) |
| `public/fonts/ZCOOLKuaiLe-Regular.ttf` | Copyright 2018 The ZCOOL KuaiLe Project Authors；[SIL OFL 1.1](public/fonts/OFL-ZCOOL-KuaiLe.txt) |

分发字体须同时保留对应原始许可，不将字体改标为 MIT。

## 图片与品牌

- `public/demo-wardrobe/` 与 `public/test-wardrobe/`：2026-09-16 项目负责人确认，早期 24 张演示衣物及 10 张测试图片为本项目 AI 生成或已获授权素材，可随项目公开。该确认不代表所有图片均为同一种来源，也不是对第三方无限再授权的声明。其余 4 张正式胶囊衣物在开发记录中记为项目生成素材。
- `public/brand/`：衣拍即合 / Ensemble 的品牌图标及动画，不因代码 MIT 许可自动获得商标、品牌使用或背书权。发布自己的衍生产品请更换品牌标识。
- `public/virtual-models/`：历史功能使用的无脸比例参照素材，不代表真实人物、真实试穿效果或当前功能承诺。
- 上述非代码图片未另行授予 MIT 素材许可；需要独立复用或商用时请联系维护者核实具体授权。AI 生成内容的公开不构成排他版权保证。
- 模板附带的 Next.js / Vercel 标识不代表平台对本项目的背书，不授予其商标权。参考设计截图和用户私人图片不属于开源代码授权范围。

## Spec Kit

`.agents/skills/speckit-*` 与 `.specify/` 中的工具、模板包含基于 [GitHub Spec Kit](https://github.com/github/spec-kit) 的内容及本项目修改；原项目 [MIT 许可](https://github.com/github/spec-kit/blob/main/LICENSE) 如下：

```text
MIT License

Copyright GitHub, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 运行依赖与资讯

Next.js、React、Supabase SDK、Tailwind、Lucide、shadcn、Sharp 等依赖继续适用各自发行包附带的许可；锁定版本见 `package-lock.json`。本文件不替代依赖原始版权声明。

资讯来源文章、标题、商标和外链保留原权利；项目代码开源不意味着资讯源内容也开源。不要将用户数据、供应商凭据或抓取的全文打包发布。
