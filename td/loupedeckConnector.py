import json

class LoupedeckConnector:
	def __init__(self, ownerComp):
		self.ownerComp = ownerComp
		# self.oscOut = ownerComp.op('oscout')
		self.server = ownerComp.op('webserver')
	
	def onSocketText(self, text):
		print('Receive Socket Text', text)
	
	def GetTargetOp(self):
		tgt = _targetFromPane(ui.panes.current)
		if tgt:
			return tgt
		for pane in ui.panes:
			tgt = _targetFromPane(pane)
			if tgt:
				return tgt
		return None
	
	def onTargetChange(self):
		target = self.GetTargetOp()
		if target is None:
			self._sendMessage({'address':'/loupedeck/targetOp/clear'})
		else:
			self._sendMessage({'address': '/loupedeck/targetOp/set','args': [target.path, target.name, _opDef(target)]})
	
	def onCurParChange(self, par):
		if par is None or par.isOP or par.isString or par.isSequence:
			self._sendMessage({'address':'/loupedeck/targetPar/clear'})
		else:
			self._sendMessage({'address':'/loupedeck/targetPar/set', 'args': [par.owner.path, par.name, _parInfo(par)]})

	def _sendMessage(self, data):
		print('Send message ', data)
		text = json.dumps(data)
		# self.oscOut.sendOSC(addr, args)
		for client in self.server.webSocketConnections:
			self.server.webSocketSendText(client, text)

def _targetFromPane(pane: Pane):
	if not pane or pane.type != PaneType.NETWORKEDITOR or pane.owner is None:
		return None
	return pane.owner.currentChild
	

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
def _opDef(op):
	return {
		'name': op.name,
		'path': op.path,
		'type': op.type,
		'pageIndex': op.par.pageindex.eval(),
		'pages': [_pageDef(page) for page in op.pages],
	}
def _pageDef(page: Page):
	return {
		'name': page.name,
		'parGroups': [_parGroupDef(pg) for pg in page.parGroups],
	}
def _parGroupDef(parGroup: ParGroup):
	if parGroup.isOP:
		return None
	return {
		'name': parGroup.name,
		'label': parGroup.label,
		'subLabel': parGroup.subLabel,
		'style': parGroup.style,
		'mode': [m.name for m in parGroup.mode],
		'enable': parGroup.enable,
		'readOnly': parGroup.readOnly,
		'min': parGroup.min,
		'max': parGroup.max,
		'clampMin': parGroup.clampMin,
		'clampMax': parGroup.clampMax,
		'default': parGroup.default,
		'normMin': parGroup.normMin,
		'normMax': parGroup.normMax,
		'menuNames': parGroup.menuNames,
		'menuLabels': parGroup.menuLabels,
		'value': parGroup.eval(),
	}