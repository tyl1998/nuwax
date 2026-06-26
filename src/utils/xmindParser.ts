import JSZip from 'jszip';

export interface XmindNode {
  content: string;
  children: XmindNode[];
}

interface XmindTopic {
  title: string;
  children?: { attached?: XmindTopic[] };
}

function topicToNode(topic: XmindTopic): XmindNode {
  return {
    content: topic.title || '',
    children: (topic.children?.attached || []).map(topicToNode),
  };
}

export async function parseXmindFile(
  file: ArrayBuffer | Blob,
): Promise<XmindNode> {
  const zip = await JSZip.loadAsync(file);
  const contentFile = zip.file('content.json');
  if (!contentFile) {
    throw new Error('Invalid xmind file: content.json not found');
  }
  const contentStr = await contentFile.async('string');
  const sheets = JSON.parse(contentStr);
  if (!sheets?.[0]?.rootTopic) {
    throw new Error('Invalid xmind file: no root topic');
  }
  return topicToNode(sheets[0].rootTopic);
}
