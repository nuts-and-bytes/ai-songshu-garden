import { SKIP, visit } from 'unist-util-visit'

const copyIcon = {
  type: 'element',
  tagName: 'svg',
  properties: {
    'className': ['icon-copy'],
    'viewBox': '0 0 24 24',
    'fill': 'currentColor',
    'aria-hidden': 'true',
  },
  children: [
    {
      type: 'element',
      tagName: 'path',
      properties: { d: 'M6.9.8v18h14.5V.8zm12.8 16h-11v-14h11z' },
      children: [],
    },
    {
      type: 'element',
      tagName: 'path',
      properties: { d: 'M4.3 21.2V5.6l-1.7.5v17.1h14.3l.6-2z' },
      children: [],
    },
  ],
}

const checkIcon = {
  type: 'element',
  tagName: 'svg',
  properties: {
    'className': ['icon-check'],
    'viewBox': '0 0 24 24',
    'fill': 'currentColor',
    'aria-hidden': 'true',
  },
  children: [
    {
      type: 'element',
      tagName: 'path',
      properties: { d: 'm23.1 6.4-1.3-1.3L9.4 16.6l-6.3-5.4-1.2 1.2L9.4 20z' },
      children: [],
    },
  ],
}

export function rehypeCodeCopyButton() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || node.children?.[0]?.tagName !== 'code' || !parent) {
        return
      }

      if (node._hasCopyButton) {
        return
      }

      node._hasCopyButton = true
      const textOf = n => n.type === 'text' ? n.value : (n.children || []).map(textOf).join('')
      const text = textOf(node)
      const prompt = text.startsWith('请用这个目录里的 stone 第二大脑 v2')
      const command = /(?:python|brain\.py|pip install)/.test(text) && !prompt
      const label = prompt ? '给 AI 的完整提示词' : command ? '终端命令' : '流程示意'
      const copyLabel = prompt ? '复制提示词' : command ? '复制命令' : '复制内容'
      const textNode = value => ({ type: 'text', value })
      const toolbar = {
        type: 'element', tagName: 'div', properties: { className: ['code-toolbar'] },
        children: [{ type: 'element', tagName: 'span', properties: {}, children: [textNode(label)] }],
      }

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-block-wrapper', prompt ? 'prompt-block' : command ? 'command-block' : 'diagram-block'] },
        children: [
          toolbar,
          {
            type: 'element',
            tagName: 'button',
            properties: {
              'className': ['code-copy-button'],
              'type': 'button',
              'aria-label': copyLabel,
            },
            children: [copyIcon, checkIcon, { type: 'element', tagName: 'span', properties: { className: ['copy-label'], 'aria-live': 'polite' }, children: [textNode(copyLabel)] }],
          },
          ...(prompt ? [{
            type: 'element', tagName: 'details', properties: { className: ['prompt-details'] },
            children: [{ type: 'element', tagName: 'summary', properties: {}, children: [textNode('查看完整提示词 · 复制时包含全部内容')] }, node],
          }] : [node]),
        ],
      }

      return SKIP
    })
  }
}
