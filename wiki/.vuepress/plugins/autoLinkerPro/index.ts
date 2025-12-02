// docs/.vuepress/plugins/autoLinkerPro/index.ts
import type { App, Page, Plugin } from 'vuepress';

export interface AutoLinkerProOptions {
  // 先留空，后面再扩展
}

const TARGET_TERM = '灵动骑士';
const TARGET_LINK = '/docs/world/characters/superhero/character-EtherealKnight.html';

// 简单保护代码块 / 链接 / 图片，避免在这些区域乱改
const protectSensitiveAreas = (raw: string) => {
  const placeholders: string[] = [];
  const contents: string[] = [];

  let text = raw;

  const pushPlaceholder = (match: string): string => {
    const id = `__AUTO_LINK_PRO_PLACEHOLDER_${placeholders.length}__`;
    placeholders.push(id);
    contents.push(match);
    return id;
  };

  const patterns: RegExp[] = [
    /```[\s\S]*?```/g,              // fenced code block
    /<!--[\s\S]*?-->/g,             // HTML 注释
    /!\[[^\]]*?\]\([^\)]*?\)/g,     // 图片
    /\[[^\]]+?\]\([^\)]*?\)/g,      // 普通链接
    /`[^`]*`/g,                     // 行内代码
  ];

  for (const pattern of patterns) {
    text = text.replace(pattern, m => pushPlaceholder(m));
  }

  const restore = (processed: string): string => {
    let out = processed;
    placeholders.forEach((ph, i) => {
      out = out.replace(ph, contents[i]);
    });
    return out;
  };

  return { text, restore };
};

const processPageOnce = (page: Page, app: App) => {
  // 我们现在只测试这一页：天灾
  if (page.path !== '/docs/world/characters/superhero/character-Scourge.html') return;
  if (!page.content) return;

  // 方便你看日志确认
  console.log('[autoLinkerPro TEST] before patch, path =', page.path);

  const raw = page.content;

  // 如果本身就没有“灵动骑士”，就不动
  if (!raw.includes(TARGET_TERM)) {
    console.log('[autoLinkerPro TEST] no term found in content');
    return;
  }

  const { text, restore } = protectSensitiveAreas(raw);

  // 非常粗暴：直接全局替换成 Markdown 链接
  const replaced = text.replace(
    new RegExp(TARGET_TERM, 'g'),
    `[${TARGET_TERM}](${TARGET_LINK})`,
  );

  const finalContent = restore(replaced);

  // 把修改写回 page.content
  page.content = finalContent;

  console.log('[autoLinkerPro TEST] after patch, sample =');
  console.log(finalContent.slice(0, 300)); // 打印前 300 字看一眼
};

export const autoLinkerProPlugin = (
  options: AutoLinkerProOptions = {},
): Plugin => {
  return {
    name: 'vuepress-plugin-auto-linker-pro-test',

    extendsPage(page, app) {
      // ⭐ 核心：在 extendsPage 里改 content
      processPageOnce(page, app);
    },
  };
};

export default autoLinkerProPlugin;