/**
 * @luogu-discussion-archive/remark-lda-lfm
 * Ported from luogu-archive (AGPL-3.0-or-later).
 * Luogu-flavored remark plugin: directive / gfm extensions / link rewriting.
 */

import {
  directiveFromMarkdown,
  directiveToMarkdown,
} from "mdast-util-directive";
import {
  gfmAutolinkLiteralFromMarkdown,
  gfmAutolinkLiteralToMarkdown,
} from "mdast-util-gfm-autolink-literal";
import {
  gfmFootnoteFromMarkdown,
  gfmFootnoteToMarkdown,
} from "mdast-util-gfm-footnote";
import {
  gfmStrikethroughFromMarkdown,
  gfmStrikethroughToMarkdown,
} from "mdast-util-gfm-strikethrough";
import { gfmTableFromMarkdown, gfmTableToMarkdown } from "mdast-util-gfm-table";
import {
  gfmTaskListItemFromMarkdown,
  gfmTaskListItemToMarkdown,
} from "mdast-util-gfm-task-list-item";
import { toString } from "mdast-util-to-string";
import { directive } from "micromark-extension-directive";
import { gfmAutolinkLiteral } from "micromark-extension-gfm-autolink-literal";
import { gfmFootnote } from "micromark-extension-gfm-footnote";
import { gfmStrikethrough } from "micromark-extension-gfm-strikethrough";
import { gfmTable } from "micromark-extension-gfm-table";
import { gfmTaskListItem } from "micromark-extension-gfm-task-list-item";
import { visit } from "unist-util-visit";

import { transformLuoguCode } from "./luogu-code.js";
import { transformLuoguDirectives } from "./luogu-directives.js";
import { transformLuoguTables } from "./luogu-tables.js";

const mentionRegexes = [
  /^luogu:\/\/user\/(\d+)$/,
  /^\/user\/(\d+)$/,
  /^\/space\/show\?uid=(\d+)$/,
  /^https:\/\/www\.luogu\.com\.cn\/user\/(\d+)$/,
];

