import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'JML Reconciliation Engine Project',
  description: 'First 35% deliverable for the University IAM project.',
  openGraph: {
    title: 'JML Reconciliation Engine Project',
    description: 'First 35% deliverable for the University IAM project.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JML Reconciliation Engine Project',
    description: 'First 35% deliverable for the University IAM project.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
