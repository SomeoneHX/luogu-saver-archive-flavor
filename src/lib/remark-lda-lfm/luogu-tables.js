/**
 * Luogu table extensions:
 *  - cell merge: a cell whose only content is "^" merges upward, "<" merges leftward.
 *  - ::cute-table{style} marks the following table with Tuack-style classes.
 */
function nodeToString(node) {
  if (!node) return "";
  const anyNode = node;
  if (typeof anyNode.value === "string") return anyNode.value;
  if (Array.isArray(anyNode.children)) {
    return anyNode.children.map((child) => nodeToString(child)).join("");
  }
  return "";
}

function getParagraphText(node) {
  if (!node || node.type !== "paragraph") return "";
  return (node.children || []).map((c) => nodeToString(c)).join("");
}

function parseCuteTableStyle(trailer) {
  let rest = trailer.trim();
  if (!rest) return null;
  const start = rest.indexOf("{");
  const end = rest.indexOf("}", start + 1);
  if (start === -1 || end === -1) return null;
  const inside = rest.slice(start + 1, end).trim();
  if (!inside) return null;
  const first = inside.split(/\s+/)[0];
  return first || null;
}

function resolveCuteTableStyle(directiveNode) {
  const attrs =
    directiveNode && directiveNode.attributes ? directiveNode.attributes : {};
  let style = "";

  if (typeof attrs.style === "string" && attrs.style.trim()) {
    style = attrs.style.trim();
  }

  if (!style) {
    for (const key of Object.keys(attrs)) {
      if (key === "class" || key === "id" || key === "style") continue;
      style = key.trim();
      if (style) break;
    }
  }

  if (!style && typeof attrs.class === "string" && attrs.class.trim()) {
    style = attrs.class.trim().split(/\s+/)[0];
  }

  if (!style && typeof attrs.className === "string" && attrs.className.trim()) {
    style = attrs.className.trim().split(/\s+/)[0];
  }

  return style || "tuack";
}

