'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function CommunityRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const communityId = params.id as string;

  useEffect(() => {
    // Redirect to the feed page with the community ID
    router.replace(`/communities/feed?communityId=${communityId}`);
  }, [communityId, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-600">מעביר לקהילה...</p>
    </main>
  );
}
