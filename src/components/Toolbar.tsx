import { ReactNode } from 'react';

interface Props {
  title: string;
  children?: ReactNode;
}

export default function Toolbar({ title, children }: Props) {
  return (
    <div className="modern-toolbar">
      <h2>{title}</h2>
      <div className="modern-toolbar-actions">{children}</div>
    </div>
  );
}
