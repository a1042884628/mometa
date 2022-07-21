const { getAddMaterialOps, createLineContentsByContent } = require('@mometa/fs-handler')

module.exports = async function previewCodeGen({ asset, react, path }) {
  const isReact = String(react) === 'true'

  const importCodes = []
  if (isReact) {
    importCodes.push(`import * as React from 'react';`, `import * as ReactDOM from 'react-dom';`)
  }

  const ops = await getAddMaterialOps(
    createLineContentsByContent(importCodes.join('\n')),
    { line: 0, column: 1 },
    asset.data,
    {
      esModule: true
    }
  )
  if (ops.insertDeps) {
    importCodes.push(ops.insertDeps.map((x) => x.preload.data.newText.replace(/^;/, '')).join('\n') || '')
  }

  return `
/* preview-render ${asset.name || ''} ${asset.key || ''} */
${importCodes.join('\n')}
export default function previewRender(dom) {
  return ${ops.insertCode ? `ReactDOM.render(${ops.insertCode.preload.data.newText}, dom)` : ''};
};`.trim()
}
