import React from 'react'
import p from 'prefix-classname'
import zhCN from 'antd/lib/locale/zh_CN'
import { ConfigProvider, message } from 'antd'
import { CLS_PREFIX } from '../../config/const'
import Header, { useHeaderStatus } from '../components/header'
import Stage, { StageProps } from '../components/stage'
import RightPanel, { RightPanelProps } from '../components/right-panel'
import LeftPanel, { LeftPanelProps } from '../components/left-panel'

import { SharedProvider, useSharedProvider } from '@rcp/use.shared'
import { DoubleRightOutlined, DoubleLeftOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import './style.scss'
import createApi from '../components/stage/create-api'
import { createClientConnection } from './sse'
import { Button } from 'antd'
import { fetchPreload } from '../utils/fetch-preload'
import AppErrorBoundary from '../components/error-boundary'
import { handleErrors } from '../utils/error-overlay'

const cn = p('')
const c = p(`${CLS_PREFIX}`)

export interface EditorProps {
  className?: string
  apiBaseURL?: string
  bundlerURL?: StageProps['bundlerURL']
  stageProps?: StageProps
  leftPanelProps?: LeftPanelProps
  rightPanelProps?: RightPanelProps
}

function CollapseBtn({ hide, dir, onClick }: any) {
  const title = hide ? '展开' : '收起'
  const style = {
    cursor: 'pointer',
    color: '#1890ff'
  }

  return (
    <div onClick={onClick} className={c('__collapse', `-collapse-${dir}`, `-collapse-${hide ? 'hide' : 'show'}`)}>
      <Tooltip title={title}>
        <Button
          style={{ padding: 0 }}
          size={'small'}
          shape={'round'}
          icon={
            (hide && dir === 'left') || (!hide && dir === 'right') ? (
              <DoubleLeftOutlined style={style} />
            ) : (
              <DoubleRightOutlined style={style} />
            )
          }
          type={'link'}
        />
      </Tooltip>
    </div>
  )
}

const Body = ({ className, apiBaseURL, leftPanelProps, rightPanelProps, stageProps, bundlerURL }: EditorProps) => {
  const [mats, setMats] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  React.useEffect(() => {
    const conn = createClientConnection(apiBaseURL + 'sse')
    let dispose
    let disposeError
    async function handleBuildProcess(fn) {
      try {
        await fn()
        disposeError?.()
        disposeError = null
      } catch (err) {
        // console.error(err)
        disposeError = handleErrors([err])
      }
    }

    conn.addHandler(async (data) => {
      try {
        switch (data.type) {
          case 'set-materials': {
            setMats(data.data ?? [])
            setLoading(false)
            break
          }
          case 'materials-loading': {
            setLoading(!!data.data)
            break
          }
          case 'set-materials-client-render': {
            await handleBuildProcess(async () => {
              dispose?.()
              const { exported, dispose: _dis } = await fetchPreload(data.data)
              dispose = _dis
              console.log('materials-client-render exports', exported)
              setMats(exported ?? [])
              setLoading(false)
            })
            break
          }
          case 'error': {
            await handleBuildProcess(() => {
              throw new Error(data.data)
            })
          }
        }
      } catch (err) {
        console.error(err)
        message.error(err.message)
      }
    })
    //
    return () => {
      conn.close()
      dispose?.()
    }
  }, [apiBaseURL])

  const api = React.useMemo(() => createApi(apiBaseURL), [apiBaseURL])
  useSharedProvider(api, { key: 'api' })
  const [{ canSelect }] = useHeaderStatus()

  const [hideLeft, setHideLeft] = React.useState(false)
  const [hideRight, setHideRight] = React.useState(false)
  const hideChangedRef = React.useRef({ left: false, right: false })

  React.useEffect(() => {
    if (!hideChangedRef.current.left) {
      setHideLeft(!canSelect)
    }
    if (!hideChangedRef.current.right) {
      setHideRight(!canSelect)
    }
  }, [canSelect])

  return (
    <div className={cn(c(), className)}>
      <Header bundlerURL={bundlerURL} />
      <div className={c('__main-content')}>
        <div className={c('__panel')}>
          <LeftPanel
            {...leftPanelProps}
            className={c('__l-panel', hideLeft && '-hide')}
            loading={loading}
            materials={mats}
          />
          <CollapseBtn
            onClick={() => {
              hideChangedRef.current.left = true
              setHideLeft((x) => !x)
            }}
            hide={hideLeft}
            dir={'left'}
          />
        </div>
        <Stage
          bundlerURL={bundlerURL}
          {...stageProps}
          className={c('__stage', hideLeft && `-stage-left-hide`, hideRight && '-stage-right-hide')}
        />
        <div className={c('__panel')}>
          <RightPanel {...rightPanelProps} className={c('__r-panel', hideRight && '-hide')} />
          <CollapseBtn
            onClick={() => {
              hideChangedRef.current.right = true
              setHideRight((x) => !x)
            }}
            hide={hideRight}
            dir={'right'}
          />
        </div>
      </div>
    </div>
  )
}

ConfigProvider.config({
  prefixCls: 'mmt-ant'
})

const Editor: React.FC<EditorProps> = React.memo((props) => {
  return (
    <SharedProvider>
      <ConfigProvider locale={zhCN} prefixCls={'mmt-ant'}>
        <AppErrorBoundary>
          <DndProvider backend={HTML5Backend}>
            <Body {...props} />
          </DndProvider>
        </AppErrorBoundary>
      </ConfigProvider>
    </SharedProvider>
  )
})

Editor.defaultProps = {
  apiBaseURL: 'http://localhost:8686/',
  bundlerURL: '/bundler.html'
}

export default Editor
