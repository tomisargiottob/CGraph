
function enteringRequest(req,res,next) {
	console.log('llega una request');
	next()
}

module.exports = enteringRequest