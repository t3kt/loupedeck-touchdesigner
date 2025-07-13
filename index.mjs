import {discover} from 'loupedeck';
import * as osc from 'osc';

const portNumber = 9239;

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
		remotePort: portNumber,
	});
	oscOut.on('error', (error) => {
		console.error('OSC error:', error);
	});
	oscOut.open();

	device.on('connect', () => {
		console.log('Device connected');
	});
	device.on('down', (button) => {
		console.log('Button down:', button);
	});
	device.on('rotate', (encoder) => {
		console.log('Encoder rotate:', encoder);
		device.drawKey(0, (c) => {
			c.fillStyle = 'red';
			c.fillRect(0, 0, 100, 100);
			c.fillStyle = 'white';
			c.font = '20px Arial';
			c.fillText('change ' + encoder.toString(), 10, 30);
		});
		oscOut.send({
			address: '/loupedeck/encoder',
			args: [encoder.toString()],
		});
	});
}

main().catch(console.error);
