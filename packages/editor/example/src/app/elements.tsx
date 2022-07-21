import { Panel } from './Panel'
import React from 'react'
import Tabs from 'antd/es/tabs'

export const body = (
  <>
    <p>body </p>
    <div>
      {<Panel />}
      <h3>h3</h3>
    </div>
  </>
)

export const panel = (
  <Tabs.TabPane key={'extra'} tab={'其他'}>
    <p>extra</p>
  </Tabs.TabPane>
)
