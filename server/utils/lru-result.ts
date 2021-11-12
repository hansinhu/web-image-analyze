class LRUResult {
	result: any
	capacity: number
	constructor(capacity: number) {
		this.capacity = capacity
		this.result = new Map()
	}

	get (key) {
		if (!this.result.has(key)) {
			return -1
		}

		const val = this.result.get(key)
		this.result.delete(key)
		this.result.set(key, val)
		return val
	}

	put (key, val) {
		if (this.result.has(key)) {
			this.result.delete(key)
		} else if (this.result.size === this.capacity) {
			const delKey = this.result.keys().next().value
			this.result.delete(delKey)
		}
		this.result.set(key, val)
	}
}

const resultMap = new LRUResult(30)

export {
	resultMap,
}

export default LRUResult
