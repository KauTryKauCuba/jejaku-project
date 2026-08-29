export default function TechLogo({
  slug,
  label,
  size = 19,
}: {
  slug: string;
  label: string;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.simpleicons.org/${slug}`}
      alt={label}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}
