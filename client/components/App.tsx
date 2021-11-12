import React, { useState } from 'react'
import { Input, Button, Switch, message, Icon } from 'antd'
import 'antd/lib/button/style/css.js'
import 'antd/lib/input/style/css.js'
import 'antd/lib/switch/style/css.js'
import 'antd/lib/message/style/css.js'
import './App.css'
import fetch from 'isomorphic-fetch'
import ResultList from './ResultList'
import { ImgItem, ResultItem  } from './types'

const { TextArea } = Input;

const App = () => {
	const [pageUrl, setPageUrl] = useState(`https://www.baidu.com`)
	const [siteList, setSiteList]: [ResultItem[], any] = useState([])
	const [loading, setLoading] = useState(false)
	const [limit, setLimit] = useState(300)
	const [ignoreResize, setIgnoreResize] = useState(true)
	const [id, setId] = useState('')

	const handleStart = async(type) => {
		const urlList = pageUrl.split('\n').filter(item => !!item)
		setLoading(true)

		const apiUrl = type === 'puppeteer' ? '/api/puppeteer/start' : '/api/start'

		const res = await fetch(
			apiUrl,
			{
				method: 'POST',
				body: JSON.stringify({
					limit,
					ignoreResize,
					urlList,
				})
			}
		)
		try {
			const data = await res.json()
			const { result: { id: cid, list, status } } = data
			setSiteList(list)
			loopResult(cid)
			setId(cid)
		} catch (error) {
			message.error(error.message)
			setLoading(false)
		}
	}


	const loopResult = (cid) => {
		setTimeout(() => {
			handleResult(cid)
		}, 5000)
	}

	const handleResult = async(cid) => {
		const result = await fetch(
			`/api/result?id=${cid}`,
			{
				method: 'GET',
			}
		)
		const data = await result.json()
		const { result: { list, status } } = data
		setSiteList(list)
		if (status === 'loading') {
			loopResult(cid)
		} else {
			setLoading(false)
		}
	}

	const handleDownload = async() => {
		window.open(`/api/download.json?id=${id}`)
	}

	const handleChangeLimit = (e) => {
		const value = e.target.value
		if (/\D/.test(value)) {
			message.info('请输入数字')
			return
		}
		setLimit(value)
	}


	return <div className='warp'>
		<main className='main'>
			<div>网址列表：</div>
			<TextArea
				rows={6}
				defaultValue={pageUrl}
				onChange={(e) => { setPageUrl(e.target.value) }}
				placeholder='请输入链接, 如：https://www.baidu.com (多个链接换行输入)'
			/>
			<div className='filter'>
				<div className='input'>
					<span>限制大小：</span>
					<Input value={limit} maxLength={8} style={{ width: 100 }} onChange={handleChangeLimit}/>
					<span>&nbsp;kb</span>
				</div>
				<div className='input'>
					<span>忽略Resize：</span>
					<Switch checked={ignoreResize} onChange={(val) => {setIgnoreResize(val)}}/>
				</div>
			</div>
			<div className='btns'>
				<Button
					disabled={loading}
					onClick={handleStart}
					style={{ width: '30%', marginTop: 10 }}
					type='primary'
				>Start</Button>
				<Button
					disabled={loading}
					onClick={() => handleStart('puppeteer')}
					style={{ width: '30%', marginTop: 10 }}
				>Puppeteer Start <span style={{ color: '#FF5A28' }}>(beta)</span></Button>
				<Button
					disabled={loading || !siteList.length}
					onClick={handleDownload}
					style={{ width: '28%', marginTop: 10 }}
				>导出<Icon type='download' /></Button>
			</div>
			
			<ResultList siteList={siteList} />
		</main>
	</div>
}

export default App