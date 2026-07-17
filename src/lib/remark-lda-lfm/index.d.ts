/**
 * Type declarations for @luogu-discussion-archive/remark-lda-lfm (ported).
 */
import "mdast";

declare module "mdast" {
  interface UserMention extends Parent {
    type: "userMention";
    uid: number;
    children: PhrasingContent[];
  }

  interface BilibiliVideo extends Node {
    type: "bilibiliVideo";
    videoId: string;
  }

  interface LsAdmonition extends Parent {
    type: "lsAdmonition";
    children: BlockContent[];
  }

  interface LsAlign extends Parent {
    type: "lsAlign";
    children: BlockContent[];
  }

  interface LsEpigraph extends Parent {
    type: "lsEpigraph";
    children: BlockContent[];
  }

  interface PhrasingContentMap {
    userMention: UserMention;
    bilibiliVideo: BilibiliVideo;
  }

  interface RootContentMap {
    userMention: UserMention;
    bilibiliVideo: BilibiliVideo;
    lsAdmonition: LsAdmonition;
    lsAlign: LsAlign;
    lsEpigraph: LsEpigraph;
  }

  interface BlockContentMap {
    lsAdmonition: LsAdmonition;
    lsAlign: LsAlign;
    lsEpigraph: LsEpigraph;
  }
}

declare module "@/lib/remark-lda-lfm" {
  export default function remarkLuoguFlavor(
    options?: Record<string, unknown>,
  ): (tree: import("mdast").Root, file: unknown) => void;
}

declare module "@/lib/remark-lda-lfm/index.js" {
  export default function remarkLuoguFlavor(
    options?: Record<string, unknown>,
  ): (tree: import("mdast").Root, file: unknown) => void;
}