function appendClasses(props, classNames) {
  const list = [];

  if (Array.isArray(props.className)) {
    list.push(...props.className);
  } else if (typeof props.className === "string") {
    list.push(
      ...props.className
        .split(/\s+/)
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }

  for (const cls of classNames) {
    if (cls && !list.includes(cls)) list.push(cls);
  }

  if (list.length > 0) {
    props.className = list;
  }
}

function getCellMergeKind(cell) {
  if (!cell) return "empty";
  const children = cell.children || [];
  if (children.length !== 1) return "normal";
  const child = children[0];
  if (!child || child.type !== "text") return "normal";
  const value = String(child.value || "").trim();
  if (value === "^") return "up";
  if (value === "<") return "left";
  return "normal";
}

function applyTableMerges(table) {
  const rows = table.children || [];
  const rowCount = rows.length;
  if (!rowCount) return;

  let colCount = 0;
  for (const row of rows) {
    const len = (row.children || []).length;
    if (len > colCount) colCount = len;
  }
  if (!colCount) return;

  const kind = [];
  const ownerRow = [];
  const ownerCol = [];
  const rowspan = [];
  const colspan = [];
  const remove = [];

  let hasMergeMarker = false;

  for (let r = 0; r < rowCount; r += 1) {
    const row = rows[r];
    const cells = row.children || [];

    kind[r] = [];
    ownerRow[r] = [];
    ownerCol[r] = [];
    rowspan[r] = [];
    colspan[r] = [];
    remove[r] = [];

    for (let c = 0; c < colCount; c += 1) {
      const cell = cells[c];
      const k = getCellMergeKind(cell || null);
      kind[r][c] = k;
      remove[r][c] = false;

      if (k === "up" || k === "left") {
        hasMergeMarker = true;
        ownerRow[r][c] = null;
        ownerCol[r][c] = null;
        rowspan[r][c] = 0;
        colspan[r][c] = 0;
      } else if (k === "normal") {
        ownerRow[r][c] = r;
        ownerCol[r][c] = c;
        rowspan[r][c] = 1;
        colspan[r][c] = 1;
      } else {
        ownerRow[r][c] = null;
        ownerCol[r][c] = null;
        rowspan[r][c] = 0;
        colspan[r][c] = 0;
      }
    }
  }

  if (!hasMergeMarker) {
    return;
  }

  for (let r = 0; r < rowCount; r += 1) {
    for (let c = 0; c < colCount; c += 1) {
      const k = kind[r][c];

      if (k === "up") {
        let rr = r - 1;
        let or = null;
        let oc = null;

        while (rr >= 0) {
          if (ownerRow[rr][c] != null && ownerCol[rr][c] != null) {
            or = ownerRow[rr][c];
            oc = ownerCol[rr][c];
            break;
          }
          rr -= 1;
        }

        if (or != null && oc != null) {
          rowspan[or][oc] = (rowspan[or][oc] || 1) + 1;
          ownerRow[r][c] = or;
          ownerCol[r][c] = oc;
          remove[r][c] = true;
        }
      } else if (k === "left") {
        let cc = c - 1;
        let or = null;
        let oc = null;

        while (cc >= 0) {
          if (ownerRow[r][cc] != null && ownerCol[r][cc] != null) {
            or = ownerRow[r][cc];
            oc = ownerCol[r][cc];
            break;
          }
          cc -= 1;
        }

        if (or != null && oc != null) {
          colspan[or][oc] = (colspan[or][oc] || 1) + 1;
          ownerRow[r][c] = or;
          ownerCol[r][c] = oc;
          remove[r][c] = true;
        }
      }
    }
  }

  for (let r = 0; r < rowCount; r += 1) {
    const row = rows[r];
    const cells = row.children || [];
    const nextCells = [];

    for (let c = 0; c < colCount; c += 1) {
      const cell = cells[c];
      if (!cell) continue;
      if (remove[r][c]) {
        const newCell = {
          type: "tableCell",
          data: {
            hProperties: {
              className: ["ls-merged-cell-placeholder"],
            },
          },
          children: [],
        };
        nextCells.push(newCell);
        continue;
      }

      const rs = rowspan[r][c] || 0;
      const cs = colspan[r][c] || 0;

      const anyCell = cell;
      if (!anyCell.data) anyCell.data = {};
      if (!anyCell.data.hProperties) anyCell.data.hProperties = {};
      const props = anyCell.data.hProperties;

      if (rs > 1) {
        props.rowspan = rs;
      }
      if (cs > 1) {
        props.colspan = cs;
      }

      nextCells.push(cell);
    }

    row.children = nextCells;
  }
}

function transformInParent(parent) {
  if (!parent || !Array.isArray(parent.children)) return;

  const children = parent.children;
  let index = 0;

  while (index < children.length) {
    const node = children[index];

    if (node && node.type === "leafDirective" && node.name === "cute-table") {
      const style = resolveCuteTableStyle(node);

      let tableIndex = -1;
      for (let j = index + 1; j < children.length; j += 1) {
        const cand = children[j];
        if (cand && cand.type === "table") {
          tableIndex = j;
          break;
        }
      }

      if (tableIndex !== -1) {
        const table = children[tableIndex];
        if (!table.data) table.data = {};
        if (!table.data.hProperties) table.data.hProperties = {};
        const props = table.data.hProperties;

        appendClasses(
          props,
          ["ls-cute-table", style ? `ls-cute-table-${style}` : null].filter(
            Boolean,
          ),
        );

        if (style) {
          props["data-cute-table-style"] = style;
        }
      }

      children.splice(index, 1);
      continue;
    }

    if (node && node.type === "table") {
      applyTableMerges(node);
    }

    if (
      node &&
      typeof node === "object" &&
      "children" in node &&
      Array.isArray(node.children)
    ) {
      transformInParent(node);
    }

    index += 1;
  }
}

export function transformLuoguTables(tree, _processor, _file) {
  transformInParent(tree);
}
