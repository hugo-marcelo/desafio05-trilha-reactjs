import { NextApiRequest, NextApiResponse } from 'next';

import { Document } from '@prismicio/client/types/documents';
import { getPrismicClient } from '../../services/prismic';

function linkResolver(doc: Document): string {
  if (doc.type === 'posts') {
    return `/post/${doc.uid}`;
  }
  return '/';
}

export default async function Preview(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { documentId, token } = req.query;

  const prismic = getPrismicClient();
  const redirectUrl = await prismic
    .getPreviewResolver(token, documentId)
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({ ref: token });
  res.writeHead(302, { Location: `${redirectUrl}` });
  res.end();
}
