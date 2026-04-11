import Toast from '@/components/ui/Toast';

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toast />
    </>
  );
}