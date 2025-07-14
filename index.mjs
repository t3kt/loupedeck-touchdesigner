import {discover} from 'loupedeck';
import * as osc from 'osc';

const inputPortNumber = 9240;
const outputPortNumber = 9239;

class Connector {
	constructor(device, oscOut, oscIn) {
		this.device = device;
		this.oscOut = oscOut;
		this.oscIn = oscIn;

		this.curOpPath = null;
		this.curParName = null;
		this.curParInfo = null;
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

	setCurrentTarget(opPath, parName, parInfo) {
		this.curOpPath = opPath;
		this.curParName = parName;
		this.curParInfo = parInfo;
		console.log(`Current target set to ${opPath}:${parName}`);
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
			case '/loupedeck/target/setPar':
				if (message.args.length === 3) {
					const opPath = message.args[0].value;
					const parName = message.args[1].value;
					const parInfoStr = message.args[2].value;
					const parInfo = JSON.parse(parInfoStr);
					this.setCurrentTarget(opPath, parName, parInfo);
				} else {
					console.error('Invalid arguments for /loupedeck/setCurrentTarget');
				}
				break;
			case '/loupedeck/target/clear':
				this.setCurrentTarget(null, null, null);
				break;
			default:
				console.warn('Unrecognized OSC message received:', message);
		}
	}

	updateDisplay() {
		this.device.drawScreen('center', (c, w, h) => {
			c.fillStyle = '#990033';
			c.fillRect(0, 0, w, h);
			if (this.curOpPath) {
				c.font = '20px Arial';
				c.fillStyle = 'white';
				c.fillText(this.curOpPath, 10, 30);
			}
			if (this.curParInfo) {
				c.font = '16px Arial';
				c.fillStyle = 'white';
				let text = this.curParInfo.label;
				if (this.curParInfo.subLabel) {
					text += ` (${this.curParInfo.subLabel})`;
				}
				c.fillText(text, 10, 60);
			}
		});
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
