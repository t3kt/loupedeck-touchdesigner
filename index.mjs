import {discover} from 'loupedeck';
import * as osc from 'osc';

const inputPortNumber = 9240;
const outputPortNumber = 9239;

class OpState {
	constructor(opPath, opName, opDef) {
		this.opPath = opPath;
		this.opName = opName;
		this.parPageDefs = opDef.pages;
		this.currentParPageIndex = opDef.pageIndex || 0;
		this.parVals = {}
		this.selectedParGroup = null;
	}

	draw(device) {
		device.drawScreen('center', (c, w, h) => {
			c.fillStyle = '#990033';
			c.fillRect(0, 0, w, h);
			c.font = '20px Arial';
			c.fillStyle = 'white';
			c.fillText(this.opPath, 10, 30);
			c.fillText(this.opName, 10, 60);
			const pageDef = this.parPageDefs[this.currentParPageIndex];
			if (pageDef) {
				c.fillText(`Page: ${pageDef.name}`, 10, 90);
			}
		});
	}

	toString() {
		return `${this.opPath}:${this.opName}`;
	}
}

class Connector {
	constructor(device, oscOut, oscIn) {
		this.device = device;
		this.oscOut = oscOut;
		this.oscIn = oscIn;

		this.curParOwner = null;
		this.curParName = null;
		this.curParInfo = null;

		this.targetOpPath = null;
		this.targetOpName = null;
		this.targetOpDef = null;
		this.targetOpState = null;
	}

	open() {
		this.oscIn.on('error', this.onOscInError.bind(this));
		this.oscIn.on('message', this.onOscMessage.bind(this));

		this.oscOut.on('error', this.onOscOutError.bind(this));

		this.device.on('connect', this.onDeviceConnect.bind(this));
		this.device.on('down', this.onButtonDown.bind(this));
		this.device.on('rotate', this.onEncoderRotate.bind(this));

		this.oscIn.open();
		this.oscOut.open();
	}

	setCurrentTargetPar(opPath, parName, parInfo) {
		this.curParOwner = opPath;
		this.curParName = parName;
		this.curParInfo = parInfo;
		console.log(`Current target set to ${opPath}:${parName}`);
		this.updateDisplay();
	}

	setTargetOp(opPath, opName, opDef) {
		this.targetOpPath = opPath;
		this.targetOpName = opName;
		this.targetOpDef = opDef;
		this.targetOpState = !opDef ? null : new OpState(opPath, opName, opDef);
		console.log(`Target operation set to ${opPath}`);
		this.updateDisplay();
	}

	onDeviceConnect() {
		console.log('Device connected');
	}

	onButtonDown(button) {
		console.log('Button down:', button);
	}

	onEncoderRotate(encoder) {
		console.log('Encoder rotate:', encoder);
	}

	onOscInError(error) {
		console.error('OSC in error:', error);
	}

	onOscOutError(error) {
		console.error('OSC out error:', error);
	}

	onOscMessage(message, timeTag, info) {
		switch (message.address) {
			case '/loupedeck/targetPar/set':
				if (message.args.length === 3) {
					const opPath = message.args[0].value;
					const parName = message.args[1].value;
					const parInfoStr = message.args[2].value;
					const parInfo = JSON.parse(parInfoStr);
					this.setCurrentTargetPar(opPath, parName, parInfo);
				} else {
					console.error('Invalid arguments for /loupedeck/targetPar/set');
				}
				break;
			case '/loupedeck/targetPar/clear':
				this.setCurrentTargetPar(null, null, null);
				break;
				case '/loupedeck/targetOp/set':
				if (message.args.length === 3) {
					const opPath = message.args[0].value;
					const opName = message.args[1].value;
					const opDefStr = message.args[2].value;
					const opDef = JSON.parse(opDefStr);
					this.setTargetOp(opPath, opName, opDef);
				} else {
					console.error('Invalid arguments for /loupedeck/targetOp/set');
				}
				break;
			case '/loupedeck/targetOp/clear':
				this.setTargetOp(null, null, null);
				break;
			default:
				console.warn('Unrecognized OSC message received:', message);
		}
	}

	updateDisplay() {
		// this.device.drawScreen('center', (c, w, h) => {
		// 	c.fillStyle = '#990033';
		// 	c.fillRect(0, 0, w, h);
		// 	if (this.curParOwner) {
		// 		c.font = '20px Arial';
		// 		c.fillStyle = 'white';
		// 		c.fillText(this.curParOwner, 10, 30);
		// 	}
		// 	if (this.curParInfo) {
		// 		c.font = '16px Arial';
		// 		c.fillStyle = 'white';
		// 		let text = this.curParInfo.label;
		// 		if (this.curParInfo.subLabel) {
		// 			text += ` (${this.curParInfo.subLabel})`;
		// 		}
		// 		c.fillText(text, 10, 60);
		// 	}
		// });
		if (this.targetOpState) {
			this.targetOpState.draw(this.device);
		} else {
			this.device.drawScreen('center', (c, w, h) => {
				c.fillStyle = '#990033';
				c.fillRect(0, 0, w, h);
				c.font = '20px Arial';
				c.fillStyle = 'white';
				c.fillText('No target operator set', 10, 30);
			});
		}
	}
}

async function main() {
	let device;

	while (!device) {
		try {
			device = await discover();
		} catch (e) {
			console.error(`${e}. retry in 5 secs`);
			await new Promise((res) => setTimeout(res, 5000));
		}
	}

	const oscOut = new osc.default.UDPPort({
		remoteAddress: 'localhost',
		remotePort: outputPortNumber,
	});
	const oscIn = new osc.default.UDPPort({
		localAddress: '0.0.0.0',
		localPort: inputPortNumber,
		metadata: true,
	});

	const connector = new Connector(device, oscOut, oscIn);
	connector.open();
	// device.on('rotate', (encoder) => {
	// 	console.log('Encoder rotate:', encoder);
	// 	device.drawKey(0, (c) => {
	// 		c.fillStyle = 'red';
	// 		c.fillRect(0, 0, 100, 100);
	// 		c.fillStyle = 'white';
	// 		c.font = '20px Arial';
	// 		c.fillText('change ' + encoder.toString(), 10, 30);
	// 	});
	// 	oscOut.send({
	// 		address: '/loupedeck/encoder',
	// 		args: [encoder.toString()],
	// 	});
	// });
}

main().catch(console.error);
