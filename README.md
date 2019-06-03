# RemoteAudioElement

这是一个为 Node.js 提供 HTMLAudioElement 接口的库

*Powered by Puppeteer & Headless Chrome*

## About

想做一个 CLI 播放器，但是折腾了一圈最后还是发现 Windows, Linux, macOS 全平台兼容性 / 可控性最好的播放 (在线) 音乐方式是 `new Audio(url).play()`。木的办法，想了想如果要让可执行程序最小化的话只能通过调用本地浏览器了

使用 puppeteer 的 `page.evaluate()` 和 `page.exposeFunction()` 调用页面内的方法并传递监听事件，再用 Proxy 加一个兼容层，提供和 Audio Object 一致的 API

## Usage

> 支持 `PUPPETEER_EXECUTABLE_PATH` 变量，支持寻找默认安装位置，支持 `PATH` 变量 (优先级递减)

```sh
$ npm install nondanee/RemoteAudioElement
```

```javascript
const Audio = require('remote-audio-element')

;(async () => {
	let audio = await new Audio()

	audio.ontimeupdate = info => {
		console.log('currentTime', info.currentTime)
	}

	audio.addEventListener('loadedmetadata', info => {
		console.log('duration', info.duration)
	})

	audio.on('end', () => {
		audio.dispose()
	})

	await (audio.src = 'https://dl-web.dropbox.com/s/mzxthflt1kumqs1/BigBowlThickNoodle.mp3')
	await audio.play()
	console.log(await audio.buffered)
})()
```

## Documentation

> 具体请参考 HTMLAudioElement 的 MDN 文档

### Properties

`audioTracks`, `autoplay`, `buffered`, `crossOrigin`, `currentSrc`, `currentTime`, `defaultMuted`, `defaultPlaybackRate`, `duration`, `ended`, `error`, `loop`, `mediaGroup`, `muted`, `networkState`, `paused`, `playbackRate`, `played`, `preload`, `readyState`, `seekable`, `seeking`, `src`, `startDate`, `volume`

### Methods

`canPlayType`, `load`, `play`, `pause`, `fastSeek`, `dispose`

### Events

`abort`, `canplay`, `canplaythrough`, `durationchange`, `emptied`, `ended`, `error`, `loadeddata`, `loadedmetadata`, `loadstart`, `pause`, `play`, `playing`, `progress`, `ratechange`, `seeked`, `seeking`, `stalled`, `suspend`, `timeupdate`, `volumechange`, `waiting`

### Extra

set / get properties 以及 apply methods 均为 `Promise`，需要 `await` 等待调用完成；add Event Listener 不需要

因事件监听需要获得实时状态等不及 `await` 而做了优化，监听的事件的 event 接口已包含 audio 的所有属性值

添加 events 监听支持 Node.js EventEmitter 的所有方法，支持页面内的事件侦听器 (通过 `addEventListener` 注册函数) 和事件处理器 (通过 `on...` 属性注册函数)

`seekable`, `buffered`, `played` 属性返回的 TimeRanges 对象被序列化为 `[{start: 0, end: 100}]` 形式的 JSON object

调用 `audio.dispose()` 可以显式关闭 browser

## Reference

- [GoogleChrome/puppeteer](https://github.com/GoogleChrome/puppeteer)
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement
- https://www.w3schools.com/tags/ref_av_dom.asp