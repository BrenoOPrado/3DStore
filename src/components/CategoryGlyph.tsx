import {
  Box,
  Gamepad2,
  Sparkles,
  Sprout,
  Sword,
  UserRound,
  Wrench,
} from "lucide-react";
import type { CategoryId } from "../data/products";

const map = {
  vasos: Sprout,
  "action-figures": UserRound,
  decoracao: Box,
  utilitarios: Wrench,
  games: Gamepad2,
  cutelaria: Sword,
  acessorios: Sparkles,
} as const;

export function CategoryGlyph({
  id,
  color,
  size = 22,
}: {
  id: CategoryId;
  color: string;
  size?: number;
}) {
  const Icon = map[id];
  return <Icon size={size} color={color} strokeWidth={1.75} />;
}
