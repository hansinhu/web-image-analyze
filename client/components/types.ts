export interface ImgItem {
	src: string
	size?: number
	sizeKb?: number
	error?: string,
}

export interface ResultItem {
	url: string
	list: ImgItem[]
	status: 'loading' | 'finished'
}