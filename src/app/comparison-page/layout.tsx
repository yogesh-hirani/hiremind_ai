import Toast from '@/components/ui/Toast';

export default function ComparisonLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toast />
    </>
  );
}