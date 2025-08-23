import React from 'react';
import HorizontalLayout from '@/components/HorizontalLayout';
import { CollaborativeCRM as CollaborativeCRMComponent } from '@/components/collaboration/CollaborativeCRM';

export default function CollaborativeCRM() {
  return (
    <HorizontalLayout>
      <div className="space-y-6">
        <CollaborativeCRMComponent />
      </div>
    </HorizontalLayout>
  );
}