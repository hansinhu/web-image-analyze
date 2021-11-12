import fetch from 'node-fetch'
import { promises as fs, createReadStream } from 'fs'
import { resultMap } from './utils/lru-result'
import path from 'path'
import log4js from 'koa-log4'
import puppeteer from 'puppeteer'
import dayjs from 'dayjs'



interface IMGSIZE {
	src: string
	size?: number
	sizeKb?: number
	error?: string
}

interface Options {
	limit: number
	ignoreResize: boolean
}

const log = log4js.getLogger('schedule')

let browser: any = null


const perSchedule = async (urls: string[], id: string, options: Options) => {
	if (!browser) {
		browser = await puppeteer.launch()
	}
	perPickFetch(urls.slice(0), id, options)

	return resultMap.get(id)
}

const perPickFetch = async (list, id, options) => {
	if (list.length) {
		const url = list.splice(0, 1)
		await perStart(url[0], id, options)
		perPickFetch(list, id, options)
	}
}

const perStart = async(url, id, options) => {
	let html = ''
	try {
		const page = await browser.newPage()
		await page.setViewport({
				width: 1920,
				height: 1080
		});
		await page.goto(url)
		await page.waitForTimeout(2000)
		let count = 0
		do {
			console.log(count)
			count += 1
			await new Promise(async(resolve) => {
				await page.evaluate(() => {
					try {
						var distance = 100;
						var totalHeight = 0
						totalHeight = totalHeight || document.body.scrollHeight;
						window.scrollBy(0, distance);
						totalHeight += distance;
					} catch (err) {
						// log.error(err.stash)
					}
				});
				setTimeout(() => resolve(true), 1000)
			})
		} while (count < 30)

		await page.waitForTimeout(3000)
		await page.screenshot({
			path: `screenshot/${dayjs().format('YYYY-MM-DD')}--${Math.floor(Math.random() * 100000)}.png`,
			fullPage: true
		});

		// let bodyHTML = await page.evaluate(() => document.body.innerHTML);
		// html = await page.evaluate(() => document.documentElement.outerHTML);
		html = await page.content()
		console.log('页面已加载:', html)
		// const res = await fetch(url);
		// html = await res.text();
	} catch (err) {
		console.log(err)
		log.error(err.stash)
	}
	await fs.writeFile(path.join(__dirname, './fetch-html.txt'), html)
	const imgs = getImgList(html)

	// 去重
	const pureImgs = Array.from(new Set(imgs))

	log.info(`${url} - 发现图片${pureImgs.length}张`)

	const result: IMGSIZE[] = []

	// 大量请求网络被限流，分批次请求
	for (let i = 0; i < pureImgs.length; i += 100) {
		log.info(`批次请求：第${Math.floor(i / 100) + 1}批`)
		const sliceResult = await loopFetch(pureImgs.slice(i, i + 100))
		result.push(...sliceResult)
	}
	
	// 过滤大于300kb的
	const limitedList = result.filter(item => item.error || (item?.sizeKb && item?.sizeKb > options.limit))

	const currentList = resultMap.get(id)
	const updateList = currentList.map(item => {
		if (item.url === url) {
			item.status = 'finished'
			item.list = limitedList
			item.total = result.length
		}
		return item
	})
	resultMap.put(id, updateList)

	return limitedList
}

const schedule = (urls: string[], id: string, options: Options) => {
	pickFetch(urls.slice(0), id, options)

	return resultMap.get(id)
}

const pickFetch = async (list, id, options) => {
	if (list.length) {
		const url = list.splice(0, 1)
		await start(url[0], id, options)
		pickFetch(list, id, options)
	}
}

const start = async(url, id, options) => {
	let html = ''
	try {
		const res = await fetch(url);
		html = await res.text();
	} catch (err) {
		log.error(err.stash)
	}
	await fs.writeFile(path.join(__dirname, './fetch-html.txt'), html)
	const imgs = getImgList(html)

	// 去重
	const pureImgs = Array.from(new Set(imgs))

	log.info(`${url} - 发现图片${pureImgs.length}张`)

	const result: IMGSIZE[] = []

	// 大量请求网络被限流，分批次请求
	for (let i = 0; i < pureImgs.length; i += 100) {
		log.info(`批次请求：第${Math.floor(i / 100) + 1}批`)
		const sliceResult = await loopFetch(pureImgs.slice(i, i + 100))
		result.push(...sliceResult)
	}
	
	// 过滤大于300kb的
	const limitedList = result.filter(item => item.error || (item?.sizeKb && item?.sizeKb > options.limit))

	const currentList = resultMap.get(id)
	const updateList = currentList.map(item => {
		if (item.url === url) {
			item.status = 'finished'
			item.list = limitedList
			item.total = result.length
		}
		return item
	})
	resultMap.put(id, updateList)

	return limitedList
}


const loopFetch = (imgs) => new Promise<IMGSIZE[]>(async (resolve, reject) => {

	let result: IMGSIZE[] = []
	if (!imgs.length) {
		resolve([])
	}

	// 一次请求20张图片
	const pickImgs = async (list, sends): Promise<IMGSIZE[]> => {
		log.info(`分析剩余图片${list.length}张`)
		if (list.length) {
			const alist = await Promise.all(list.splice(0, 20).map(item => getImgSize(item)))
			sends.push(...alist)
			return await pickImgs(list, sends)
		} else {
			return sends
		}
	}

	result = await pickImgs(imgs, result)
	resolve(result)

})


const getImgList = (text) => {
	const imgs = text.match(/\/\/[a-zA-Z0-9_\.\/\-]*\.(jpeg|jpg|png|gif)/ig) || []
	const ecImgs = text.match(/ecommerce\/[a-zA-Z0-9_\.\/\-]*\.(jpeg|jpg|png|gif)/ig) || []
	const allImgs = imgs.concat(ecImgs.map(im => `//images.xxx.com/${im}`))
	return allImgs
}


const getImgSize = async(img): Promise<IMGSIZE> => {
	const src = `http:${img}`
	try {
		const response = await fetch(src, {
			timeout: 10000
		});
		const size = response.headers.get("content-length") || '0'
		return {
			src,
			size: +size,
			sizeKb: Math.floor(+size / 1024),
		}
	} catch(err) {
		return {
			src,
			error: err.toString()
		}
	}
}


export {
	schedule,
	perSchedule
}

async function autoScroll(){
	return new Promise(function (resolve, reject) {
		try {
			var totalHeight = 0;
			var distance = 100;
			let count = 0
			var timer = setInterval(() => {
					var scrollHeight = document.body.scrollHeight;
					window.scrollBy(0, distance);
					totalHeight += distance;
					count += 1
					// 最多滚动50次
					if(totalHeight >= scrollHeight || count > 100){
						clearInterval(timer);
						resolve(true);
					}
			}, 1000);
		} catch (err) {
			log.error(err.stash)
			reject(false)
		}
	});
}
