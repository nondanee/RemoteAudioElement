const puppeteer = require('puppeteer-core')
const EventEmitter = require('events').EventEmitter

const methods = ['canPlayType', 'load', 'play', 'pause', 'fastSeek']
const events = ['abort', 'canplay', 'canplaythrough', 'durationchange', 'emptied', 'ended', 'error', 'loadeddata', 'loadedmetadata', 'loadstart', 'pause', 'play', 'playing', 'progress', 'ratechange', 'seeked', 'seeking', 'stalled', 'suspend', 'timeupdate', 'volumechange', 'waiting']
const properties = ['audioTracks', 'autoplay', 'buffered', 'crossOrigin', 'currentSrc', 'currentTime', 'defaultMuted', 'defaultPlaybackRate', 'duration', 'ended', 'error', 'loop', 'mediaGroup', 'muted', 'networkState', 'paused', 'playbackRate', 'played', 'preload', 'readyState', 'seekable', 'seeking', 'src', 'startDate', 'volume']

module.exports = function (url) {
	return (async () => {
		const browser = await puppeteer.launch({
			// headless: false,
			ignoreDefaultArgs: ['--mute-audio'],
			args: ['--autoplay-policy=no-user-gesture-required'],
			executablePath:
				process.env.PUPPETEER_EXECUTABLE_PATH ||
				{win32: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}[process.platform] ||
				'chrome'
		})
		const page = (await browser.pages())[0]
		
		const emitter = new EventEmitter()
		await page.exposeFunction('emitter', (type, data) => emitter.emit(type, data))
		
		const audioHandle = await page.evaluateHandle(url => (new Audio(url)), url)
		const dumpHandle = await page.evaluateHandle(() => value =>
			value instanceof TimeRanges ?
			Array.from(Array(value.length).keys()).map(index => ({
				start: value.start(index), end: value.end(index)
			})) : value
		)

		await page.evaluate((audio, events, properties, dump) => {
			const output = () => properties.reduce((result, key) => Object.assign(result, {[key]: dump(audio[key])}), {})
			events.forEach(type => audio.addEventListener(type, event => emitter(type, output())))
		}, audioHandle, events, properties, dumpHandle)

		return new Proxy({}, {
			get: (target, key) => {
				// console.log('get', key)
				if(key === 'dispose')
					return async () => await page.close()
				else if(key in emitter)
					return emitter[key]
				else if(['addEventListener', 'removeEventListener'].includes(key))
					return emitter[key.replace('Event', '')]
				else if(methods.includes(key))
					return async payload => await page.evaluate((audio, method, payload) => audio[method](payload), audioHandle, key, payload)
				else if(properties.includes(key))
					return (async () => await page.evaluate((audio, key, dump) => dump(audio[key]), audioHandle, key, dumpHandle))()
				else
					return undefined
			},	
			set: (target, key, value) => {
				// console.log('set', key, value)
				if(key.startsWith('on')){
					emitter.removeAllListeners(key.slice(2))
					if(value) emitter.on(key.slice(2), value)
				}
				else
					return (async () => await page.evaluate((audio, key, value) => audio[key] = value, audioHandle, key, value))()
			}
		})
	})()
}