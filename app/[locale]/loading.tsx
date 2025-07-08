import { LoadingView } from '@/screens/LoadingView/LoadingView';

export default async function Loading() {
  return (
    <div style={{ background: 'linear-gradient(to bottom, #0B0C1D, #101340)', minHeight: '100vh', width: '100%' }}>
      <LoadingView />
    </div>
  );
}
