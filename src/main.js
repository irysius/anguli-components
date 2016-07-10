module.exports = {
	ControllerRouter: require('./ControllerRouter'),
	HubRouter: require('./HubRouter'),
	Hub: require('./Hub'),
	SessionFactory: require('./SessionFactory'),
	IdentityFactory: require('./IdentityFactory'),
	Modeller: require('./Modeller'),
	ErrorHandler: require('./ErrorHandler'),
	ControllerExtender: {
		authenticate: require('./AuthenticationExtender') 
	},
	RESTController: require('./RESTController')
};