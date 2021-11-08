function createUser(req,res) {
	const { user, password } = req.body
	console.log(user,password);
	res.json('Success')
}

module.exports = { createUser }