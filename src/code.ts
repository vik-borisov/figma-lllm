figma.showUI(__html__, { width: 400, height: 300 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'export') {
    const node = figma.currentPage.selection[0];
    if (!node) {
      figma.ui.postMessage({ type: 'error', message: 'Select a node to export' });
      return;
    }
    const data = nodeToJSON(node);
    figma.ui.postMessage({ type: 'exported', data });
  } else if (msg.type === 'import') {
    const data = msg.data;
    try {
      const node = jsonToNode(data);
      figma.currentPage.appendChild(node);
      figma.ui.postMessage({ type: 'imported' });
    } catch (e) {
      figma.ui.postMessage({ type: 'error', message: 'Import failed' });
    }
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};

function nodeToJSON(node: SceneNode): any {
  const obj: any = {
    id: node.id,
    type: node.type,
    name: node.name,
  };
  if ('width' in node) obj.width = node.width;
  if ('height' in node) obj.height = node.height;
  if ('fills' in node) obj.fills = clone((node as GeometryMixin).fills);
  if ('characters' in node) obj.characters = (node as TextNode).characters;
  if ('children' in node) {
    obj.children = [];
    for (const child of (node as ChildrenMixin).children) {
      obj.children.push(nodeToJSON(child));
    }
  }
  return obj;
}

function jsonToNode(obj: any): SceneNode {
  let node: SceneNode;
  switch (obj.type) {
    case 'RECTANGLE':
      node = figma.createRectangle();
      break;
    case 'TEXT':
      node = figma.createText();
      if (obj.characters) (node as TextNode).characters = obj.characters;
      break;
    case 'COMPONENT':
      node = figma.createComponent();
      break;
    case 'FRAME':
    default:
      node = figma.createFrame();
      break;
  }
  node.name = obj.name || '';
  if ('width' in obj && 'height' in obj && 'resize' in node)
    (node as LayoutMixin).resize(obj.width, obj.height);
  if ('fills' in obj) (node as GeometryMixin).fills = obj.fills;
  if (obj.children && 'appendChild' in node) {
    for (const childObj of obj.children) {
      const child = jsonToNode(childObj);
      (node as ChildrenMixin).appendChild(child);
    }
  }
  return node;
}

function clone(value: any) {
  return JSON.parse(JSON.stringify(value));
}

function copyToClipboard(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
