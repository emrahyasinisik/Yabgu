type ButtonProps = {
  children: string;
  variant?: "primary" | "ghost";
};

/** Named export; primary buttons use btn-primary. */
export function Button({ children, variant = "primary" }: ButtonProps) {
  const className = variant === "primary" ? "btn-primary" : "btn-ghost";
  return `<button class="${className}">${children}</button>`;
}
