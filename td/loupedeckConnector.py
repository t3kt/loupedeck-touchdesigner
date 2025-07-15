import json
import TDJSON

class LoupedeckConnector:
	def __init__(self, ownerComp):
		self.ownerComp = ownerComp
		self.oscOut = ownerComp.op('oscout')
	
	def onReceiveOsc(self, address, args):
		print('Receive OSC', address, repr(args))
	
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
			self.oscOut.sendOSC('/loupedeck/targetOp/clear', [''])
		else:
			self.oscOut.sendOSC('/loupedeck/targetOp/set', [target.path, target.name, _opDef(target)])
	
	def onCurParChange(self, par):
		if par is None or par.isOP or par.isString or par.isSequence:
			self.oscOut.sendOSC('/loupedeck/targetPar/clear', [''])
		else:
			self.oscOut.sendOSC('/loupedeck/targetPar/set', [par.owner.path, par.name, json.dumps(_parInfo(par))])

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
		'pages': [_pageDef(page) for page in op.pages],
	}
def _pageDef(page: Page):
	return {
		'name': page.name,
		'parGroups': [_parGroupDef(pg) for pg in page.parGroups],
	}
def _parGroupDef(parGroup: ParGroup):
	return {
		'name': parGroup.name,
		'label': parGroup.label,
		'subLabel': parGroup.subLabel,
		'style': parGroup.style,
		'mode': [m.name for m in parGroup.mode],
		'enable': parGroup.enable,
		'readOnly': parGroup.readOnly,
		'min': par.min,
		'max': par.max,
		'clampMin': par.clampMin,
		'clampMax': par.clampMax,
		'default': par.default,
		'normMin': par.normMin,
		'normMax': par.normMax,
		'menuNames': par.menuNames,
		'menuLabels': par.menuLabels,
		'parDefs': [_parDef(p) for p in parGroup.pars],
	}