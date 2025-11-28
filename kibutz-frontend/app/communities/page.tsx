'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CommunitiesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the feed page
    router.push('/communities/feed');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <p className="text-gray-600">מעביר לרשימת הקהילות...</p>
    </div>
  );
}
