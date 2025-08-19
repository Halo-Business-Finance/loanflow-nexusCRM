import React from 'react';
import Layout from '@/components/Layout';
import { CollaborativeCRM as CollaborativeCRMComponent } from '@/components/collaboration/CollaborativeCRM';

export default function CollaborativeCRM() {
  return (
    <Layout>
      <div className="space-y-6">
        <CollaborativeCRMComponent />
      </div>
    </Layout>
  );
}