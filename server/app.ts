import koaStatic from 'koa-static'
import { promises as fs, createReadStream } from 'fs'
import Koa from 'koa'
import log4js from 'koa-log4'
import Router from '@koa/router'
import path from 'path'
import parse from 'co-body'
import stream from 'stream'
import { resultMap } from './utils/lru-result'
import { schedule, perSchedule } from './schedule'
import { accessLogger, systemLogger } from './log4'

const readable = stream.Readable

const app = new Koa();
const router = new Router()
const staticPath = '../.static'

// 静态资源
app.use(koaStatic(
  path.join( __dirname,  staticPath)
))
// logger
app.use(accessLogger())

router.get('/', (ctx, next) => {
	ctx.type = 'html';
  ctx.body = createReadStream(path.join(__dirname, '../.static', 'index.html'));
});

router.post('/api/puppeteer/start', async (ctx, next) => {
	let data = await parse(ctx);
	const postBody = JSON.parse(data)
	const { urlList, limit = 300, ignoreResize } = postBody
	const id = Date.now().toString()

	let result = []
	console.log(urlList)

	resultMap.put(id, urlList.map(url => ({ url, status: 'loading', list: [] })))

	result = await perSchedule(urlList, id, { limit, ignoreResize })

	ctx.body = {
		code: 0,
		result: {
			id,
			list: result,
			status: 'loading',
		},
		status: 'success'
	}
});

router.post('/api/start', async (ctx, next) => {
	let data = await parse(ctx);
	const postBody = JSON.parse(data)
	const { urlList, limit = 300, ignoreResize } = postBody
	const id = Date.now().toString()

	resultMap.put(id, urlList.map(url => ({ url, status: 'loading', list: [] })))

	const result = schedule(urlList, id, { limit, ignoreResize })

	ctx.body = {
		code: 0,
		result: {
			id,
			list: result,
			status: 'loading',
		},
		status: 'success'
	}
});

router.get('/api/result', async (ctx, next) => {
	const { id } = ctx.request.query
	const list = resultMap.get(id)
	const status = list && list.some(item => item.status === 'loading') ? 'loading' : 'finished'
	ctx.body = {
		code: 0,
		result: {
			id,
			list,
			status,
		},
		status: 'success'
	}
});

router.get('/api/download.json', async (ctx, next) => {
	const { id } = ctx.request.query
	const list = resultMap.get(id)
	const stm = new readable;
	stm.push(JSON.stringify(list));
	stm.push(null);
	ctx.attachment(`img-size-${id}.json`);
	ctx.response.set("content-type", "application/json");
	ctx.body = stm;
});

app
  .use(router.routes())
	.use(router.allowedMethods());
	
app.on('error', err => { systemLogger.error(err) });

// app.listen(3001);

// console.log('Hello word')

export default app