const discussionRegexes = [
  /^https?:\/\/(?:www\.luogu\.com(?:\.cn)?|www\.luogu\.com\.co|www\.luogu\.me|(?:www\.)?luogu\.qzz\.io|luogu\.gengen\.qzz\.io|lg\.gengen\.qzz\.io)\/discuss\/(\d+)\/?(?:\?.*)?(?:#.*)?$/,
  /^https?:\/\/www\.luogu\.com\.cn\/discuss\/show\/(\d+)\/?(?:\?.*)?(?:#.*)?$/,
  /^https?:\/\/lglg\.top\/(\d+)(?:\/.*)?(?:\?.*)?(?:#.*)?$/,
  /^https?:\/\/luogu\.store\/d\/(\d+)(?:@([a-z0-9]+))?(?:\?.*)?(?:#.*)?$/,
];

const articleRegexes = [
  /^https?:\/\/(?:www\.luogu\.com(?:\.cn)?|www\.luogu\.com\.co|www\.luogu\.me|(?:www\.)?luogu\.qzz\.io|luogu\.gengen\.qzz\.io|lg\.gengen\.qzz\.io)\/article\/([a-z0-9]{8})\/?(\?.*)?(#.*)?$/,
  /^https?:\/\/luogu\.store\/a\/([a-z0-9]{8})(?:@([a-z0-9]+))?(?:\?.*)?(?:#.*)?$/,
];

const userRegexes = [
  /^https?:\/\/(?:www\.luogu\.com(?:\.cn)?|www\.luogu\.com\.co|www\.luogu\.me|(?:www\.)?luogu\.qzz\.io|luogu\.gengen\.qzz\.io|lg\.gengen\.qzz\.io)\/user\/(\d+)\/?(?:\?.*)?(?:#.*)?$/,
  /^https?:\/\/www\.luogu\.com\.cn\/space\/show\?uid=(\d+)(?:\?.*)?(?:#.*)?$/,
  /^https?:\/\/lglg\.top\/user\/(\d+)(?:\/.*)?(?:\?.*)?(?:#.*)?$/,
  /^https?:\/\/luogu\.store\/u\/(\d+)(?:\?.*)?(?:#.*)?$/,
];

const pasteRegexes = [
  /^https?:\/\/(?:www\.luogu\.com(?:\.cn)?|www\.luogu\.com\.co|www\.luogu\.me|(?:www\.)?luogu\.qzz\.io|luogu\.gengen\.qzz\.io|lg\.gengen\.qzz\.io)\/paste\/([a-z0-9]{8})\/?(?:\?.*)?(?:#.*)?$/,
  /^https?:\/\/luogu\.store\/p\/([a-z0-9]{8})(?:@([a-z0-9]+))?(?:\?.*)?(?:#.*)?$/,
];

const problemRegexes = [
  /^https?:\/\/www\.luogu\.com\.cn\/problem\/([A-Za-z0-9_]+)(?:\?.*)?(?:#.*)?$/,
];

function captureFromFirstMatch(regexes, url) {
  for (const regex of regexes) {
    const match = regex.exec(url);
    if (match) return match;
  }
  return null;
}

function restoreTextDirectiveNode(node, index, parent, file) {
  if (!parent || typeof index !== "number" || !Array.isArray(parent.children)) {
    return;
  }
  if (node?.data && typeof node.data.hName === "string") {
    return;
  }

  const rawValue = extractRawDirectiveValue(node, file);
  parent.children[index] = {
    type: "text",
    value: rawValue,
  };
}

function extractRawDirectiveValue(node, file) {
  const fallback = `:${node.name || ""}`;
  if (
    !node?.position ||
    typeof node.position.start?.offset !== "number" ||
    typeof node.position.end?.offset !== "number"
  ) {
    return fallback;
  }
  if (typeof file?.value !== "string") {
    return fallback;
  }

  const { start, end } = node.position;
  if (start.offset >= 0 && end.offset > start.offset) {
    return file.value.slice(start.offset, end.offset);
  }
  return fallback;
}

const emptyOptions = {};

/**
 * remark-luogu-flavor plugin.
 * @param {object} [options]
 */
export default function remarkLuoguFlavor(options) {
  const self = this;
  const settings = options || emptyOptions;
  const data = self.data();

  const linkOriginalUrl =
    settings.linkOriginalUrl ?? "https://www.luogu.com.cn/";

  const micromarkExtensions =
    data.micromarkExtensions || (data.micromarkExtensions = []);
  const fromMarkdownExtensions =
    data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);
  const toMarkdownExtensions =
    data.toMarkdownExtensions || (data.toMarkdownExtensions = []);

  micromarkExtensions.push(
    directive(),
    gfmFootnote(),
    gfmStrikethrough({ singleTilde: false, ...settings }),
    gfmTable(),
    gfmTaskListItem(),
    // gfmAutolinkLiteral(),
  );

  fromMarkdownExtensions.push(
    directiveFromMarkdown(),
    gfmFootnoteFromMarkdown(),
    gfmStrikethroughFromMarkdown(),
    gfmTableFromMarkdown(),
    gfmTaskListItemFromMarkdown(),
    // gfmAutolinkLiteralFromMarkdown(),
  );

  toMarkdownExtensions.push(
    directiveToMarkdown(),
    gfmFootnoteToMarkdown(),
    gfmTableToMarkdown(),
    gfmStrikethroughToMarkdown(),
    gfmTaskListItemToMarkdown(),
    // gfmAutolinkLiteralToMarkdown(),
  );

  return (tree, file) => {
    transformLuoguDirectives(tree, self, file);
    transformLuoguCode(tree, self, file);
    transformLuoguTables(tree, self, file);

    visit(tree, "paragraph", (node) => {
      const childNode = node.children;
      childNode.forEach((child, index) => {
        const lastNode = childNode[index - 1];
        if (
          child.type === "link" &&
          index >= 1 &&
          lastNode.type === "text" &&
          lastNode.value.endsWith("@")
        ) {
          const match = captureFromFirstMatch(mentionRegexes, child.url);
          if (!match) return;
          const newNode = {
            type: "userMention",
            children: child.children,
            uid: parseInt(match[1]),
            data: {
              hName: "a",
              hProperties: {
                "data-ls-user-mention": match[1],
              },
            },
          };
          childNode[index] = newNode;
          lastNode.value = lastNode.value.slice(0, -1);
          const nextNode = childNode[index + 1];
          if (
            nextNode &&
            nextNode.type === "text" &&
            nextNode.value.startsWith(" ")
          ) {
            nextNode.value = nextNode.value.slice(1);
          }
        }
        if (child.type === "image" && child.url.startsWith("bilibili:")) {
          let videoId = child.url.replace("bilibili:", "");
          if (videoId.match(/^[0-9]/)) videoId = "av" + videoId;
          const newNode = {
            type: "bilibiliVideo",
            videoId,
            data: {
              hName: "iframe",
              hProperties: {
                scrolling: "no",
                allowfullscreen: "true",
                class: "lfm-bilibili-video",
                src:
                  "https://www.bilibili.com/blackboard/webplayer/embed-old.html?bvid=" +
                  videoId.replace(/[?&]/g, "&amp;"),
              },
            },
          };
          childNode[index] = newNode;
        }
      });
    });
    visit(tree, "link", (node) => {
      try {
        const newUrl = new URL(node.url, linkOriginalUrl).href;
        let match;
        const hProperties = (node.data ||= {}).hProperties || {};
        node.data.hProperties = hProperties;

        const linkText = toString(node);
        if (linkText) {
          hProperties["data-ls-link-text"] = linkText;
        }

        if (
          node.position &&
          typeof node.position.start?.offset === "number" &&
          typeof node.position.end?.offset === "number" &&
          typeof file.value === "string"
        ) {
          const raw = file.value.slice(
            node.position.start.offset,
            node.position.end.offset,
          );
          hProperties["data-ls-link-source"] = raw;
        }

        match = captureFromFirstMatch(discussionRegexes, newUrl);
        if (match) {
          hProperties["data-ls-discuss"] = match[1];
          return;
        }

        match = captureFromFirstMatch(articleRegexes, newUrl);
        if (match) {
          hProperties["data-ls-article"] = match[1];
          return;
        }

        match = captureFromFirstMatch(userRegexes, newUrl);
        if (match) {
          hProperties["data-ls-user"] = match[1];
          return;
        }

        match = captureFromFirstMatch(pasteRegexes, newUrl);
        if (match) {
          hProperties["data-ls-paste"] = match[1];
          return;
        }

        match = captureFromFirstMatch(problemRegexes, newUrl);
        if (match) {
          hProperties["data-ls-problem"] = match[1];
          return;
        }

        node.url = newUrl;
      } catch (_) {
        // ignore
      }
    });

    visit(tree, "textDirective", (node, index, parent) => {
      restoreTextDirectiveNode(node, index, parent, file);
    });
  };
}
