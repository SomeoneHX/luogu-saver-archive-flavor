/**
 * Luogu container/leaf directive transforms:
 *   :::info / :::success / :::warning / :::error  -> <details><summary>
 *   :::align{center|right|left}                    -> <div class="ls-align-*">
 *   :::epigraph[...]                               -> <figure class="ls-epigraph">
 *   ::cute-table{...}                              -> tag next table
 */
const BOX_TYPES = new Set(["info", "success", "warning", "error"]);

const DEFAULT_TITLES = {
  info: "Info",
  success: "Success",
  warning: "Warning",
  error: "Error",
};

function isDirectiveLabelParagraph(node) {
  return !!(
    node &&
    node.type === "paragraph" &&
    node.data &&
    node.data.directiveLabel
  );
}

function splitLabelAndContent(node) {
  if (node.children && node.children.length > 0) {
    const head = node.children[0];
    if (isDirectiveLabelParagraph(head)) {
      const labelChildren = Array.isArray(head.children)
        ? head.children
        : [];
      const contentChildren = node.children.slice(1);
      return { labelChildren, contentChildren };
    }
  }
  return { labelChildren: null, contentChildren: node.children || [] };
}

function toLuoguAdmonition(node) {
  const boxType = node.name;
  const attrs = node.attributes || {};
  const isOpen = Object.prototype.hasOwnProperty.call(attrs, "open");

  const { labelChildren, contentChildren } = splitLabelAndContent(node);

  const titleChildren =
    labelChildren && labelChildren.length > 0
      ? labelChildren
      : [{ type: "text", value: DEFAULT_TITLES[boxType] }];

  const summaryNode = {
    type: "paragraph",
    data: {
      hName: "summary",
      hProperties: { "data-box-type": boxType },
    },
    children: titleChildren,
  };

  const detailsNode = {
    type: "lsAdmonition",
    data: {
      hName: "details",
      hProperties: {
        className: [boxType],
        ...(isOpen ? { open: true } : {}),
      },
    },
    children: [summaryNode, ...contentChildren],
  };

  return detailsNode;
}

function toAlignBlock(node) {
  const attrs = node.attributes || {};

  let align = "center";

  if (typeof attrs.align === "string") {
    const v = attrs.align.toLowerCase();
    if (v === "left" || v === "center" || v === "right") {
      align = v;
    }
  } else if (Object.prototype.hasOwnProperty.call(attrs, "right")) {
    align = "right";
  } else if (Object.prototype.hasOwnProperty.call(attrs, "left")) {
    align = "left";
  } else if (Object.prototype.hasOwnProperty.call(attrs, "center")) {
    align = "center";
  }

  const alignNode = {
    type: "lsAlign",
    data: {
      hName: "div",
      hProperties: {
        className: ["ls-align", `ls-align-${align}`],
        "data-ls-align": align,
      },
    },
    children: node.children || [],
  };

  return alignNode;
}

function toEpigraphBlock(node) {
  const { labelChildren, contentChildren } = splitLabelAndContent(node);

  const quote = {
    type: "blockquote",
    data: {
      hProperties: {
        className: ["ls-epigraph-blockquote"],
      },
    },
    children: contentChildren,
  };

  const children = [quote];

  if (labelChildren && labelChildren.length > 0) {
    const caption = {
      type: "paragraph",
      data: {
        hName: "figcaption",
      },
      children: labelChildren,
    };
    children.push(caption);
  }

  const figure = {
    type: "lsEpigraph",
    data: {
      hName: "figure",
      hProperties: {
        className: ["ls-epigraph"],
      },
    },
    children,
  };

  return figure;
}

function transformInParent(parent) {
  if (!parent || !Array.isArray(parent.children)) return;

  const children = parent.children;

  for (let index = 0; index < children.length; index += 1) {
    const node = children[index];

    if (!node) continue;

    if (node.type === "containerDirective") {
      const name = node.name || "";

      if (BOX_TYPES.has(name)) {
        const replacement = toLuoguAdmonition(node);
        children[index] = replacement;
        transformInParent(replacement);
        continue;
      }

      if (name === "align") {
        const replacement = toAlignBlock(node);
        children[index] = replacement;
        transformInParent(replacement);
        continue;
      }

      if (name === "epigraph") {
        const replacement = toEpigraphBlock(node);
        children[index] = replacement;
        transformInParent(replacement);
        continue;
      }

      transformInParent(node);
      continue;
    }

    if (
      "children" in node &&
      Array.isArray(node.children)
    ) {
      transformInParent(node);
    }
  }
}

export function transformLuoguDirectives(tree, processor, file) {
  transformInParent(tree);
}
