// wiki/.vuepress/scripts/syncMeiliPv.js

const MEILI_HOST = process.env.MEILI_HOST;              // 例如 http://47.99.85.126:7700 或以后的 https://search.zenithworld.top
const MEILI_KEY = process.env.MEILI_MASTER_KEY;         // Master key
const INDEX_UID = process.env.MEILI_INDEX_UID || "wiki";
const STATS_API = "https://comment.zenithworld.top";

if (!MEILI_HOST || !MEILI_KEY) {
  console.error("❌ 请设置 MEILI_HOST 和 MEILI_MASTER_KEY 环境变量");
  process.exit(1);
}

// 把 path 统一成“无 .html、无末尾 /、无 /docs 前缀”的格式
function normalizePath(path) {
  if (!path) return "/";

  // 确保只要 pathname
  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const u = new URL(path);
      path = u.pathname || "/";
    }
  } catch (_) {}

  // 去掉 /docs 前缀（以前抓取时有 /docs 的情况）
  path = path.replace(/^\/docs(?=\/|$)/, "");

  // 去掉 index.html
  path = path.replace(/index\.html$/, "");

  // 去掉 .html
  path = path.replace(/\.html$/, "");

  // 去掉末尾 /
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  return path || "/";
}

async function main() {
  console.log("🚀 开始同步 Meili 文档 PV 权重...");

  // 1. 从统计 API 获取全部历史 PV
  const pvRes = await fetch(`${STATS_API}/api/popular?days=36500&limit=20000`);
  const pvJson = await pvRes.json();
  if (!pvJson.ok) {
    console.error("❌ 访问统计 API 出错：", pvJson);
    process.exit(1);
  }

  const pvMap = new Map();
  for (const item of pvJson.items || []) {
    const key = normalizePath(item.path);
    pvMap.set(key, item.pv || 0);
  }

  console.log(`✅ 从统计 API 获取到 ${pvMap.size} 条 PV 记录`);

  // 2. 从 Meili 拉出所有文档
  const docsRes = await fetch(
    `${MEILI_HOST}/indexes/${INDEX_UID}/documents?limit=20000`,
    {
      headers: {
        Authorization: `Bearer ${MEILI_KEY}`,
      },
    }
  );

  const docsJson = await docsRes.json();
  // 兼容两种格式：数组 或 { results: [...] }
  const docs = Array.isArray(docsJson) ? docsJson : (docsJson.results || []);

  console.log("ℹ️ Meili documents 原始返回结构：", docsJson);
  console.log(`✅ 从 Meili 获取到 ${docs.length} 条文档`);

  // 3. 构造更新列表：只更新 id + pv
  const updates = [];
  for (const doc of docs) {
    const url = doc.url || "";
    const key = normalizePath(url);
    const pv = pvMap.get(key) || 0;

    updates.push({
      id: doc.id, // docs-scraper 默认 primaryKey = id
      pv,
    });
  }

  console.log(`🔧 准备更新 ${updates.length} 条文档的 pv 字段`);

  // 4. 分批写回 Meili
  const batchSize = 1000;
  for (let i = 0; i < updates.length; i += batchSize) {
    const chunk = updates.slice(i, i + batchSize);
    console.log(`📦 更新文档 ${i + 1} ~ ${i + chunk.length}`);

    const updateRes = await fetch(
      `${MEILI_HOST}/indexes/${INDEX_UID}/documents`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MEILI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      }
    );

    const updateJson = await updateRes.json();
    console.log("  ↳ Meili 任务：", updateJson);
  }

  console.log("🎉 PV 同步完成");
}

main().catch((err) => {
  console.error("❌ 同步过程中出错：", err);
  process.exit(1);
});