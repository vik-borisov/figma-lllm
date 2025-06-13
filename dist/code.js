"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_type_props_1 = require("./node-type-props");
figma.showUI(__html__, { width: 400, height: 300 });
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'export') {
        const node = figma.currentPage.selection[0];
        if (!node) {
            figma.ui.postMessage({ type: 'error', message: 'Select a node to export' });
            return;
        }
        const data = nodeToJSON(node);
        figma.ui.postMessage({ type: 'exported', data });
    }
    else if (msg.type === 'import') {
        const data = msg.data;
        try {
            const node = jsonToNode(data);
            figma.currentPage.appendChild(node);
            figma.ui.postMessage({ type: 'imported' });
        }
        catch (e) {
            figma.ui.postMessage({ type: 'error', message: 'Import failed' });
        }
    }
    else if (msg.type === 'close') {
        figma.closePlugin();
    }
});
function nodeToJSON(node) {
    const obj = { type: node.type };
    const props = node_type_props_1.NODE_TYPE_PROPS[node.type] || [];
    for (const key of props) {
        if (key === 'children')
            continue;
        try {
            const value = node[key];
            if (typeof value !== 'function' && key !== 'parent') {
                obj[key] = clone(value);
            }
        }
        catch (_a) {
            // ignore read-only or unsupported properties
        }
    }
    if ('children' in node) {
        obj.children = [];
        for (const child of node.children) {
            obj.children.push(nodeToJSON(child));
        }
    }
    return obj;
}
function jsonToNode(obj) {
    let node;
    switch (obj.type) {
        case 'RECTANGLE':
            node = figma.createRectangle();
            break;
        case 'TEXT':
            node = figma.createText();
            if (obj.characters)
                node.characters = obj.characters;
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
            node.resize(obj.width, obj.height);
        }
        catch (_a) { }
    }
    if ('fills' in obj) {
        try {
            node.fills = obj.fills;
        }
        catch (_b) { }
    }
    const props = node_type_props_1.NODE_TYPE_PROPS[obj.type] || [];
    for (const key of props) {
        if (key === 'children' || key === 'type' || key === 'parent' || key === 'name' || key === 'width' || key === 'height' || key === 'fills')
            continue;
        if (obj[key] === undefined)
            continue;
        try {
            const target = node[key];
            if (typeof target !== 'function') {
                node[key] = clone(obj[key]);
            }
        }
        catch (_c) {
            // ignore read-only or unsupported properties
        }
    }
    if (obj.children && 'appendChild' in node) {
        for (const childObj of obj.children) {
            const child = jsonToNode(childObj);
            node.appendChild(child);
        }
    }
    return node;
}
function clone(value) {
    return JSON.parse(JSON.stringify(value));
}
function copyToClipboard(text) {
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
