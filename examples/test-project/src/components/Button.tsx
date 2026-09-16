export function Button({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button className="btn-primary" onClick={onClick}>{children}</button>;
}
