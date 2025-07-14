class LoupedeckConnector:
	def __init__(self, ownerComp):
		self.ownerComp = ownerComp
		self.oscOut = ownerComp.op('oscout')
	
	def onReceiveOsc(self, address, args):
		print('Receive OSC', address, repr(args))
	
	def onCurParChange(self, par):
		pass