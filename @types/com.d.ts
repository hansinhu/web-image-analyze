namespace COM {
	export interface IMGSIZE {
		src: string
		size?: number
		sizeKb?: number
		error?: string
	}

	export type ImgResultList = IMGSIZE[]
}
