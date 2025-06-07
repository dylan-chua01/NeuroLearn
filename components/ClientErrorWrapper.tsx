'use client';

import ClientError from './ClientError';

export default function ClientErrorWrapper({ message }: { message: string }) {
  return <ClientError message={message} />;
}
