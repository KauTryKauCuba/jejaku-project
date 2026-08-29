export default function PixelFaceIcon({
  size = 22,
}: {
  size?: number;
  weight?: string;
}) {
  const px = 2;
  const grid = [
    "..######..",
    ".########.",
    "##..##..##",
    "##########",
    "##.####.##",
    "##.####.##",
    "##########",
    ".########.",
    "..######..",
    "...####...",
  ];

  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      {grid.map((row, y) =>
        row.split("").map((cell, x) =>
          cell === "#" ? (
            <rect
              key={`${x}-${y}`}
              x={x * px}
              y={y * px}
              width={px}
              height={px}
              fill="currentColor"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
