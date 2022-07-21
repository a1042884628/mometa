import type { RequestData } from '@mometa/fs-handler'

export function createPreload(data: any, other?: Omit<RequestData['preload'], 'relativeFilename' | 'filename'>) {
  return {
    ...other,
    relativeFilename: data.relativeFilename,
    filename: data.filename
  } as any
}

export function symbol(name: string) {
  return `MOMETA_${name}`
}
