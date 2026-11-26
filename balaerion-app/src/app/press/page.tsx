'use client';

import React from 'react';
import { SignalPressWorkspace } from '@/components/SignalPressWorkspace';
import { SignalPressAiAssistPanel } from '@/components/ai-assist/SignalPressAiAssistPanel';

export default function SignalPressPage() {
  return (
    <SignalPressWorkspace
      assetBasePath="/press-assets"
      samplesBasePath="/press-samples"
      renderWorkspaceSlot={({ doc, commitDoc }) => (
        <SignalPressAiAssistPanel doc={doc} commitDoc={commitDoc} />
      )}
    />
  );
}
