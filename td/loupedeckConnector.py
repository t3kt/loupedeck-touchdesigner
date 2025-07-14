import json

class LoupedeckConnector:
	def __init__(self, ownerComp):
		self.ownerComp = ownerComp
		self.oscOut = ownerComp.op('oscout')
	
	def onReceiveOsc(self, address, args):
		print('Receive OSC', address, repr(args))
	
	def onCurParChange(self, par):
		if par is None or par.isOP or par.isString or par.isSequence:
			self.oscOut.sendOSC('/loupedeck/target/clear', [''])
		else:
			self.oscOut.sendOSC('/loupedeck/target/setPar', [par.owner.path, par.name, json.dumps(_parInfo(par))])

def _parInfo(par):
	return {
		'name': par.name,
		'label': par.label,
		'subLabel': par.subLabel if par.subLabel != par.label else None,
		'style': par.style,
		'mode': par.mode.name,
		'enable': par.enable,
		'vecIndex': par.vecIndex,
		'readOnly': par.readOnly,
		'min': par.min,
		'max': par.max,
		'clampMin': par.clampMin,
		'clampMax': par.clampMax,
		'default': par.default,
		'normMin': par.normMin,
		'normMax': par.normMax,
		'menuNames': par.menuNames,
		'menuLabels': par.menuLabels,
	}
