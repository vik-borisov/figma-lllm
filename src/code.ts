import { NODE_TYPE_PROPS } from './node-type-props.js';

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
  const obj: any = { type: node.type };
  const props = NODE_TYPE_PROPS[node.type] || [];
  for (const key of props) {
    if (key === 'children') continue;
    try {
      const value = (node as any)[key];
      if (typeof value !== 'function' && key !== 'parent') {
        obj[key] = clone(value);
      }
    } catch {
      // ignore read-only or unsupported properties
    }
  }
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
  if ('width' in obj && 'height' in obj && 'resize' in node) {
    try {
      (node as LayoutMixin).resize(obj.width, obj.height);
    } catch {}
  }
  if ('fills' in obj) {
    try {
      (node as GeometryMixin).fills = obj.fills;
    } catch {}
  }
  const props = NODE_TYPE_PROPS[obj.type] || [];
  for (const key of props) {
    if (key === 'children' || key === 'type' || key === 'parent' || key === 'name' || key === 'width' || key === 'height' || key === 'fills') continue;
    if (obj[key] === undefined) continue;
    try {
      const target = (node as any)[key];
      if (typeof target !== 'function') {
        (node as any)[key] = clone(obj[key]);
      }
    } catch {
      // ignore read-only or unsupported properties
    }
  }
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
