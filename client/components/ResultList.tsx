import React, { useState, useEffect } from 'react'
import { Collapse, Spin, Modal } from 'antd'
import 'antd/lib/collapse/style/css.js'
import 'antd/lib/spin/style/css.js'
import 'antd/lib/modal/style/css.js'
import './ResultList.css'
import ImgTables from './ImgTables'
import { ImgItem, ResultItem  } from './types'

const Panel = Collapse.Panel;

interface IProps {
	siteList: ResultItem[]
}


const ResultList = ({
	siteList = []
}: IProps) => {
	const [visible, setVisible] = useState(false)
	const [imgSrc, setImgSrc] = useState('')
	const [showKeys, setShowKeys] = useState([] as string[])

	const defaultKeys = siteList.map(item => item.url)

	useEffect(() => {
		setShowKeys(defaultKeys)
	}, [defaultKeys.toString()])

	const handleChange = (keys) => {
		setShowKeys(keys)
	}

	const showViewModal = (src) => {
		setImgSrc(src)
		setVisible(true)
	}

	const hiddenModal = () => {
		setImgSrc('')
		setVisible(false)
	}

	const panelTitle = (item) => {
		const loading = item.status === 'loading'
		return (
			<div className='title'>
				<div>{item.url} &nbsp;</div>
				{
					!loading && <div>发现图片供<span className='total'>{item.total}</span>张，其中<span className='error'>{item.list.length}</span>张图片大小不合规或请求出错</div>
				}
			</div>
		)
	}

	return (
		<>
			<Collapse
				activeKey={showKeys}
				style={{ marginTop: 24 }}
				onChange={handleChange}
			>
				{
					siteList.map(item => {
						const loading = item.status === 'loading'
						return (
							<Panel
								header={panelTitle(item)}
								key={item.url}
							>
								{
									loading
										? <Spin />
										: <ImgTables imgs={item.list} onHandleView={showViewModal} />
								}
							</Panel>
						)
					})
				}
			</Collapse>
			<Modal
				visible={visible}
				width={800}
				onCancel={hiddenModal}
				onOk={hiddenModal}
			>
				<div>
					<img src={imgSrc} className='view_img' />
				</div>
			</Modal>
		</>
		
	)
}

export default ResultList
