'use client';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/AppShell';
import { FormWizard } from '@/components/FormWizard';

const NAV = [
  { label: 'New Entry', href: '/new-entry' },
  { label: 'My Drafts', href: '/drafts' },
];

export default function NewEntryPage() {
  return (
    <AuthGuard allow={['user']}>
      <AppShell nav={NAV}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>New PGX Requisition</h1>
        <FormWizard />
      </AppShell>
    </AuthGuard>
  );
}
