/**
 * Luogu code block extensions: line-numbers / lines=5-6.
 * Mounts info onto code node data / hProperties for downstream renderers.
 */
import { visit } from "unist-util-visit";

/**
 * @param {string} meta
 */
function parseMeta(meta) {
  const result = {
    lineNumbers: false,
    rawLinesSpec: null,
    ranges: [],
  };

  if (!meta || typeof meta !== "string") return result;

  const tokens = meta.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    if (token === "line-numbers" || token === "line_numbers") {
      result.lineNumbers = true;
      continue;
    }

    const m = /^lines=(.+)$/.exec(token);
    if (m) {
      const spec = m[1].trim();
      if (!spec) continue;
      result.rawLinesSpec = spec;

      const parts = spec
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const part of parts) {
        const mm = /^(\d+)(?:-(\d+))?$/.exec(part);
        if (!mm) continue;
        const start = parseInt(mm[1], 10);
        const end = mm[2] ? parseInt(mm[2], 10) : start;
        if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
        if (start <= 0 || end <= 0) continue;
        result.ranges.push({
          start: Math.min(start, end),
          end: Math.max(start, end),
        });
      }
    }
  }

  return result;
}

function applyLangDefault(node) {
  if (!node.lang || node.lang === "") {
    node.lang = "cpp";
    const anyNode = node;
    if (!anyNode.data) anyNode.data = {};
    if (!anyNode.data.hProperties) anyNode.data.hProperties = {};
    const props = anyNode.data.hProperties;
    if (!props.className) {
      props.className = ["language-cpp"];
    } else if (Array.isArray(props.className)) {
      if (!props.className.includes("language-cpp")) {
        props.className.push("language-cpp");
      }
    }
  }
}

function applyCodeMeta(node) {
  if (!node.meta) return;

  const info = parseMeta(node.meta);
  const hasHighlight = info.rawLinesSpec != null || info.lineNumbers;
  if (!hasHighlight) return;

  const anyNode = node;

  if (!anyNode.data) anyNode.data = {};
  if (!anyNode.data.hProperties) anyNode.data.hProperties = {};
  const props = anyNode.data.hProperties;

  if (info.lineNumbers) {
    props["data-ls-line-numbers"] = true;
    props["data-line-numbers"] = true;
  }

  if (info.rawLinesSpec) {
    props["data-ls-highlight-lines"] = info.rawLinesSpec;
    props["data-highlight-lines"] = info.rawLinesSpec;
    anyNode.data.lsHighlightLines = info.ranges;
  }
}

export function transformLuoguCode(tree, _processor, _file) {
  visit(tree, "code", (node) => {
    applyLangDefault(node);
    applyCodeMeta(node);
  });
}
