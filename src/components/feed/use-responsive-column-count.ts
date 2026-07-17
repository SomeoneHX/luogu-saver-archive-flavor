import * as React from "react";

export const FEED_MASONRY_DEFAULT_COLUMN_COUNT = 1;

export function useResponsiveColumnCount() {
  const [columns, setColumns] = React.useState(1);

  React.useEffect(() => {
    const compute = () => {
      const width = window.innerWidth;
      if (width >= 1536) setColumns(4);
      else if (width >= 1024) setColumns(3);
      else if (width >= 640) setColumns(2);
      else setColumns(1);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return columns;
}
