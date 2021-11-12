import React from 'react'
import './ImgTables.css'

const ImgTables = ({
	imgs,
	onHandleView
}) => {

	const formateSize = (size) => {
		const mSize = size / 1024
		return mSize > 1 ? `${mSize.toFixed(2)}M` : `${size}kb`
	}

	return (
		<div>
			{
				imgs.map(item => {
					return <div className='img_item' key={item.src}>
						<div>{ item.src }</div>
						<div className='opt'>
							<span>{item.error ? 'Fetch Error' : formateSize(item.sizeKb)}</span>
							<span onClick={() => onHandleView(item.src)} className='view'>预览</span>
							<a target='_blank' href={item.src} className='view'>下载</a>
							{/* 
								// TODO: 压缩下载
								<a className='view disable'>压缩下载</a>
							*/}
						</div>
					</div>
				})
			}
		</div>
	)
}

export default ImgTables

