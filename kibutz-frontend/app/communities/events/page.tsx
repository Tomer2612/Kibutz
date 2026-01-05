'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function EventsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityId = searchParams.get('communityId');

  useEffect(() => {
    if (communityId) {
      router.replace(`/communities/${communityId}/events`);
    } else {
      router.replace('/');
    }
  }, [communityId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>מעביר...</p>
    </div>
  );
}

export default function EventsRedirectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <EventsRedirect />
    </Suspense>
  );
}