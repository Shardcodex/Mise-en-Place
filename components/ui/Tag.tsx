import { getTagColors } from "@/lib/constants";

interface TagProps {
  tag: string;
  className?: string;
}

export default function Tag({ tag, className = "" }: TagProps) {
  const colors = getTagColors(tag);

  return (
    <span
      className={`inline-block rounded-pill px-2 py-[2px] text-[10px] font-medium ${className}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {tag}
    </span>
  );
}
