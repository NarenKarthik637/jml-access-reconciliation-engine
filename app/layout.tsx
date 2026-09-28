import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'JML Reconciliation Engine - JML Access Guard',
  description: 'Deterministic Joiner-Mover-Leaver (JML) access reconciliation engine with accountable approvals and audit trail for university IAM.',
  openGraph: {
    title: 'JML Reconciliation Engine - JML Access Guard',
    description: 'Deterministic Joiner-Mover-Leaver (JML) access reconciliation engine with accountable approvals and audit trail for university IAM.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JML Reconciliation Engine - JML Access Guard',
    description: 'Deterministic Joiner-Mover-Leaver (JML) access reconciliation engine with accountable approvals and audit trail for university IAM.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
